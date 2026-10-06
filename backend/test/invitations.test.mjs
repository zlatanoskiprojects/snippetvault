import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { startServer, stopServer, resetDb, api, makeTeam, makeWorkspace, getUser, addMember, db, workspaceInvitation, workspaceMember, workspace, eq, and, sentEmails, emailControl, lastInvitationToken } from './helpers.mjs';

const require = createRequire(import.meta.url);
const { generateInvitationToken } = require(path.resolve('build/lib/invitationToken.js'));

let t;
let invitee;
beforeAll(async () => {
    await startServer();
    invitee = await getUser('invitee');
});
afterAll(stopServer);
beforeEach(async () => {
    await resetDb();
    sentEmails.length = 0;
    emailControl.fail = false;
    t = await makeTeam();
});

const invUrl = (ws = t.ws) => `/api/workspaces/${ws.id}/invitations`;
const invite = (user, body, ws = t.ws) => api('POST', invUrl(ws), { user, body });
const rows = (ws = t.ws) => db.select().from(workspaceInvitation).where(eq(workspaceInvitation.workspaceId, ws.id));

async function seed({ email = invitee.email, role = 'editor', status = 'pending', expiresInMs = 3600000, ws = t.ws } = {}) {
    const { token, tokenHash } = generateInvitationToken();
    const [row] = await db.insert(workspaceInvitation).values({
        workspaceId: ws.id, email, invitedByUserId: t.owner.id, role, tokenHash, status, expiresAt: new Date(Date.now() + expiresInMs),
    }).returning();
    return { ...row, token };
}

