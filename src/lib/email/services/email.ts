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
        try {
            this.transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
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
        } catch (error) {
            console.error('❌ Error creando transporter:', error);
            throw error;
        }
    }

    async sendEmail(options: SendMailOptions) {
        const { from, to, subject, htmlBody, attachments = [] } = options;
        if (!this.postToProvider) {
            return true;
        }
        try {
            const sentInformation = await this.transporter.sendMail({
                from,
                to,
                subject,
                html: htmlBody,
                attachments,
            });
            return true;

        } catch (error) {
            return false;
        }
    }
}