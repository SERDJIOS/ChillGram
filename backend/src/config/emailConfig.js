const nodemailer = require('nodemailer');

// Создание транспортера для отправки email
const createTransporter = () => {
  // Для разработки используем Gmail
  // В продакшене лучше использовать SendGrid, AWS SES или другой сервис
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Ваш Gmail
      pass: process.env.EMAIL_PASS  // Пароль приложения Gmail
    }
  });
};

// Отправка email для сброса пароля
const sendResetPasswordEmail = async (email, resetToken, fullName) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'IceGram - Reset Your Password',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #262626; font-size: 32px; margin: 0;">IceGram</h1>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <h2 style="color: #262626; margin-bottom: 20px;">Hi ${fullName},</h2>
            
            <p style="color: #8e8e8e; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
              We received a request to reset your password for your IceGram account. 
              Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #0095f6; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; font-weight: 600;
                        display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #8e8e8e; font-size: 14px; line-height: 1.5;">
              If you didn't request this password reset, you can safely ignore this email. 
              This link will expire in 1 hour for security reasons.
            </p>
            
            <p style="color: #8e8e8e; font-size: 14px; line-height: 1.5;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #0095f6;">${resetUrl}</a>
            </p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <p style="color: #8e8e8e; font-size: 12px; margin: 0;">
              © 2024 IceGram. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    // Reset password email sent
    return true;
  } catch (error) {
    console.error('Error sending reset password email:', error);
    console.error('Email error details:', error.message);
    console.error('Email config:', {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS ? 'SET' : 'NOT SET'
    });
    return false;
  }
};

module.exports = {
  sendResetPasswordEmail
}; 