describe('POST /workspaces/:id/invitations', () => {
    it('401 unauthenticated', async () => {
        expect((await invite(undefined, { email: 'a@b.co', role: 'editor' })).status).toBe(401);
    });

    it('owner only: editor/viewer 403, outsider 404', async () => {
        const body = { email: 'x@example.com', role: 'viewer' };
        expect((await invite(t.editor, body)).status).toBe(403);
        expect((await invite(t.viewer, body)).status).toBe(403);
        expect((await invite(t.outsider, body)).status).toBe(404);
        expect(await rows()).toHaveLength(0);
        expect(sentEmails).toHaveLength(0);
    });

    it('creates invitation, stores only the hash, 24h expiry, emails the raw token', async () => {
        const r = await invite(t.owner, { email: '  New.User@Example.COM ', role: 'editor' });
        expect(r.status).toBe(201);
        const [row] = await rows();
        expect(row.email).toBe('new.user@example.com');
        expect(row.role).toBe('editor');
        expect(row.status).toBe('pending');
        const token = lastInvitationToken();
        expect(row.tokenHash).toBe(createHash('sha256').update(token).digest('hex'));
        expect(row.tokenHash).not.toBe(token);
        const ttl = row.expiresAt.getTime() - Date.now();
        expect(ttl).toBeGreaterThan(23.9 * 3600000);
        expect(ttl).toBeLessThanOrEqual(24 * 3600000);
        expect(sentEmails[0].to).toBe('new.user@example.com');
        expect(sentEmails[0].text).toContain('/invitations/');
        expect(sentEmails[0].text).not.toContain('undefined');
        expect(r.text).not.toContain(token);
    });

    it.each([
        [{ role: 'editor' }],
        [{ email: 'a@b.co' }],
        [{ email: 'not-an-email', role: 'editor' }],
        [{ email: `${'a'.repeat(250)}@b.co`, role: 'editor' }],
        [{ email: 'a@b.co', role: 'owner' }],
        [{ email: 'a@b.co', role: 'admin' }],
        [{ email: 'a@b.co', role: 5 }],
        [{ email: 5, role: 'editor' }],
        [{ email: ['a@b.co'], role: 'editor' }],
        [{ email: 'a@b.co', role: 'editor', status: 'accepted' }],
        [{ email: 'a@b.co', role: 'editor', invitedByUserId: 1 }],
    ])('rejects %j', async (body) => {
        expect((await invite(t.owner, body)).status).toBe(400);
        expect(await rows()).toHaveLength(0);
    });

    it('409 for an existing member (any case)', async () => {
        const r = await invite(t.owner, { email: t.editor.email.toUpperCase(), role: 'viewer' });
        expect(r.status).toBe(409);
        expect(await rows()).toHaveLength(0);
    });

    it('409 for a duplicate pending invitation, allowed again after cancel/expiry', async () => {
        expect((await invite(t.owner, { email: 'dup@example.com', role: 'editor' })).status).toBe(201);
        expect((await invite(t.owner, { email: 'DUP@example.com', role: 'viewer' })).status).toBe(409);
        const [row] = await rows();
        await api('DELETE', `${invUrl()}/${row.id}`, { user: t.owner });
        expect((await invite(t.owner, { email: 'dup@example.com', role: 'viewer' })).status).toBe(201);
        await db.update(workspaceInvitation).set({ expiresAt: new Date(Date.now() - 1000) }).where(and(eq(workspaceInvitation.email, 'dup@example.com'), eq(workspaceInvitation.status, 'pending')));
        expect((await invite(t.owner, { email: 'dup@example.com', role: 'viewer' })).status).toBe(201);
    });

    it('same email may be invited to two different workspaces', async () => {
        const ws2 = await makeWorkspace(t.owner, 'WS2');
        expect((await invite(t.owner, { email: 'multi@example.com', role: 'editor' })).status).toBe(201);
        expect((await invite(t.owner, { email: 'multi@example.com', role: 'editor' }, ws2)).status).toBe(201);
    });

    it('concurrent double POST creates exactly one pending invitation', async () => {
        const body = { email: 'race@example.com', role: 'editor' };
        const res = await Promise.all(Array.from({ length: 6 }, () => invite(t.owner, body)));
        const ok = res.filter((r) => r.status === 201).length;
        expect(res.every((r) => r.status < 500)).toBe(true);
        expect(ok).toBe(1);
        expect(await rows()).toHaveLength(1);
        expect(sentEmails).toHaveLength(1);
    });

    it('limits each user to 15 invitations per hour, independently per user', async () => {
        const sender = await getUser('bulksender');
        const other = await getUser('bulkother');
        const ws = await makeWorkspace(sender, 'BulkWS');
        const otherWs = await makeWorkspace(other, 'OtherWS');
        for (let i = 0; i < 15; i += 1) {
            expect((await invite(sender, { email: `bulk${i}@example.com`, role: 'viewer' }, ws)).status).toBe(201);
        }
        expect((await invite(sender, { email: 'bulk15@example.com', role: 'viewer' }, ws)).status).toBe(429);
        expect((await invite(other, { email: 'other@example.com', role: 'viewer' }, otherWs)).status).toBe(201);
    });

    it('email send failure does not leave a stuck pending invitation', async () => {
        emailControl.fail = true;
        const r = await invite(t.owner, { email: 'fail@example.com', role: 'editor' });
        expect(r.status).toBeGreaterThanOrEqual(500);
        emailControl.fail = false;
        const retry = await invite(t.owner, { email: 'fail@example.com', role: 'editor' });
        expect(retry.status).toBe(201);
    });

    it('invalid workspace ids never 500', async () => {
        for (const id of ['abc', '0', '-1', '2147483648', '999999']) {
            const r = await api('POST', `/api/workspaces/${id}/invitations`, { user: t.owner, body: { email: 'a@b.co', role: 'editor' } });
            expect([400, 403, 404]).toContain(r.status);
        }
    });
});

