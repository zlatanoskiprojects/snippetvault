import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startServer, stopServer, resetDb, api, makeTeam, makeWorkspace, getUser, addMember, db, project, snippet, snippetProject, eq } from './helpers.mjs';

let t;
beforeAll(startServer);
afterAll(stopServer);
beforeEach(async () => {
    await resetDb();
    t = await makeTeam();
});

const list = (ws) => `/api/workspaces/${ws.id}/projects`;
const mk = async (user, ws, body = { name: 'P1' }) => (await api('POST', list(ws), { user, body })).body;

describe('authentication', () => {
    it('401 on every route without a session', async () => {
        const p = await mk(t.owner, t.ws);
        for (const [m, u, b] of [
            ['GET', list(t.ws)],
            ['POST', list(t.ws), { name: 'x' }],
            ['PATCH', `/api/projects/${p.id}`, { name: 'x' }],
            ['DELETE', `/api/projects/${p.id}`],
        ]) {
            const r = await api(m, u, { body: b });
            expect(r.status, `${m} ${u}`).toBe(401);
        }
    });
});

describe('authorization matrix', () => {
    it('list: every member, not outsider', async () => {
        for (const u of [t.owner, t.editor, t.viewer]) expect((await api('GET', list(t.ws), { user: u })).status).toBe(200);
        expect((await api('GET', list(t.ws), { user: t.outsider })).status).toBe(404);
    });

    it('create: owner and editor only', async () => {
        expect((await api('POST', list(t.ws), { user: t.owner, body: { name: 'a' } })).status).toBe(201);
        expect((await api('POST', list(t.ws), { user: t.editor, body: { name: 'b' } })).status).toBe(201);
        expect((await api('POST', list(t.ws), { user: t.viewer, body: { name: 'c' } })).status).toBe(403);
        expect((await api('POST', list(t.ws), { user: t.outsider, body: { name: 'd' } })).status).toBe(404);
    });

    it('update/delete: owner only', async () => {
        const p = await mk(t.owner, t.ws);
        for (const u of [t.editor, t.viewer]) {
            expect((await api('PATCH', `/api/projects/${p.id}`, { user: u, body: { name: 'z' } })).status).toBe(403);
            expect((await api('DELETE', `/api/projects/${p.id}`, { user: u })).status).toBe(403);
        }
        expect((await api('PATCH', `/api/projects/${p.id}`, { user: t.outsider, body: { name: 'z' } })).status).toBe(404);
        expect((await api('DELETE', `/api/projects/${p.id}`, { user: t.outsider })).status).toBe(404);
        const ok = await api('PATCH', `/api/projects/${p.id}`, { user: t.owner, body: { name: 'renamed' } });
        expect(ok.status).toBe(200);
        expect(ok.body.name).toBe('renamed');
        expect((await api('DELETE', `/api/projects/${p.id}`, { user: t.owner })).status).toBe(200);
    });

    it('missing, foreign and non-member project responses are indistinguishable', async () => {
        const p = await mk(t.owner, t.ws);
        const a = await api('PATCH', `/api/projects/${p.id}`, { user: t.outsider, body: { name: 'x' } });
        const b = await api('PATCH', `/api/projects/999999`, { user: t.outsider, body: { name: 'x' } });
        expect(a.status).toBe(404);
        expect(a.text).toBe(b.text);
    });

    it('owner of workspace A cannot touch a project of workspace B', async () => {
        const other = await getUser('other');
        const wsB = await makeWorkspace(other, 'B');
        const pB = await mk(other, wsB);
        expect((await api('PATCH', `/api/projects/${pB.id}`, { user: t.owner, body: { name: 'x' } })).status).toBe(404);
        expect((await api('DELETE', `/api/projects/${pB.id}`, { user: t.owner })).status).toBe(404);
        expect((await api('GET', list(wsB), { user: t.owner })).status).toBe(404);
        expect((await api('POST', list(wsB), { user: t.owner, body: { name: 'x' } })).status).toBe(404);
    });

    it('list is scoped to the workspace', async () => {
        const wsB = await makeWorkspace(t.owner, 'B');
        await mk(t.owner, t.ws, { name: 'inA' });
        await mk(t.owner, wsB, { name: 'inB' });
        const r = await api('GET', list(t.ws), { user: t.owner });
        expect(r.body.map((p) => p.name)).toEqual(['inA']);
    });

    it('removed member loses access immediately', async () => {
        expect((await api('GET', list(t.ws), { user: t.editor })).status).toBe(200);
        expect((await api('DELETE', `/api/workspaces/${t.ws.id}/members/${t.editor.id}`, { user: t.owner })).status).toBe(200);
        expect((await api('GET', list(t.ws), { user: t.editor })).status).toBe(404);
    });
});

