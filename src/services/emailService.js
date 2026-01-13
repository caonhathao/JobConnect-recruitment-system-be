const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendEmail = async (to, subject, htmlContent) => {
    try {
        const info = await transporter.sendMail({
            from: `"Project CanHan" <${process.env.SMTP_USER}>`, // sender address
            to: to,
            subject: subject,
            html: htmlContent,
        });
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email: ', error);
        return null;
    }
};

module.exports = {
    sendEmail
};