describe('GET/DELETE /workspaces/:id/invitations', () => {
    it('owner only, hides tokens, lists only pending+unexpired', async () => {
        const live = await seed({ email: 'live@example.com' });
        await seed({ email: 'old@example.com', expiresInMs: -1000 });
        await seed({ email: 'acc@example.com', status: 'accepted' });
        await seed({ email: 'can@example.com', status: 'cancelled' });
        await seed({ email: 'rej@example.com', status: 'rejected' });
        const r = await api('GET', invUrl(), { user: t.owner });
        expect(r.status).toBe(200);
        expect(r.body.map((i) => i.id)).toEqual([live.id]);
        expect(r.text).not.toMatch(/token/i);
        for (const u of [t.editor, t.viewer]) expect((await api('GET', invUrl(), { user: u })).status).toBe(403);
        expect((await api('GET', invUrl(), { user: t.outsider })).status).toBe(404);
        expect((await api('GET', invUrl())).status).toBe(401);
    });

    it('owner of A cannot list or cancel invitations of B', async () => {
        const other = await getUser('other');
        const wsB = await makeWorkspace(other, 'B');
        const inv = await seed({ ws: wsB });
        expect((await api('GET', invUrl(wsB), { user: t.owner })).status).toBe(404);
        expect((await api('DELETE', `${invUrl(t.ws)}/${inv.id}`, { user: t.owner })).status).toBe(404);
        expect((await api('DELETE', `${invUrl(wsB)}/${inv.id}`, { user: t.owner })).status).toBe(404);
        const [row] = await db.select().from(workspaceInvitation).where(eq(workspaceInvitation.id, inv.id));
        expect(row.status).toBe('pending');
    });

    it('cancel: owner only, once, token stops working', async () => {
        const inv = await seed();
        for (const u of [t.editor, t.viewer]) expect((await api('DELETE', `${invUrl()}/${inv.id}`, { user: u })).status).toBe(403);
        expect((await api('DELETE', `${invUrl()}/${inv.id}`, { user: t.outsider })).status).toBe(404);
        expect((await api('DELETE', `${invUrl()}/${inv.id}`, { user: t.owner })).status).toBe(200);
        expect((await api('DELETE', `${invUrl()}/${inv.id}`, { user: t.owner })).status).toBe(404);
        expect((await api('GET', `/api/invitations/token/${inv.token}`)).status).toBe(404);
        expect((await api('POST', `/api/invitations/${inv.id}/accept`, { user: invitee })).status).toBe(404);
    });

    it('bad invitation ids are 400/404', async () => {
        for (const id of ['abc', '0', '-1', '2147483648', '999999']) {
            const r = await api('DELETE', `${invUrl()}/${id}`, { user: t.owner });
            expect([400, 404]).toContain(r.status);
        }
    });
});

describe('GET /api/invitations (inbox)', () => {
    it('401 unauthenticated', async () => {
        expect((await api('GET', '/api/invitations')).status).toBe(401);
    });

    it('returns only my pending, unexpired invitations without secrets', async () => {
        const mine = await seed();
        await seed({ expiresInMs: -1000 });
        await seed({ status: 'accepted' });
        await seed({ status: 'rejected' });
        await seed({ status: 'cancelled' });
        await seed({ email: 'someone-else@example.com' });
        const r = await api('GET', '/api/invitations', { user: invitee });
        expect(r.status).toBe(200);
        expect(r.body.map((i) => i.id)).toEqual([mine.id]);
        expect(r.body[0]).toMatchObject({ workspace_id: t.ws.id, workspace_name: t.ws.name, role: 'editor' });
        expect(r.text).not.toMatch(/token|hash|someone-else/i);
        const none = await api('GET', '/api/invitations', { user: t.outsider });
        expect(none.body).toEqual([]);
    });

    it('matches email case-insensitively', async () => {
        const mine = await seed({ email: invitee.email.toLowerCase() });
        const r = await api('GET', '/api/invitations', { user: invitee });
        expect(r.body.map((i) => i.id)).toContain(mine.id);
    });
});

