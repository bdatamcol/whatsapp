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
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            service: mailerService,
            port,
            auth: {
                user: mailerEmail,
                pass: SenderEmailPassword,
            },
            tls: {
                rejectUnauthorized: false
            }

        });
    }


    async sendEmail(options: SendMailOptions) {

        const { from, to, subject, htmlBody, attachments = [] } = options;

        try {

            if (!this.postToProvider) return true;

            const sentInformation = await this.transporter.sendMail({
                from,
                to,
                subject,
                html: htmlBody,
                attachments,
            });

            return true;

        } catch (error) {
            console.log(error);
            return false;
        }

    }
}