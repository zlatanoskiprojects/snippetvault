import {sendEmail} from '../email';


type WorkspaceInvitationEmailData = {
    to:string;
    inviterName:string;
    workspaceName:string;
    role:'editor' | 'viewer';
    invitationUrl:string;
    expiresAt:Date;
};

const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

function escapeHtml(value:string){
    return value.replace(/[&<>"']/g, (character) => htmlEntities[character]);
}

export async function sendWorkspaceInvitationEmail(data:WorkspaceInvitationEmailData){

    const role = data.role.charAt(0).toUpperCase() + data.role.slice(1);
    const expires = data.expiresAt.toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' });
    const inviter = escapeHtml(data.inviterName);
    const workspace = escapeHtml(data.workspaceName);
    const url = escapeHtml(data.invitationUrl);

 return sendEmail({
        to: data.to,

        subject:
            `${data.inviterName} invited you to ${data.workspaceName}`,

        text: `
${data.inviterName} invited you to join ${data.workspaceName} on SnippetVault.

Role: ${role}

Accept invitation:
${data.invitationUrl}

This invitation expires on ${expires}.
        `.trim(),

        html: `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:Inter,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#161616;border:1px solid #2a2a2a;border-radius:8px;">
        <tr><td style="padding:32px;">
          <p style="margin:0 0 24px;font-size:14px;font-weight:600;color:#6366f1;">SnippetVault</p>
          <h1 style="margin:0 0 12px;font-size:20px;color:#ffffff;">You've been invited to ${workspace}</h1>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#9ba3af;">
            ${inviter} invited you to join as <strong style="color:#ffffff;">${role}</strong>.
          </p>
          <a href="${url}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:6px;">Accept invitation</a>
          <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#595e69;">
            This invitation expires on ${expires}. If the button doesn't work, paste this link into your browser:<br>
            <a href="${url}" style="color:#9ba3af;word-break:break-all;">${url}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

}
