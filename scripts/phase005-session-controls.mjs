import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const CREDS_PATH = process.env.CREDS_PATH || 'C:/Users/User/AppData/Local/Temp/opencode/phase005-creds.json';
const OUT_ROOT = process.env.OUT_ROOT || 'C:/Users/User/AppData/Local/Temp/opencode/phase005-viewport-evidence/run-2026-11-20';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PROJECT = process.cwd();

function ensureDir(p){ fs.mkdirSync(p,{recursive:true}); }
function readCreds(){
  const j = JSON.parse(fs.readFileSync(CREDS_PATH,'utf8').replace(/^\uFEFF/, ''));
  const map = {};
  for (const r of (j.reset||j.created||[])) map[r.key]=r;
  return map;
}
async function snap(page, dir, name){
  const file = path.join(dir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}
async function login(page, email, password){
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await Promise.all([
    page.waitForURL(url => url.pathname.startsWith('/dashboard'), { timeout: 20000 }),
    page.click('button[type="submit"]')
  ]);
}
function mutateSession(mode, who){
  // mode: revoke-session | expire-session
  const tsxCli = path.join(PROJECT, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const out = execFileSync(process.execPath, [tsxCli, 'scripts/phase005-browser-acceptance.ts', mode, who], {
    cwd: PROJECT,
    env: process.env,
    encoding: 'utf8',
    stdio: ['ignore','pipe','pipe']
  });
  return out;
}

async function runScenario(browser, creds, scenario){
  const dir = path.join(OUT_ROOT, 'session-controls', scenario);
  ensureDir(dir);
  const B = creds.B;
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const result = { scenario, tests: [], evidence: [], mutateOutput: null };
  try {
    await login(page, B.email, B.password);
    await page.waitForTimeout(400);
    const authed = page.url().includes('/dashboard');
    result.evidence.push(await snap(page, dir, '01-authenticated-before-mutation'));
    result.tests.push({ name: `Login B establishes authenticated session before ${scenario}`, pass: authed, details: page.url() });

    const mode = scenario === 'revoked' ? 'revoke-session' : 'expire-session';
    result.mutateOutput = mutateSession(mode, 'B');

    // trigger a navigation/request that should be rejected
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    const redirected = page.url().includes('/login');
    result.evidence.push(await snap(page, dir, '02-after-mutation-redirect'));
    result.tests.push({ name: `${scenario} session rejected and redirected to login`, pass: redirected, details: page.url() });

    // ensure protected routes not accessible with stale session context
    await page.goto(`${BASE}/dashboard/accounts`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    const redirected2 = page.url().includes('/login');
    result.evidence.push(await snap(page, dir, '03-protected-route-after-mutation'));
    result.tests.push({ name: `Protected route inaccessible after ${scenario} session`, pass: redirected2, details: page.url() });
  } catch (e) {
    result.fatal = String(e && e.stack || e);
    try { result.evidence.push(await snap(page, dir, 'fatal')); } catch {}
  } finally {
    await context.close();
  }
  return result;
}

async function main(){
  const creds = readCreds();
  if (!creds.B) throw new Error('Missing B creds');
  ensureDir(path.join(OUT_ROOT, 'session-controls'));
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const results = [];
  try {
    for (const scenario of ['revoked','expired']) {
      console.log('Running session control:', scenario);
      results.push(await runScenario(browser, creds, scenario));
    }
  } finally { await browser.close(); }

  const outPath = path.join(OUT_ROOT, 'session-controls', 'report.json');
  fs.writeFileSync(outPath, JSON.stringify({ outRoot: OUT_ROOT, sessionControls: results }, null, 2));
  console.log(JSON.stringify({ outPath, results: results.map(r=>({ scenario:r.scenario, fatal:r.fatal||null, tests:r.tests })) }, null, 2));
}

main().catch(e=>{ console.error(e); process.exit(1); });