describe('POST /api/invitations/:id/accept', () => {
    it('401 unauthenticated, 400 bad id', async () => {
        const inv = await seed();
        expect((await api('POST', `/api/invitations/${inv.id}/accept`)).status).toBe(401);
        for (const id of ['abc', '0', '-1', '2147483648']) {
            expect((await api('POST', `/api/invitations/${id}/accept`, { user: invitee })).status).toBe(400);
        }
    });

    it.each(['editor', 'viewer'])('accepting creates a %s member and marks accepted', async (role) => {
        const inv = await seed({ role });
        const r = await api('POST', `/api/invitations/${inv.id}/accept`, { user: invitee });
        expect(r.status).toBe(200);
        const [m] = await db.select().from(workspaceMember).where(and(eq(workspaceMember.workspaceId, t.ws.id), eq(workspaceMember.userId, invitee.id)));
        expect(m.role).toBe(role);
        const [row] = await db.select().from(workspaceInvitation).where(eq(workspaceInvitation.id, inv.id));
        expect(row.status).toBe('accepted');
        expect((await api('GET', `/api/workspaces/${t.ws.id}/projects`, { user: invitee })).status).toBe(200);
        expect((await api('POST', `/api/invitations/${inv.id}/accept`, { user: invitee })).status).toBe(404);
        expect((await api('GET', `/api/invitations/token/${inv.token}`)).status).toBe(404);
    });

    it('wrong user cannot accept or decline, state unchanged', async () => {
        const inv = await seed();
        expect((await api('POST', `/api/invitations/${inv.id}/accept`, { user: t.outsider })).status).toBe(404);
        expect((await api('POST', `/api/invitations/${inv.id}/decline`, { user: t.outsider })).status).toBe(404);
        const [row] = await db.select().from(workspaceInvitation).where(eq(workspaceInvitation.id, inv.id));
        expect(row.status).toBe('pending');
        expect(await db.select().from(workspaceMember).where(eq(workspaceMember.userId, t.outsider.id))).toHaveLength(0);
    });

    it.each(['accepted', 'rejected', 'cancelled'])('%s invitation is 404', async (status) => {
        const inv = await seed({ status });
        expect((await api('POST', `/api/invitations/${inv.id}/accept`, { user: invitee })).status).toBe(404);
        expect((await api('POST', `/api/invitations/${inv.id}/decline`, { user: invitee })).status).toBe(404);
    });

    it('expired invitation is 404', async () => {
        const inv = await seed({ expiresInMs: -1000 });
        expect((await api('POST', `/api/invitations/${inv.id}/accept`, { user: invitee })).status).toBe(404);
        expect(await db.select().from(workspaceMember).where(eq(workspaceMember.userId, invitee.id))).toHaveLength(0);
    });

    it('owner-role invitation row is refused', async () => {
        const inv = await seed({ role: 'owner' });
        expect((await api('POST', `/api/invitations/${inv.id}/accept`, { user: invitee })).status).toBe(404);
        const owners = await db.select().from(workspaceMember).where(and(eq(workspaceMember.workspaceId, t.ws.id), eq(workspaceMember.role, 'owner')));
        expect(owners).toHaveLength(1);
    });

    it('existing member gets 409 and keeps their role', async () => {
        await addMember(t.ws, invitee, 'viewer');
        const inv = await seed({ role: 'editor' });
        expect((await api('POST', `/api/invitations/${inv.id}/accept`, { user: invitee })).status).toBe(409);
        const [m] = await db.select().from(workspaceMember).where(and(eq(workspaceMember.workspaceId, t.ws.id), eq(workspaceMember.userId, invitee.id)));
        expect(m.role).toBe('viewer');
    });

    it('concurrent double accept yields one membership and no 500s', async () => {
        const inv = await seed();
        const res = await Promise.all(Array.from({ length: 6 }, () => api('POST', `/api/invitations/${inv.id}/accept`, { user: invitee })));
        expect(res.every((r) => r.status < 500)).toBe(true);
        expect(res.filter((r) => r.status === 200)).toHaveLength(1);
        expect(await db.select().from(workspaceMember).where(and(eq(workspaceMember.workspaceId, t.ws.id), eq(workspaceMember.userId, invitee.id)))).toHaveLength(1);
    });

    it('accept vs decline race ends in exactly one terminal state', async () => {
        const inv = await seed();
        const [a, d] = await Promise.all([
            api('POST', `/api/invitations/${inv.id}/accept`, { user: invitee }),
            api('POST', `/api/invitations/${inv.id}/decline`, { user: invitee }),
        ]);
        expect([a.status, d.status].sort()).toEqual([200, 404]);
        const [row] = await db.select().from(workspaceInvitation).where(eq(workspaceInvitation.id, inv.id));
        const members = await db.select().from(workspaceMember).where(and(eq(workspaceMember.workspaceId, t.ws.id), eq(workspaceMember.userId, invitee.id)));
        expect(members.length).toBe(row.status === 'accepted' ? 1 : 0);
    });

    it('deleted workspace invalidates invitation', async () => {
        const inv = await seed();
        await api('DELETE', `/api/workspaces/${t.ws.id}`, { user: t.owner });
        expect((await api('POST', `/api/invitations/${inv.id}/accept`, { user: invitee })).status).toBe(404);
    });
});

