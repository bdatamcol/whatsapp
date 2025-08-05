import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendMailOptions {
    from: string;
    to: string | string[];
    subject: string;
    htmlBody: string;
    attachments?: any[]
}

export class EmailService {
    private transporter: Transporter;

    constructor(
        mailerService: string,
        mailerEmail: string,
        SenderEmailPassword: string,
        port: number,
        private readonly postToProvider: boolean,
    ) {
        console.log('=== EMAIL SERVICE CONFIGURATION ===');
        console.log('MAILER_SERVICE:', mailerService);
        console.log('MAILER_EMAIL:', mailerEmail ? '***@***.***' : 'NOT SET');
        console.log('MAILER_PORT:', port);
        console.log('SEND_EMAIL:', postToProvider);

        try {
            this.transporter = nodemailer.createTransport({
                host: 'smtp.mailersend.net',
                port: port,
                secure: false,
                auth: {
                    user: mailerEmail,
                    pass: SenderEmailPassword,
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
            console.log('✅ Transporter creado exitosamente');
        } catch (error) {
            console.error('❌ Error creando transporter:', error);
            throw error;
        }
    }

    async sendEmail(options: SendMailOptions) {
        const { from, to, subject, htmlBody, attachments = [] } = options;

        console.log('=== INTENTANDO ENVIAR EMAIL ===');
        console.log('From:', from);
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('SEND_EMAIL enabled:', this.postToProvider);

        if (!this.postToProvider) {
            console.log('⚠️ SEND_EMAIL=false, saltando envío');
            return true;
        }

        try {
            console.log('📧 Enviando email...');
            const sentInformation = await this.transporter.sendMail({
                from,
                to,
                subject,
                html: htmlBody,
                attachments,
            });

            console.log('✅ Email enviado exitosamente');
            console.log('Message ID:', sentInformation.messageId);
            console.log('Response:', sentInformation.response);
            return true;

        } catch (error) {
            console.error('❌ Error al enviar email:');
            console.error('Error completo:', error);
            console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
            console.error('Error code:', (error as any)?.code);
            console.error('Error command:', (error as any)?.command);
            return false;
        }
    }
}