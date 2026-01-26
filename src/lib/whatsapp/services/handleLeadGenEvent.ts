import { supabase } from '@/lib/supabase/server.supabase';
import { getCompanyFacebookLead } from '@/lib/marketing/services/company-ads';
import { sendMessageToWhatsApp } from './send';
import { sendTemplateMessage } from './sendTemplateMessage';
import { appendMessageToConversation } from './conversation';

export async function handleLeadGenEvent(leadgenId: string, pageId: string) {
  console.log(`[LeadGen] INICIO: Procesando lead ${leadgenId} para página ${pageId}`);

  // 1. Encontrar la compañía que posee esta página
  // Como no tenemos un mapeo directo, iteramos sobre las compañías activas
  // y probamos cuál tiene acceso al lead.
  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .eq('is_active', true);

  if (error || !companies) {
    console.error('[LeadGen] Error buscando compañías en DB:', error);
    return;
  }

  console.log(`[LeadGen] Se encontraron ${companies.length} empresas activas. Iniciando búsqueda del dueño del lead...`);

  let targetCompany = null;
  let leadData = null;

  for (const company of companies) {
    console.log(`[LeadGen] Probando empresa: ${company.name} (ID: ${company.id})`);
    try {
      // Intentar obtener el lead con el token de esta compañía
      // Si funciona, esta es la compañía correcta
      // Nota: getCompanyFacebookLead manejará el descifrado del token internamente si es necesario
      // a través de getCompanyFacebookConfig
      const lead = await getCompanyFacebookLead(company.id, leadgenId);
      if (lead) {
        console.log(`[LeadGen] ÉXITO: Lead encontrado con la empresa ${company.name}`);
        targetCompany = company;
        leadData = lead;
        break;
      }
    } catch (e: any) {
      // Si falla, probar con la siguiente compañía
      // Logueamos el error para depuración pero continuamos
      console.log(`[LeadGen] Falló con empresa ${company.name}: ${e.message}`);
      continue;
    }
  }

  if (!targetCompany || !leadData) {
    console.error('[LeadGen] No se encontró la compañía asociada al lead o no se pudo acceder a los datos.');
    return;
  }

  console.log(`[LeadGen] Compañía encontrada: ${targetCompany.name}`);
  console.log(`[LeadGen] Lead recibido: id=${leadData.id || 'N/A'} campaign=${leadData.campaign_name || 'N/A'} form=${leadData.form_id || 'N/A'}`);

  // 2. Formatear los datos del lead
  const fieldData = leadData.field_data || [];
  const formatField = (name: string) => {
    const field = fieldData.find((f: any) => f.name === name);
    return field ? field.values[0] : 'N/A';
  };

  const fullName = formatField('full_name');
  const phoneNumber = formatField('phone_number');
  const email = formatField('email');

  // Procesar preguntas personalizadas (campos que no son nombre/email/teléfono)
  const standardFields = ['full_name', 'phone_number', 'email'];
  const customFields = fieldData.filter((f: any) => !standardFields.includes(f.name));
  
  let customQuestionsText = '';
  if (customFields.length > 0) {
      customQuestionsText = '\n📋 *Respuestas Adicionales:*\n';
      customFields.forEach((f: any) => {
           const value = f.values.join(', ');
           // Limpiar un poco el nombre del campo si tiene guiones bajos
           const label = f.name.replace(/_/g, ' ');
           customQuestionsText += `🔹 *${label}:* ${value}\n`;
      });
  }

  // ---------------------------------------------------------
  // INTEGRACIÓN CON CRM (Bdatam)
  // 1. Guardar/Actualizar contacto con etiqueta 'lead'
  // 2. Insertar mensaje en la conversación para que aparezca en el inbox
  // ---------------------------------------------------------
  try {
      // 1. Obtener tags actuales
      const { data: existingContact } = await supabase
          .from('contacts')
          .select('tags')
          .eq('phone', phoneNumber)
          .eq('company_id', targetCompany.id)
          .maybeSingle();

      let newTags = ['lead'];
      if (existingContact?.tags && Array.isArray(existingContact.tags)) {
          if (!existingContact.tags.includes('lead')) {
              newTags = [...existingContact.tags, 'lead'];
          } else {
              newTags = existingContact.tags;
          }
      }

      // 2. Upsert Contacto
      // Nota: Si la columna 'status' tiene una restricción (check constraint), asegúrate de usar un valor válido.
      // Si 'lead' no es válido en tu DB, cámbialo a 'created', 'active' o null según tu esquema.
      // Intentaremos con 'active' si 'lead' falla, o mantenemos 'lead' si el usuario confirma que debe existir.
      // Por el error "contacts_status_check", parece que 'lead' NO es un valor permitido.
      // Usaremos 'active' o dejaremos el status actual si existe.
      
      // Usaremos 'new' que es un estado válido en la BD
      const statusToUse = existingContact ? undefined : 'new'; 
      
      const contactPayload: any = {
          phone: phoneNumber,
          name: fullName,
          company_id: targetCompany.id,
          tags: newTags,
          // updated_at: new Date().toISOString() // REMOVED
      };

      if (statusToUse) {
          contactPayload.status = statusToUse;
      }

      const { error: contactError } = await supabase
          .from('contacts')
          .upsert(contactPayload, { onConflict: 'phone,company_id' });

      if (contactError) {
          console.error('[LeadGen] Error guardando contacto en CRM:', contactError);
      } else {
          console.log('[LeadGen] Contacto guardado/actualizado en CRM con tag "lead"');
      }

      // 3. Insertar Mensaje en Conversación
      const crmMessage = `🔔 *Nuevo Lead Capturado*\n\n` +
          `👤 *Nombre:* ${fullName}\n` +
          `📞 *Teléfono:* ${phoneNumber}\n` +
          `📧 *Email:* ${email}\n` +
          `📝 *Campaña:* ${leadData.campaign_name || 'N/A'}\n` +
          customQuestionsText;

      await appendMessageToConversation(
          phoneNumber,
          crmMessage,
          `lead-${leadgenId}`, // ID único para evitar duplicados
          targetCompany.id,
          'assistant' // Usamos 'assistant' para que aparezca como mensaje del sistema/bot
      );
      console.log('[LeadGen] Mensaje de lead insertado en conversación CRM');

  } catch (crmError) {
      console.error('[LeadGen] Error general en integración CRM:', crmError);
  }

  // Construir mensaje para la empresa
  // Estrategia:
  // 1. Si existe LEAD_NOTIFICATION_NUMBER explícito en .env, enviar notificación externa.
  // 2. Si NO existe, NO enviar notificación al número de la empresa...
  
  const notificationNumber = process.env.LEAD_NOTIFICATION_NUMBER; // Eliminado fallback a targetCompany.whatsapp_number
  
  if (notificationNumber) {
    // 1. Intentar Template
    try {
        // Usar 'lead_notification' como default si el usuario lo creó, o fallback a 'menu_inicial'
        const notificationTemplate = process.env.LEAD_NOTIFICATION_TEMPLATE_NAME || 'lead_notification';
        const notificationLang = process.env.LEAD_NOTIFICATION_TEMPLATE_LANG || 'es';

        if (notificationTemplate === 'hello_world' || notificationTemplate === 'menu_inicial') {
            await sendTemplateMessage({
                to: notificationNumber,
                company: targetCompany,
                templateName: notificationTemplate,
                languageCode: notificationLang
            });
        } else {
             // Soporte futuro para plantillas con variables
             await sendTemplateMessage({
                to: notificationNumber,
                company: targetCompany,
                templateName: notificationTemplate,
                languageCode: notificationLang,
                components: [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: `Nuevo Lead: ${fullName} - ${phoneNumber}` }
                        ]
                    }
                ]
            });
        }
        console.log(`[LeadGen] Notificación (Plantilla ${notificationTemplate}) enviada a la empresa.`);
    } catch (error) {
        console.error('[LeadGen] Error enviando plantilla (no crítico si se envía el texto):', error);
    }

    // 2. Intentar Texto con Detalles Completos
    try {
        const companyMessage = `🔔 *Nuevo Lead Recibido* 🔔\n\n` +
            `👤 *Nombre:* ${fullName}\n` +
            `📞 *Teléfono:* ${phoneNumber}\n` +
            `📧 *Email:* ${email}\n` +
            `📋 *Campaña:* ${leadData.campaign_name || 'N/A'}\n` +
            `📝 *Formulario:* ${leadData.form_id || 'N/A'}\n` +
            `📅 *Fecha:* ${new Date(leadData.created_time).toLocaleString()}\n` +
            customQuestionsText +
            `\n_Enviado automáticamente por el sistema de leads_`;

        await sendMessageToWhatsApp({
            to: notificationNumber,
            message: companyMessage,
            company: {
                phone_number_id: targetCompany.phone_number_id,
                whatsapp_access_token: targetCompany.whatsapp_access_token
            }
        });
        console.log(`[LeadGen] Notificación (Texto con detalles) enviada a la empresa.`);
    } catch (error) {
         console.error('[LeadGen] Error enviando texto con detalles (probablemente ventana 24h cerrada):', error);
    }
  } else {
    console.warn('[LeadGen] No hay número de notificación configurado para la empresa');
  }

  const campaignName = leadData.campaign_name || '';
  const formId = leadData.form_id || '';
  let campaignTemplates: Record<string, { template: string; language?: string }> = {};
  let formTemplates: Record<string, { template: string; language?: string }> = {};

  if (process.env.LEAD_CAMPAIGN_TEMPLATES) {
    try {
      campaignTemplates = JSON.parse(process.env.LEAD_CAMPAIGN_TEMPLATES);
    } catch (e) {
      console.error('[LeadGen] Error parsing LEAD_CAMPAIGN_TEMPLATES:', e);
    }
  }

  if (process.env.LEAD_FORM_TEMPLATES) {
    try {
      formTemplates = JSON.parse(process.env.LEAD_FORM_TEMPLATES);
    } catch (e) {
      console.error('[LeadGen] Error parsing LEAD_FORM_TEMPLATES:', e);
    }
  }

  const shouldSendClientTemplate = process.env.LEAD_SEND_CLIENT_TEMPLATE === 'true';
  const templateConfig = formTemplates[formId] || campaignTemplates[campaignName];

  if (shouldSendClientTemplate && templateConfig && phoneNumber && phoneNumber !== 'N/A') {
    try {
      await sendTemplateMessage({
        to: phoneNumber,
        company: targetCompany,
        templateName: templateConfig.template,
        languageCode: templateConfig.language || 'es',
      });
      console.log(`[LeadGen] Template enviado al lead ${phoneNumber}`);
    } catch (e) {
      console.error('[LeadGen] Error enviando template al lead:', e);
    }
  } else {
    console.warn('[LeadGen] La compañía no tiene número de WhatsApp configurado.');
  }
}