describe('POST /api/invitations/:id/decline', () => {
    it('declines once and does not add membership', async () => {
        const inv = await seed();
        expect((await api('POST', `/api/invitations/${inv.id}/decline`)).status).toBe(401);
        expect((await api('POST', `/api/invitations/${inv.id}/decline`, { user: invitee })).status).toBe(200);
        const [row] = await db.select().from(workspaceInvitation).where(eq(workspaceInvitation.id, inv.id));
        expect(row.status).toBe('rejected');
        expect(await db.select().from(workspaceMember).where(eq(workspaceMember.userId, invitee.id))).toHaveLength(0);
        expect((await api('POST', `/api/invitations/${inv.id}/decline`, { user: invitee })).status).toBe(404);
        expect((await api('GET', '/api/invitations', { user: invitee })).body).toEqual([]);
    });

    it('bad ids are 400', async () => {
        for (const id of ['abc', '0', '-1', '2147483648']) {
            expect((await api('POST', `/api/invitations/${id}/decline`, { user: invitee })).status).toBe(400);
        }
    });
});

describe('GET /api/invitations/token/:token (public)', () => {
    it('valid token works without a session and exposes only expected fields', async () => {
        const inv = await seed();
        const r = await api('GET', `/api/invitations/token/${inv.token}`);
        expect(r.status).toBe(200);
        expect(Object.keys(r.body).sort()).toEqual(['created_at', 'email', 'expires_at', 'id', 'inviter_name', 'role', 'workspace_id', 'workspace_name'].sort());
        expect(r.text).not.toMatch(/token_?hash|password/i);
    });

    it('malformed tokens are 400 and are not echoed', async () => {
        for (const tok of ['abc', 'g'.repeat(64), 'A'.repeat(64), '0'.repeat(63), '0'.repeat(65), '%27%20OR%201%3D1']) {
            const r = await api('GET', `/api/invitations/token/${tok}`);
            expect(r.status, tok).toBe(400);
            expect(r.text).not.toContain(tok);
        }
    });

    it('unknown, expired, used and cancelled tokens are indistinguishable 404s', async () => {
        const unknown = await api('GET', `/api/invitations/token/${'a'.repeat(64)}`);
        const bodies = new Set([unknown.text]);
        for (const [status, expiresInMs] of [['pending', -1000], ['accepted', 3600000], ['rejected', 3600000], ['cancelled', 3600000]]) {
            const inv = await seed({ status, expiresInMs, email: `${status}${expiresInMs}@example.com` });
            const r = await api('GET', `/api/invitations/token/${inv.token}`);
            expect(r.status).toBe(404);
            bodies.add(r.text);
        }
        expect(unknown.status).toBe(404);
        expect(bodies.size).toBe(1);
    });

    it('is rate limited beyond the general API limit', async () => {
        const res = [];
        for (let i = 0; i < 40; i += 1) res.push((await api('GET', `/api/invitations/token/${'b'.repeat(64)}`)).status);
        expect(res).toContain(429);
    });
});