describe('validation', () => {
    it.each(['abc', '0', '-1', '2147483648', '1.5', '1e3'])('rejects workspace id %s', async (id) => {
        const r = await api('GET', `/api/workspaces/${id}/projects`, { user: t.owner });
        expect([400, 403, 404]).toContain(r.status);
    });

    it.each(['abc', '0', '-1', '2147483648'])('rejects project id %s', async (id) => {
        const r = await api('PATCH', `/api/projects/${id}`, { user: t.owner, body: { name: 'x' } });
        expect([400, 404]).toContain(r.status);
        expect((await api('DELETE', `/api/projects/${id}`, { user: t.owner })).status).toBeLessThan(500);
    });

    it.each([
        [{}],
        [{ name: '' }],
        [{ name: '   ' }],
        [{ name: 'x'.repeat(256) }],
        [{ name: 123 }],
        [{ name: null }],
        [{ name: ['a'] }],
        [{ name: { a: 1 } }],
        [{ name: 'ok', description: 'x'.repeat(1001) }],
        [{ name: 'ok', description: 5 }],
        [{ name: 'ok', extra: 1 }],
        [{ name: 'ok', workspace_id: 99 }],
        [{ name: 'ok', userId: 99 }],
    ])('create rejects %j', async (body) => {
        expect((await api('POST', list(t.ws), { user: t.owner, body })).status).toBe(400);
    });

    it('create accepts boundaries and trims the name', async () => {
        const r = await api('POST', list(t.ws), { user: t.owner, body: { name: `  ${'x'.repeat(255)}  `, description: 'y'.repeat(1000) } });
        expect(r.status).toBe(201);
        expect(r.body.name).toHaveLength(255);
        expect((await api('POST', list(t.ws), { user: t.owner, body: { name: 'n', description: null } })).status).toBe(201);
    });

    it('patch with no fields or bad fields is 400', async () => {
        const p = await mk(t.owner, t.ws);
        for (const body of [{}, { name: '' }, { name: 'x'.repeat(256) }, { description: 'y'.repeat(1001) }, { foo: 1 }]) {
            expect((await api('PATCH', `/api/projects/${p.id}`, { user: t.owner, body })).status, JSON.stringify(body)).toBe(400);
        }
        expect((await api('PATCH', `/api/projects/${p.id}`, { user: t.owner, body: { description: 'only desc' } })).status).toBe(200);
    });

    it('malformed JSON is 400 and oversized body is 413, never 500', async () => {
        const bad = await api('POST', list(t.ws), { user: t.owner, headers: { 'content-type': 'application/json' }, raw: '{"name":' });
        expect(bad.status).toBe(400);
        const big = await api('POST', list(t.ws), { user: t.owner, body: { name: 'a', description: 'z'.repeat(200000) } });
        expect(big.status).toBe(413);
    });

    it('sql-injection and prototype-pollution payloads are inert', async () => {
        const r = await api('POST', list(t.ws), { user: t.owner, body: { name: "'; DROP TABLE project;--" } });
        expect(r.status).toBe(201);
        const p = await api('POST', list(t.ws), { user: t.owner, headers: { 'content-type': 'application/json' }, raw: '{"name":"a","__proto__":{"admin":true}}' });
        expect(p.status).toBeLessThan(500);
        expect((await api('GET', list(t.ws), { user: t.owner })).status).toBe(200);
    });
});

