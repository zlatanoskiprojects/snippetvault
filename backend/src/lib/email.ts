import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
    to,
    subject,
    text,
}: {
    to: string;
    subject: string;
    text: string;
}): Promise<string> {
    try {
        const { data, error } = await resend.emails.send({
            from: 'SnippetVault <noreply@snippetvault.me>',
            to,
            subject,
            text,
        });

        if (error || !data?.id) {
            throw error ?? new Error('Resend did not return an email ID');
        }

        return data.id;
    } catch (error) {
        console.error('Failed to send email:', error);
        throw new Error('The verification email could not be sent');
    }
}
