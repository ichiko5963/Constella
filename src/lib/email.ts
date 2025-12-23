/**
 * メール送信機能
 * Resendを使用したメール送信
 */

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

/**
 * メールを送信
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    if (!resend) {
        console.warn('Resend API key not configured, email sending is disabled');
        return { success: false, error: 'Email service not configured' };
    }

    try {
        const result = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Actory <noreply@actory.app>',
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });

        if (result.error) {
            console.error('Failed to send email:', result.error);
            return { success: false, error: result.error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error: 'Failed to send email' };
    }
}

/**
 * 予約確認メールを送信
 */
export async function sendBookingConfirmationEmail(
    attendeeEmail: string,
    attendeeName: string,
    startTime: Date,
    endTime: Date,
    meetLink?: string | null,
    title?: string
): Promise<{ success: boolean; error?: string }> {
    const formatDateTime = (date: Date) => {
        return date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #00D4AA 0%, #0D7377 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .button { display: inline-block; padding: 12px 24px; background: #00D4AA; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>予約が確定しました</h1>
                </div>
                <div class="content">
                    <p>${attendeeName}様</p>
                    <p>この度は、Actoryの予約システムをご利用いただき、ありがとうございます。</p>
                    
                    <div class="info">
                        <h3>予約詳細</h3>
                        <p><strong>タイトル:</strong> ${title || '会議'}</p>
                        <p><strong>日時:</strong> ${formatDateTime(startTime)} - ${formatDateTime(endTime)}</p>
                    </div>

                    ${meetLink ? `
                        <div class="info">
                            <h3>Google Meetリンク</h3>
                            <p>以下のリンクから会議に参加できます：</p>
                            <a href="${meetLink}" class="button">会議に参加</a>
                            <p style="font-size: 12px; color: #666; margin-top: 10px;">${meetLink}</p>
                        </div>
                    ` : ''}

                    <p style="margin-top: 30px; font-size: 14px; color: #666;">
                        ご質問がございましたら、お気軽にお問い合わせください。
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail({
        to: attendeeEmail,
        subject: `予約確定: ${title || '会議'} - ${formatDateTime(startTime)}`,
        html,
        text: `
${attendeeName}様

予約が確定しました。

タイトル: ${title || '会議'}
日時: ${formatDateTime(startTime)} - ${formatDateTime(endTime)}
${meetLink ? `\nGoogle Meetリンク: ${meetLink}` : ''}

ご質問がございましたら、お気軽にお問い合わせください。
        `.trim(),
    });
}
