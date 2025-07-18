const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Asegurarnos de que las variables de entorno estén cargadas
dotenv.config();

// Verificar que las credenciales existen
if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  console.error('Error: GMAIL_USER or GMAIL_APP_PASSWORD envvars not defined');
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
      subject: 'Please verify your email address for GastroBot',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFF8F0;">
          <h1 style="color: #FF914D; text-align: center;">Welcome to GastroBot</h1>
          <div style="background-color: #fff; padding: 24px; border-radius: 10px; box-shadow: 0 2px 12px rgba(255,145,77,0.08);">
            <p style="font-size: 16px; line-height: 1.5; color: #333333;">Thanks for joining us in GastroBot. Verify your account by clicking the button down below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}"
                 style="background-color: #FF914D; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 1.1rem; display: inline-block; box-shadow: 0 2px 8px rgba(255,145,77,0.10);">
                Verify my account
              </a>
            </div>
            <p style="font-size: 14px; color: #A0522D;">This link is valid for the next 24h.</p>
            <p style="font-size: 14px; color: #A0522D;">If you didn't create a GastroBot account, ignore this email.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #6FCF97;">
            <p>© 2024 GastroBot. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending mail:', error && error.response ? error.response : error);
    throw new Error('The verification email could not be sent: ' + (error && error.message ? error.message : error));
  }
};

module.exports = {
  sendVerificationEmail
}; 