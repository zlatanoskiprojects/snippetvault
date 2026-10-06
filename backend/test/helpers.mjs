import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHmac } from 'node:crypto';
import dotenv from 'dotenv';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

dotenv.config({ path: path.join(root, '.env'), quiet: true });
const testUrl = process.env.TEST_DATABASE_URL
    ?? process.env.DATABASE_URL.replace(/\/[^/?]+(\?|$)/, '/snippetvault_test$1');
if (!/snippetvault_test/.test(testUrl)) throw new Error('refusing to run against a non-test database');
process.env.DATABASE_URL = testUrl;
process.env.TURNSTILE_SECRET_KEY = '';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.RESEND_API_KEY ||= 're_test';
process.env.EMAIL_FROM ||= 'test@example.com';

const emailModule = require(path.join(root, 'build/lib/email.js'));
export const sentEmails = [];
export const emailControl = { fail: false };
emailModule.sendEmail = async (msg) => {
    if (emailControl.fail) throw new Error('email failed');
    sentEmails.push(msg);
    return 'test-id';
};

const { app } = require(path.join(root, 'build/index.js'));
const { auth } = require(path.join(root, 'build/lib/auth.js'));
const dbModule = require(path.join(root, 'build/lib/db.js'));
const schema = require(path.join(root, 'build/db/schema.js'));
const drizzle = require('drizzle-orm');

export const db = dbModule.default;
export const { users, workspace, workspaceMember, workspaceInvitation, project, snippet, snippetProject } = schema;
export const { eq, and, sql } = drizzle;
export const pool = dbModule.pool;

let server;
let base;

export async function startServer() {
    await new Promise((resolve) => { server = app.listen(0, resolve); });
    base = `http://127.0.0.1:${server.address().port}`;
}

export async function stopServer() {
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
}

export async function resetDb() {
    await db.execute(sql`TRUNCATE TABLE workspace RESTART IDENTITY CASCADE`);
}

let counter = 0;
export async function makeUser(label = 'u') {
    counter += 1;
    const email = `${label}${counter}-${Date.now()}@example.com`;
    await auth.api.signUpEmail({ body: { email, password: 'Str0ng-Passw0rd!x', name: `${label}${counter}` } });
    await db.update(users).set({ emailVerified: true }).where(eq(users.email, email));
    const [row] = await db.select().from(users).where(eq(users.email, email));
    const ctx = await auth.$context;
    const session = await ctx.internalAdapter.createSession(row.id);
    const signature = createHmac('sha256', ctx.secret).update(session.token).digest('base64');
    const value = encodeURIComponent(`${session.token}.${signature}`);
    const cookie = `${ctx.authCookies.sessionToken.name}=${value}`;
    return { id: row.id, email, cookie };
}

export async function api(method, url, { user, body, headers = {}, raw } = {}) {
    const h = { ...headers };
    if (user) h.cookie = user.cookie;
    let payload = raw;
    if (body !== undefined) {
        h['content-type'] = 'application/json';
        payload = JSON.stringify(body);
    }
    const res = await fetch(base + url, { method, headers: h, body: payload });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = undefined; }
    return { status: res.status, body: json, text };
}

export async function makeWorkspace(owner, name = 'WS') {
    const res = await api('POST', '/api/workspaces', { user: owner, body: { name } });
    return res.body;
}

export async function addMember(ws, user, role) {
    await db.insert(workspaceMember).values({ workspaceId: ws.id, userId: user.id, role });
}

const userCache = new Map();
export async function getUser(label) {
    if (!userCache.has(label)) userCache.set(label, await makeUser(label));
    return userCache.get(label);
}

export async function makeTeam() {
    const owner = await getUser('owner');
    const editor = await getUser('editor');
    const viewer = await getUser('viewer');
    const outsider = await getUser('outsider');
    const ws = await makeWorkspace(owner);
    await addMember(ws, editor, 'editor');
    await addMember(ws, viewer, 'viewer');
    return { owner, editor, viewer, outsider, ws };
}

export function lastInvitationToken() {
    const m = sentEmails.at(-1).text.match(/invitations\/([0-9a-f]{64})/);
    return m[1];
}