describe('workspace members management', () => {
    it('list members: any member, no emails leaked', async () => {
        for (const u of [t.owner, t.editor, t.viewer]) {
            const r = await api('GET', `/api/workspaces/${t.ws.id}/members`, { user: u });
            expect(r.status).toBe(200);
            expect(r.text).not.toMatch(/@example\.com/);
        }
        expect((await api('GET', `/api/workspaces/${t.ws.id}/members`, { user: t.outsider })).status).toBe(404);
    });

    it('role change: owner only, editor/viewer values only, never the owner', async () => {
        const url = (id) => `/api/workspaces/${t.ws.id}/members/${id}`;
        expect((await api('PATCH', url(t.viewer.id), { user: t.editor, body: { role: 'editor' } })).status).toBe(403);
        expect((await api('PATCH', url(t.viewer.id), { user: t.outsider, body: { role: 'editor' } })).status).toBe(404);
        for (const role of ['owner', 'admin', 5, undefined]) {
            expect((await api('PATCH', url(t.viewer.id), { user: t.owner, body: { role } })).status).toBe(400);
        }
        expect((await api('PATCH', url(t.viewer.id), { user: t.owner, body: { role: 'editor' } })).status).toBe(200);
        expect((await api('PATCH', url(t.owner.id), { user: t.owner, body: { role: 'viewer' } })).status).toBe(409);
        expect((await api('PATCH', url(t.outsider.id), { user: t.owner, body: { role: 'viewer' } })).status).toBe(404);
        const owners = await db.select().from(workspaceMember).where(and(eq(workspaceMember.workspaceId, t.ws.id), eq(workspaceMember.role, 'owner')));
        expect(owners).toHaveLength(1);
    });

    it('remove member: owner only, never the owner, scoped to the workspace', async () => {
        const url = (id) => `/api/workspaces/${t.ws.id}/members/${id}`;
        expect((await api('DELETE', url(t.viewer.id), { user: t.editor })).status).toBe(403);
        expect((await api('DELETE', url(t.owner.id), { user: t.owner })).status).toBe(409);
        expect((await api('DELETE', url(t.outsider.id), { user: t.owner })).status).toBe(404);
        expect((await api('DELETE', url(t.viewer.id), { user: t.owner })).status).toBe(200);
        expect((await api('DELETE', url(t.viewer.id), { user: t.owner })).status).toBe(404);
    });

    it('workspace rename/delete: owner only', async () => {
        const url = `/api/workspaces/${t.ws.id}`;
        expect((await api('PATCH', url, { user: t.editor, body: { name: 'x' } })).status).toBe(403);
        expect((await api('DELETE', url, { user: t.editor })).status).toBe(403);
        expect((await api('PATCH', url, { user: t.owner, body: { name: '' } })).status).toBe(400);
        expect((await api('PATCH', url, { user: t.owner, body: { name: 'renamed' } })).status).toBe(200);
        expect((await api('DELETE', url, { user: t.owner })).status).toBe(200);
        expect(await db.select().from(workspace).where(eq(workspace.id, t.ws.id))).toHaveLength(0);
    });
});

describe('cross-cutting', () => {
    it('errors never leak stack traces or SQL', async () => {
        const probes = [
            api('POST', invUrl(), { user: t.owner, headers: { 'content-type': 'application/json' }, raw: '{bad' }),
            api('GET', '/api/invitations/token/%00'),
            api('POST', `/api/invitations/${'9'.repeat(30)}/accept`, { user: invitee }),
        ];
        for (const r of await Promise.all(probes)) {
            expect(r.status).toBeLessThan(500);
            expect(r.text).not.toMatch(/at .*\.(js|ts):\d+|select |insert |pg_|stack/i);
        }
    });

    it('CORS rejects a non-allowlisted origin', async () => {
        const r = await api('GET', '/api/invitations', { user: invitee, headers: { origin: 'https://evil.example' } });
        expect(r.status).toBe(403);
    });
});
