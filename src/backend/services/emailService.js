const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Asegurarnos de que las variables de entorno estén cargadas
dotenv.config();

// Verificar que las credenciales existen
if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  console.error('Error: GMAIL_USER o GMAIL_APP_PASSWORD no están definidas en las variables de entorno');
  process.exit(1);
}

// Crear el transporter de nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

const sendVerificationEmail = async (email, token) => {
  try {
    const verificationUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${token}`;
    
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Verifica tu cuenta de GastroBot',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ff7a00; text-align: center;">Bienvenido a GastroBot</h1>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <p style="font-size: 16px; line-height: 1.5;">Gracias por registrarte en GastroBot. Para comenzar a usar tu cuenta, por favor verifica tu dirección de correo electrónico haciendo clic en el botón de abajo:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #ff7a00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Verificar mi cuenta
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">Este enlace expirará en 24 horas.</p>
            <p style="font-size: 14px; color: #666;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
            <p>© 2024 GastroBot. Todos los derechos reservados.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email enviado exitosamente');
    return true;
  } catch (error) {
    console.error('Error real al enviar email de verificación:', error && error.response ? error.response : error);
    throw new Error('No se pudo enviar el email de verificación: ' + (error && error.message ? error.message : error));
  }
};

module.exports = {
  sendVerificationEmail
}; 