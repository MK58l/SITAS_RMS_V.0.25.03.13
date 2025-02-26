import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // Set in .env
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOrderConfirmation = async (to, orderDetails) => {
  try {
    const emailTemplatePath = path.join(__dirname, '../templates/orderConfirmation.html');
    const emailTemplate = fs.existsSync(emailTemplatePath)
      ? fs.readFileSync(emailTemplatePath, 'utf8')
      : `<p>Hello {{customer_name}}, your order {{order_id}} of {{total_amount}} has been confirmed.</p>`;

    const emailContent = emailTemplate
      .replace('{{customer_name}}', orderDetails.customerName)
      .replace('{{order_id}}', orderDetails.orderId)
      .replace('{{total_amount}}', `$${orderDetails.totalAmount}`);

    const mailOptions = {
      from: `"Hotel Booking" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Order Confirmation',
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