describe('behavior', () => {
    it('response shape is snake_case with caller role', async () => {
        const r = await api('POST', list(t.ws), { user: t.editor, body: { name: 'shape', description: 'd' } });
        expect(r.body).toMatchObject({ name: 'shape', description: 'd', workspace_id: t.ws.id });
        expect(Object.keys(r.body).some((k) => /[A-Z]/.test(k))).toBe(false);
        const l = await api('GET', list(t.ws), { user: t.viewer });
        expect(l.body[0].role).toBe('viewer');
    });

    it('delete unassigns snippets but keeps them', async () => {
        const p = await mk(t.owner, t.ws);
        const [s] = await db.insert(snippet).values({ userId: t.owner.id, workspaceId: t.ws.id, title: 't', code: 'c', language: 'ts' }).returning();
        await db.insert(snippetProject).values({ snippetId: s.id, projectId: p.id });
        expect((await api('DELETE', `/api/projects/${p.id}`, { user: t.owner })).status).toBe(200);
        expect(await db.select().from(snippet).where(eq(snippet.id, s.id))).toHaveLength(1);
        expect(await db.select().from(snippetProject).where(eq(snippetProject.snippetId, s.id))).toHaveLength(0);
        expect((await api('DELETE', `/api/projects/${p.id}`, { user: t.owner })).status).toBe(404);
    });

    it('deleting the workspace removes its projects', async () => {
        const p = await mk(t.owner, t.ws);
        expect((await api('DELETE', `/api/workspaces/${t.ws.id}`, { user: t.owner })).status).toBe(200);
        expect(await db.select().from(project).where(eq(project.id, p.id))).toHaveLength(0);
    });

    const snip = (ws, user, extra = {}) => api('POST', `/api/workspaces/${ws.id}/snippets`, { user, body: { title: 't', code: 'c', language: 'TypeScript', ...extra } });

    it('snippet create accepts a same-workspace project and rejects other workspaces or missing ids', async () => {
        const wsB = await makeWorkspace(t.owner, 'B');
        const pA = await mk(t.owner, t.ws);
        const pB = await mk(t.owner, wsB);
        expect((await snip(t.ws, t.owner, { project_id: pA.id })).status).toBe(201);
        expect((await snip(t.ws, t.owner, { project_id: pB.id })).status).toBe(400);
        expect((await snip(t.ws, t.owner, { project_id: 999999 })).status).toBe(400);
        expect(await db.select().from(snippet).where(eq(snippet.workspaceId, t.ws.id))).toHaveLength(1);
    });

    it('snippet patch rejects reassigning to a project of another workspace', async () => {
        const wsB = await makeWorkspace(t.owner, 'B');
        const pB = await mk(t.owner, wsB);
        const created = await snip(t.ws, t.owner);
        const r = await api('PATCH', `/api/snippets/${created.body.id}`, { user: t.owner, body: { project_id: pB.id } });
        expect(r.status).toBe(400);
        expect(await db.select().from(snippetProject)).toHaveLength(0);
    });

    it('deleting a project while snippets are being assigned never 500s or leaves dangling rows', async () => {
        for (let i = 0; i < 8; i += 1) {
            const p = await mk(t.owner, t.ws, { name: `race${i}` });
            const created = await snip(t.ws, t.owner);
            const res = await Promise.all([
                snip(t.ws, t.owner, { project_id: p.id }),
                api('PATCH', `/api/snippets/${created.body.id}`, { user: t.owner, body: { project_id: p.id } }),
                api('DELETE', `/api/projects/${p.id}`, { user: t.owner }),
            ]);
            expect(res.map((r) => r.status).every((c) => c < 500), JSON.stringify(res.map((r) => r.status))).toBe(true);
            expect(await db.select().from(snippetProject).where(eq(snippetProject.projectId, p.id))).toHaveLength(0);
        }
    });
});
