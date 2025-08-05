import { EmailService, SendMailOptions } from './email';
import { companyVerificationTemplate } from '../templates/company-verification';

export class CompanyEmailService {
    private emailService: EmailService;

    constructor() {
        console.log('=== COMPANY EMAIL SERVICE INIT ===');
        console.log('MAILER_SERVICE:', process.env.MAILER_SERVICE);
        console.log('MAILER_EMAIL:', process.env.MAILER_EMAIL);
        console.log('MAILER_PORT:', process.env.MAILER_PORT);
        console.log('SEND_EMAIL:', process.env.SEND_EMAIL);

        this.emailService = new EmailService(
            process.env.MAILER_SERVICE!,
            process.env.MAILER_EMAIL!,
            process.env.MAILER_SECRET_KEY!,
            parseInt(process.env.MAILER_PORT || '587'),
            process.env.SEND_EMAIL === 'true'
        );
    }

    async sendCompanyVerificationEmail(email: string, companyName: string, verificationToken: string) {
        console.log('=== PREPARANDO EMAIL DE VERIFICACIÓN ===');
        console.log('Company:', companyName);
        console.log('Email:', email);
        console.log('Token:', verificationToken);

        const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/verify-email/${verificationToken}`;
        console.log('Verification URL:', verificationUrl);

        const mailOptions: SendMailOptions = {
            from: process.env.MAILER_EMAIL,
            to: email,
            subject: `Verifica tu cuenta - ${companyName}`,
            htmlBody: companyVerificationTemplate(companyName, verificationUrl)
        };

        console.log('📤 Enviando email de verificación...');
        const result = await this.emailService.sendEmail(mailOptions);
        console.log('📊 Resultado del envío:', result);
        return result;
    }
}