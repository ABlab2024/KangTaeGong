const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    try {
        const { to, subject, html, from_name } = JSON.parse(event.body);

        if (!to || !subject || !html) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing required fields' }),
            };
        }

        // SMTP Configuration from Environment Variables
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const sender = process.env.SENDER_EMAIL || process.env.SMTP_USER;
        const from = from_name ? `"${from_name}" <${sender}>` : sender;

        const info = await transporter.sendMail({
            from: from,
            to: to,
            subject: subject,
            html: html,
        });

        console.log('Message sent: %s', info.messageId);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, messageId: info.messageId }),
        };

    } catch (error) {
        console.error('Error sending email:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: error.message }),
        };
    }
};
