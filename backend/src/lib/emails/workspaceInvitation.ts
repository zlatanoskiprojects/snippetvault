import {sendEmail} from '../email';


type WorkspaceInvitationEmailData = {
    to:string;
    inviterName:string;
    workspaceName:string;
    role:'editor' | 'viewer';
    invitationUrl:string;
    expiresAt:Date;
};

export async function sendWorkspaceInvitationEmail(data:WorkspaceInvitationEmailData){

 return sendEmail({
        to: data.to,

        subject:
            `${data.inviterName} invited you to ${data.workspaceName}`,

        text: `
${data.inviterName} invited you to join ${data.workspaceName} on SnippetVault.

Role: ${data.role}

Accept invitation:
${data.invitationUrl}

This invitation expires on ${data.expiresAt.toLocaleDateString()}.
        `.trim(),
    });

}