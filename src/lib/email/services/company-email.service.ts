import { EmailService, SendMailOptions } from './email';
import { companyVerificationTemplate } from '../templates/company-verification';

export class CompanyEmailService {
    private emailService: EmailService;

    constructor() {

        this.emailService = new EmailService(
            process.env.MAILER_SERVICE!,
            process.env.MAILER_EMAIL!,
            process.env.MAILER_SECRET_KEY!,
            parseInt(process.env.MAILER_PORT || '587'),
            process.env.SEND_EMAIL === 'true'
        );
    }

    async sendCompanyVerificationEmail(email: string, companyName: string, verificationToken: string) {
        const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/verify-email/${verificationToken}`;

        const mailOptions: SendMailOptions = {
            from: process.env.MAILER_EMAIL,
            to: email,
            subject: `Verifica tu cuenta - ${companyName}`,
            htmlBody: companyVerificationTemplate(companyName, verificationUrl)
        };
        const result = await this.emailService.sendEmail(mailOptions);
        return result;
    }
}