import { sendTemplateMessage } from './sendTemplateMessage';
import { supabase } from '@/lib/supabase/server.supabase';

interface LeadField {
    name: string;
    values: string[];
}

interface Lead {
    id: string;
    created_time: string;
    field_data: LeadField[];
}

interface Company {
    id: string;
    phone_number_id: string;
    whatsapp_access_token: string;
}

export class LeadsProcessor {

    /**
     * Extrae números de WhatsApp válidos de los campos de un lead
     */
    private static extractWhatsAppNumbers(fieldData: LeadField[]): string[] {
        console.log('fieldData', fieldData);
        const phonePatterns = [
            /(?:whatsapp|teléfono|phone|celular|móvil)/i,
            /\+?[\d\s\-\(\)]{10,15}/,
            /(?:\+?\d{1,3})?[-.\s]?(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{4})/
        ];
        const whatsappNumbers: string[] = [];

        for (const field of fieldData) {
            const fieldName = field.name.toLowerCase();

            // Buscar campos que contengan información de WhatsApp o teléfono
            if (phonePatterns[0].test(fieldName)) {
                for (const value of field.values) {
                    const cleanedNumber = this.cleanWhatsAppNumber(value);
                    if (cleanedNumber) {
                        whatsappNumbers.push(cleanedNumber);
                    }
                }
            }

            // También buscar en otros campos que puedan contener números
            for (const value of field.values) {
                const phoneMatch = value.match(/\+?[\d\s\-\(\)]{10,15}/);
                if (phoneMatch) {
                    const cleanedNumber = this.cleanWhatsAppNumber(phoneMatch[0]);
                    if (cleanedNumber && !whatsappNumbers.includes(cleanedNumber)) {
                        whatsappNumbers.push(cleanedNumber);
                    }
                }
            }
        }

        return [...new Set(whatsappNumbers)]; // Eliminar duplicados
    }

    /**
     * Limpia y formatea el número de WhatsApp
     */
    private static cleanWhatsAppNumber(phone: string): string | null {
        // Eliminar espacios, guiones y paréntesis
        let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

        // Si empieza con +, mantenerlo
        if (cleaned.startsWith('+')) {
            cleaned = cleaned.substring(1);
        }

        // Validar que sea un número válido (solo dígitos)
        if (!/^\d{10,15}$/.test(cleaned)) {
            return null;
        }

        // Agregar código de país si no tiene (asumir Colombia +57)
        if (cleaned.length === 10 && !cleaned.startsWith('57')) {
            cleaned = '57' + cleaned;
        }

        return cleaned;
    }

    /**
     * Procesa leads y envía plantillas de WhatsApp
     */
    static async processLeadsAndSendTemplates(
        leads: Lead[],
        companyId: string,
        templateName: string = 'menu_inicial'
    ): Promise<{
        success: boolean;
        processed: number;
        sent: number;
        failed: number;
        errors: string[];
    }> {

        try {
            // Obtener información de la empresa
            const { data: company } = await supabase
                .from('companies')
                .select('id, phone_number_id, whatsapp_access_token')
                .eq('id', companyId)
                .single();
            console.log('company', company);
            if (!company) {
                throw new Error('Empresa no encontrada');
            }

            const results = {
                success: true,
                processed: 0,
                sent: 0,
                failed: 0,
                errors: []
            };

            for (const lead of leads) {
                try {
                    results.processed++;

                    const whatsappNumbers = this.extractWhatsAppNumbers(lead.field_data);

                    console.log('whatsappNumbers', whatsappNumbers);

                    if (whatsappNumbers.length === 0) {
                        results.errors.push(`Lead ${lead.id}: No se encontró número de WhatsApp`);
                        results.failed++;
                        continue;
                    }

                    // Enviar plantilla a cada número encontrado
                    for (const phoneNumber of whatsappNumbers) {
                        try {
                            await sendTemplateMessage({
                                to: phoneNumber,
                                company: {
                                    phone_number_id: company.phone_number_id,
                                    whatsapp_access_token: company.whatsapp_access_token
                                },
                                templateName
                            });

                            results.sent++;

                            // Registrar en base de datos que se envió
                            await this.registerLeadMessage(lead.id, phoneNumber, companyId, templateName);

                        } catch (error) {
                            results.errors.push(`Error enviando a ${phoneNumber}: ${error.message}`);
                            results.failed++;
                        }
                    }

                } catch (error) {
                    results.errors.push(`Error procesando lead ${lead.id}: ${error.message}`);
                    results.failed++;
                }
            }

            return results;

        } catch (error) {
            return {
                success: false,
                processed: 0,
                sent: 0,
                failed: leads.length,
                errors: [error.message]
            };
        }
    }

    /**
     * Registra el envío de mensaje a un lead
     */
    private static async registerLeadMessage(
        leadId: string,
        phoneNumber: string,
        companyId: string,
        templateName: string
    ): Promise<void> {
        await supabase.from('lead_messages').insert({
            lead_id: leadId,
            phone_number: phoneNumber,
            company_id: companyId,
            template_name: templateName,
            sent_at: new Date().toISOString(),
            status: 'sent'
        });
    }

    /**
     * Obtiene leads desde la API y los procesa
     */
    static async fetchAndProcessLeads(
        pageId: string,
        pageAccessToken: string,
        formId: string,
        cursor: string,
        companyId: string,
        templateName?: string
    ): Promise<{
        success: boolean;
        processed: number;
        sent: number;
        failed: number;
        errors: string[];
    }> {
        try {
            const baseUrl = 'http://localhost:3000';
            const response = await fetch(`${baseUrl}/api/leads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pageId,
                    pageAccessToken,
                    formId,
                    cursor,
                    limit: 100
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();
            console.log('Respuesta de API leads:', responseData);

            // Verificar la estructura correcta de la respuesta
            const leads = responseData.data || responseData;
            console.log('Leads procesados:', leads);

            if (!leads || leads.length === 0) {
                return {
                    success: true,
                    processed: 0,
                    sent: 0,
                    failed: 0,
                    errors: ['No hay leads para procesar']
                };
            }

            return await this.processLeadsAndSendTemplates(leads, companyId, templateName);

        } catch (error) {
            console.error('Error en fetchAndProcessLeads:', error);
            return {
                success: false,
                processed: 0,
                sent: 0,
                failed: 0,
                errors: [error.message]
            };
        }
    }
}