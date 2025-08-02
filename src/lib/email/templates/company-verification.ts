export const companyVerificationTemplate = (companyName: string, verificationUrl: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificación de Cuenta - ${companyName}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">¡Bienvenido a WhatsApp Clean!</h1>
            <p style="color: #666; font-size: 16px;">Verifica tu cuenta de empresa</p>
        </div>
        
        <div style="margin-bottom: 30px;">
            <h2 style="color: #333; margin-bottom: 15px;">Hola ${companyName},</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Gracias por registrarte en WhatsApp Clean. Para completar el proceso de registro y activar tu cuenta, por favor verifica tu dirección de correo electrónico haciendo clic en el botón de abajo.
            </p>
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
            <a href="${verificationUrl}" 
               style="background-color: #25D366; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Verificar Cuenta
            </a>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
            <p style="color: #666; font-size: 14px; margin: 0;">
                <strong>¿No funciona el botón?</strong> Copia y pega este enlace en tu navegador:
            </p>
            <p style="color: #007bff; font-size: 12px; word-break: break-all; margin: 10px 0 0 0;">
                ${verificationUrl}
            </p>
        </div>
        
        <div style="text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
            <p style="color: #999; font-size: 12px;">
                Este enlace expirará en 24 horas. Si no solicitaste esta verificación, puedes ignorar este correo.
            </p>
        </div>
    </div>
</body>
</html>
`;