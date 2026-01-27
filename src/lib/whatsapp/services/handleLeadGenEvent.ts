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
    return field ? field.values[0] : null;
  };

  let fullName = formatField('full_name');
  if (!fullName) {
      const firstName = formatField('first_name') || '';
      const lastName = formatField('last_name') || '';
      if (firstName || lastName) {
          fullName = `${firstName} ${lastName}`.trim();
      } else {
          fullName = 'N/A';
      }
  }

  const phoneNumber = formatField('phone_number') || 'N/A';
  const email = formatField('email') || 'N/A';

  // Procesar preguntas personalizadas (campos que no son nombre/email/teléfono)
  const standardFields = ['full_name', 'phone_number', 'email', 'first_name', 'last_name'];
  const customFields = fieldData.filter((f: any) => !standardFields.includes(f.name));
  
  let customQuestionsText = '';
  if (customFields.length > 0) {
      customQuestionsText = '\n📋 *Respuestas Adicionales:*\n';
      customFields.forEach((f: any) => {
           // Antes fallaba aquí si f.values era undefined
           const value = Array.isArray(f.values) ? f.values.join(', ') : (f.values || 'N/A');
           // Limpiar un poco el nombre del campo si tiene guiones bajos
           const label = f.name ? f.name.replace(/_/g, ' ') : 'Pregunta';
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
      
      // Personalizar nombre para incluir campaña (petición del usuario)
      const campaignSuffix = leadData.campaign_name ? ` (${leadData.campaign_name})` : '';
      const displayName = `${fullName}${campaignSuffix}`;

      const contactPayload: any = {
          phone: phoneNumber,
          name: displayName, // Actualizar nombre con campaña
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
      const crmMessage = `🌟 *NUEVO LEAD OBTENIDO* 🌟\n\n` +
          `👤 *Nombre:* ${fullName}\n` +
          `📱 *Teléfono:* ${phoneNumber}\n` +
          `📧 *Email:* ${email}\n` +
          `🎯 *Campaña:* ${leadData.campaign_name || 'N/A'}\n` +
          `📅 *Fecha:* ${new Date().toLocaleString()}\n` +
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
  // ... Desactivando notificación externa
  // *** CAMBIO: Se comenta la lógica de notificación externa porque ahora todo llega al CRM interno ***
  /*
  const notificationNumber = process.env.LEAD_NOTIFICATION_NUMBER; 
  
  if (notificationNumber) {
    // ... lógica de envío ...
  } else {
    console.warn('[LeadGen] No hay número de notificación configurado para la empresa');
  }
  */
  console.log('[LeadGen] Notificación externa deshabilitada (CRM integration activa).');

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