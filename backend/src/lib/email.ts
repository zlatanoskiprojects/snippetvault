import { Resend } from 'resend';

function requireEnvironmentVariable(name: 'RESEND_API_KEY' | 'EMAIL_FROM'): string {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`${name} must be set`);
    }
    return value;
}

const resendApiKey = requireEnvironmentVariable('RESEND_API_KEY');
const emailFrom = requireEnvironmentVariable('EMAIL_FROM');
const resend = new Resend(resendApiKey);

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
            from: emailFrom,
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
