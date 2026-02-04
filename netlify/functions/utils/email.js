import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
    },
});

/**
 * Send an email
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} [options.from] - Sender email (optional)
 * @param {string} [options.fromName] - Sender name (optional)
 * @returns {Promise<boolean>} Success status
 */
export async function sendEmail({ to, subject, html, from, fromName }) {
    try {
        const fromEmail = from || process.env.EMAIL_FROM || process.env.SMTP_USERNAME;
        const fromDisplay = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

        await transporter.sendMail({
            from: fromDisplay,
            to,
            subject,
            html,
        });
        return true;
    } catch (error) {
        console.error('Email send failed:', error);
        return false;
    }
}

/**
 * Predefined phishing scenarios for simulation
 */
export const PHISHING_SCENARIOS = {
    password_reset: {
        subject: '[긴급] 비밀번호 재설정이 필요합니다',
        from_name: '보안팀',
        template: 'password_reset',
    },
    payment_receipt: {
        subject: '결제가 완료되었습니다 - 영수증 확인',
        from_name: '결제센터',
        template: 'payment_receipt',
    },
    delivery_notice: {
        subject: '배송 실패 - 주소 확인 필요',
        from_name: '배송센터',
        template: 'delivery_notice',
    },
    account_verification: {
        subject: '계정 인증이 필요합니다',
        from_name: '고객센터',
        template: 'account_verification',
    },
};

/**
 * Generate a unique tracking token
 * @returns {string} UUID-like token
 */
export function generateTrackingToken() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Render a phishing email template
 * @param {string} templateName - Template name
 * @param {string} recipientName - Recipient name
 * @param {string} trackingToken - Tracking token for links
 * @param {string} [customMessage] - Optional custom message
 * @returns {string} HTML email content
 */
export function renderPhishingEmail(templateName, recipientName, trackingToken, customMessage = null) {
    const baseUrl = process.env.URL || 'http://localhost:8888';
    const trackingUrl = `${baseUrl}/.netlify/functions/tracking?action=click&id=${trackingToken}`;
    const pixelUrl = `${baseUrl}/.netlify/functions/tracking?action=open&id=${trackingToken}`;

    const templates = {
        password_reset: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>안녕하세요, ${recipientName}님</h2>
                <p>귀하의 계정에서 비정상적인 활동이 감지되었습니다.</p>
                <p>계정 보안을 위해 즉시 비밀번호를 재설정해 주세요.</p>
                ${customMessage ? `<p>${customMessage}</p>` : ''}
                <a href="${trackingUrl}" style="display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">비밀번호 재설정</a>
                <p style="color: #666; font-size: 12px; margin-top: 20px;">이 링크는 24시간 후 만료됩니다.</p>
                <img src="${pixelUrl}" width="1" height="1" style="display:none" />
            </div>
        `,
        payment_receipt: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>결제 완료 알림</h2>
                <p>${recipientName}님, 결제가 성공적으로 처리되었습니다.</p>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
                    <p><strong>결제 금액:</strong> 149,000원</p>
                    <p><strong>결제 일시:</strong> ${new Date().toLocaleString('ko-KR')}</p>
                </div>
                ${customMessage ? `<p>${customMessage}</p>` : ''}
                <p>결제 내역을 확인하시려면 아래 버튼을 클릭하세요.</p>
                <a href="${trackingUrl}" style="display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">영수증 확인</a>
                <img src="${pixelUrl}" width="1" height="1" style="display:none" />
            </div>
        `,
        delivery_notice: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>배송 실패 안내</h2>
                <p>${recipientName}님, 고객님의 택배 배송이 실패했습니다.</p>
                <p>주소가 불명확하여 배송이 진행되지 않았습니다.</p>
                ${customMessage ? `<p>${customMessage}</p>` : ''}
                <p>재배송을 위해 주소를 확인해 주세요.</p>
                <a href="${trackingUrl}" style="display: inline-block; padding: 12px 24px; background-color: #fd7e14; color: white; text-decoration: none; border-radius: 5px;">주소 확인</a>
                <img src="${pixelUrl}" width="1" height="1" style="display:none" />
            </div>
        `,
        account_verification: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>계정 인증 필요</h2>
                <p>${recipientName}님, 계정 보안 강화를 위해 본인 인증이 필요합니다.</p>
                ${customMessage ? `<p>${customMessage}</p>` : ''}
                <p>아래 버튼을 클릭하여 인증을 완료해 주세요.</p>
                <a href="${trackingUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">본인 인증</a>
                <img src="${pixelUrl}" width="1" height="1" style="display:none" />
            </div>
        `,
    };

    return templates[templateName] || templates.password_reset;
}

/**
 * Send a phishing simulation email
 * @param {object} options - Email options
 * @param {string} options.toEmail - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.bodyHtml - Email HTML content
 * @param {string} options.senderName - Sender display name
 * @returns {Promise<boolean>} Success status
 */
export async function sendPhishingEmail({ toEmail, subject, bodyHtml, senderName }) {
    return await sendEmail({
        to: toEmail,
        subject,
        html: bodyHtml,
        fromName: senderName,
    });
}
