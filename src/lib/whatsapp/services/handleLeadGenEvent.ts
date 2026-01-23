import { supabase } from '@/lib/supabase/server.supabase';
import { getCompanyFacebookLead } from '@/lib/marketing/services/company-ads';
import { sendMessageToWhatsApp } from './send';
import { sendTemplateMessage } from './sendTemplateMessage';

export async function handleLeadGenEvent(leadgenId: string, pageId: string) {
  console.log(`[LeadGen] Procesando lead ${leadgenId} para página ${pageId}`);

  // 1. Encontrar la compañía que posee esta página
  // Como no tenemos un mapeo directo, iteramos sobre las compañías activas
  // y probamos cuál tiene acceso al lead.
  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .eq('is_active', true);

  if (error || !companies) {
    console.error('[LeadGen] Error buscando compañías:', error);
    return;
  }

  let targetCompany = null;
  let leadData = null;

  for (const company of companies) {
    try {
      // Intentar obtener el lead con el token de esta compañía
      // Si funciona, esta es la compañía correcta
      // Nota: getCompanyFacebookLead manejará el descifrado del token internamente si es necesario
      // a través de getCompanyFacebookConfig
      const lead = await getCompanyFacebookLead(company.id, leadgenId);
      if (lead) {
        targetCompany = company;
        leadData = lead;
        break;
      }
    } catch (e) {
      // Si falla, probar con la siguiente compañía
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

  const notificationNumber = process.env.LEAD_NOTIFICATION_NUMBER || targetCompany.whatsapp_number;
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
  }

  if (notificationNumber) {
    const messageBody = `🔔 *Nuevo Lead Recibido* 🔔\n\n` +
      `👤 *Nombre:* ${fullName}\n` +
      `📞 *Teléfono:* ${phoneNumber}\n` +
      `📧 *Email:* ${email}\n` +
      `📝 *Formulario:* ${leadData.form_id}\n` +
      `📢 *Campaña:* ${campaignName || 'N/A'}\n` +
      `📅 *Fecha:* ${new Date(leadData.created_time).toLocaleString()}`;

    try {
      await sendMessageToWhatsApp({
        to: notificationNumber,
        message: messageBody,
        company: targetCompany,
      });
      console.log(`[LeadGen] Notificación enviada a ${notificationNumber}`);
    } catch (e: any) {
      console.error('[LeadGen] Error enviando notificación:', e);
      if (e.message?.includes('131030') || JSON.stringify(e).includes('131030')) {
        console.warn('[LeadGen] El número no ha iniciado conversación en las últimas 24h.');
      }
    }
  } else {
    console.warn('[LeadGen] La compañía no tiene número de WhatsApp configurado.');
  }
}
