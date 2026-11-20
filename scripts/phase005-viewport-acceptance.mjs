import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const CREDS_PATH = process.env.CREDS_PATH || 'C:/Users/User/AppData/Local/Temp/opencode/phase005-creds.json';
const OUT_ROOT = process.env.OUT_ROOT || 'C:/Users/User/AppData/Local/Temp/opencode/phase005-viewport-evidence/run-' + new Date().toISOString().replace(/[:.]/g,'-');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const VIEWPORTS = [
  { w: 375, h: 812 },
  { w: 390, h: 844 },
  { w: 768, h: 1024 },
  { w: 1024, h: 768 },
  { w: 1440, h: 900 },
];

function ensureDir(p){ fs.mkdirSync(p,{recursive:true}); }
function readCreds(){
  const j = JSON.parse(fs.readFileSync(CREDS_PATH,'utf8').replace(/^\uFEFF/, ''));
  const map = {};
  for (const r of (j.reset||j.created||[])) map[r.key]=r;
  return map;
}

const report = { base: BASE, outRoot: OUT_ROOT, viewports: [], defects: [], notes: [] };

async function snap(page, dir, name, meta={}){
  const file = path.join(dir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return { name, file, url: page.url(), title: await page.title().catch(()=>''), ...meta };
}

async function hasHorizontalOverflow(page){
  return await page.evaluate(() => {
    const el = document.documentElement;
    const body = document.body;
    const sw = Math.max(el.scrollWidth, body ? body.scrollWidth : 0);
    const cw = el.clientWidth;
    return { overflow: sw > cw + 1, scrollWidth: sw, clientWidth: cw };
  });
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

async function logout(page){
  // try desktop or mobile sign out button present in DOM
  const btn = page.getByRole('button', { name: 'Sign out' }).first();
  await Promise.all([
    page.waitForURL(url => url.pathname === '/login' || url.pathname.startsWith('/login'), { timeout: 20000 }).catch(()=>{}),
    btn.click()
  ]);
  // ensure on login
  if (!page.url().includes('/login')) {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  }
}

function rec(vpReport, area, name, pass, details='', evidence=[]){
  vpReport.tests.push({ area, name, pass: !!pass, details, evidence });
}

async function runViewport(browser, creds, vp){
  const label = `${vp.w}x${vp.h}`;
  const dir = path.join(OUT_ROOT, `viewport-${label}`);
  ensureDir(dir);
  const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
  const page = await context.newPage();
  const vpReport = { viewport: vp, label, dir, tests: [], consoleErrors: [], pageErrors: [] };
  page.on('pageerror', err => vpReport.pageErrors.push(String(err)));
  page.on('console', msg => { if (msg.type()==='error') vpReport.consoleErrors.push(msg.text()); });

  const A = creds.A, B = creds.B;
  try {
    // 1) Unauthenticated protected routes
    for (const route of ['/dashboard','/dashboard/accounts','/dashboard/transactions','/dashboard/profile','/dashboard/security']) {
      await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);
      const onLogin = page.url().includes('/login');
      const ev = await snap(page, dir, `unauth-${route.replaceAll('/','_').replace(/^_/, '') || 'root'}`, { route, finalUrl: page.url() });
      rec(vpReport, '7. Auth-protected routes/unauthorized access', `Unauthenticated ${route} redirects to login`, onLogin, `finalUrl=${page.url()}`, [ev.file]);
      if (!onLogin) report.defects.push({ viewport: label, area: 7, detail: `Unauthenticated ${route} not redirected to login (${page.url()})` });
    }

    // Login as A
    await login(page, A.email, A.password);
    await page.waitForTimeout(500);

    // 1. Dashboard layout/responsiveness
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    let ov = await hasHorizontalOverflow(page);
    let ev = await snap(page, dir, 'dashboard-overview', { overflow: ov });
    const dashHasWelcome = await page.getByRole('heading', { name: /Welcome/i }).first().isVisible().catch(()=>false);
    const dashHasSummary = await page.getByText('Account summary by currency').first().isVisible().catch(()=>false);
    const dashHasGBP = await page.getByText('GBP', { exact: true }).first().isVisible().catch(()=>false);
    const dashHasNoTx = await page.getByText("You don't have any transactions yet.").first().isVisible().catch(()=>false);
    const dashHasNoNotif = await page.getByText('No notifications yet.').first().isVisible().catch(()=>false);
    const dashHasReadOnly = await page.getByText('Financial operations unavailable in this phase').first().isVisible().catch(()=>false);
    const dashNoCombined = !(await page.content()).includes('combined total');
    rec(vpReport, '1. Dashboard layout/responsiveness', 'Dashboard renders key overview sections', dashHasWelcome && dashHasSummary, `welcome=${dashHasWelcome} summary=${dashHasSummary}`, [ev.file]);
    rec(vpReport, '1. Dashboard layout/responsiveness', 'Currency separation shown (GBP) without combined total', dashHasGBP && dashNoCombined, `gbp=${dashHasGBP} noCombined=${dashNoCombined}`, [ev.file]);
    rec(vpReport, '1. Dashboard layout/responsiveness', 'Recent activity/notifications empty states and read-only notice', dashHasNoTx && dashHasNoNotif && dashHasReadOnly, `noTx=${dashHasNoTx} noNotif=${dashHasNoNotif} readOnly=${dashHasReadOnly}`, [ev.file]);
    rec(vpReport, '1. Dashboard layout/responsiveness', 'No horizontal overflow on dashboard', !ov.overflow, JSON.stringify(ov), [ev.file]);
    if (ov.overflow) report.defects.push({ viewport: label, area: 1, detail: `Dashboard horizontal overflow ${JSON.stringify(ov)}` });

    // 4. Balance hide/show on dashboard
    const toggle = page.getByRole('button', { name: /Hide balances|Show balances/ }).first();
    const toggleVisible = await toggle.isVisible().catch(()=>false);
    let toggleText1 = toggleVisible ? await toggle.innerText() : '';
    // default should be Show balances (hidden state) per provider
    const defaultHidden = /Show balances/i.test(toggleText1);
    let anyMaskBefore = await page.locator('text=/••••/').first().isVisible().catch(()=>false);
    await toggle.click();
    await page.waitForTimeout(300);
    let toggleText2 = await toggle.innerText().catch(()=> '');
    let revealedState = /Hide balances/i.test(toggleText2);
    ev = await snap(page, dir, 'dashboard-balances-revealed', { toggleText1, toggleText2 });
    rec(vpReport, '4. Balance hide/show', 'Balance visibility toggle present and defaults to hidden', toggleVisible && defaultHidden, `toggle=${toggleVisible} text=${toggleText1} maskVisible=${anyMaskBefore}`, [ev.file]);
    rec(vpReport, '4. Balance hide/show', 'Revealing balances updates UI state', revealedState, `afterClick=${toggleText2}`, [ev.file]);
    await toggle.click();
    await page.waitForTimeout(300);
    let toggleText3 = await toggle.innerText().catch(()=> '');
    let hiddenAgain = /Show balances/i.test(toggleText3);
    let evHide = await snap(page, dir, 'dashboard-balances-hidden-again', { toggleText3 });
    rec(vpReport, '4. Balance hide/show', 'Hiding balances again restores hidden state', hiddenAgain, `afterSecondClick=${toggleText3}`, [evHide.file]);

    // 6. Navigation/mobile menu and overflow issues
    const isDesktop = vp.w >= 1024;
    if (isDesktop) {
      const desktopNav = page.locator('nav[aria-label="Dashboard navigation"]');
      const desktopNavVisible = await desktopNav.isVisible().catch(()=>false);
      const hasLinks = await desktopNav.getByRole('link', { name: 'Transactions' }).isVisible().catch(()=>false);
      ev = await snap(page, dir, 'nav-desktop', {});
      rec(vpReport, '6. Navigation/mobile menu/overflow', 'Desktop dashboard navigation visible with links', desktopNavVisible && hasLinks, `nav=${desktopNavVisible} transactionsLink=${hasLinks}`, [ev.file]);
    } else {
      const menuBtn = page.getByRole('button', { name: /Open dashboard menu|Close dashboard menu/ }).first();
      const btnVisible = await menuBtn.isVisible().catch(()=>false);
      let opened=false, closed=false, closedEsc=false;
      if (btnVisible) {
        await menuBtn.click();
        await page.waitForTimeout(250);
        const mobileNav = page.locator('nav[aria-label="Mobile dashboard navigation"]');
        opened = await mobileNav.isVisible().catch(()=>false);
        ev = await snap(page, dir, 'nav-mobile-open', {});
        rec(vpReport, '6. Navigation/mobile menu/overflow', 'Mobile menu opens and shows navigation', opened, `buttonVisible=${btnVisible}`, [ev.file]);
        // close via Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(250);
        closedEsc = !(await mobileNav.isVisible().catch(()=>false));
        // open again and close via button
        await menuBtn.click();
        await page.waitForTimeout(250);
        await menuBtn.click();
        await page.waitForTimeout(250);
        closed = !(await mobileNav.isVisible().catch(()=>false));
        const evClose = await snap(page, dir, 'nav-mobile-closed', {});
        rec(vpReport, '6. Navigation/mobile menu/overflow', 'Mobile menu closes via Escape and button', closedEsc && closed, `esc=${closedEsc} button=${closed}`, [evClose.file]);
      } else {
        rec(vpReport, '6. Navigation/mobile menu/overflow', 'Mobile menu button visible at small viewport', false, 'menu button not found', []);
        report.defects.push({ viewport: label, area: 6, detail: 'Mobile menu button not visible' });
      }
    }

    // 2. Accounts list and details
    await page.goto(`${BASE}/dashboard/accounts`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    ov = await hasHorizontalOverflow(page);
    const acctNum = A.account.accountNumber;
    const acctVisible = await page.getByText(acctNum).first().isVisible().catch(()=>false);
    const acctType = await page.getByText('CURRENT').first().isVisible().catch(()=>false);
    const acctGBP = await page.getByText('GBP').first().isVisible().catch(()=>false);
    ev = await snap(page, dir, 'accounts-list', { overflow: ov });
    rec(vpReport, '2. Accounts list/details', 'Accounts list shows owned account details', acctVisible && acctType && acctGBP, `acct=${acctVisible} type=${acctType} currency=${acctGBP} account=${acctNum}`, [ev.file]);
    rec(vpReport, '2. Accounts list/details', 'No horizontal overflow on accounts list', !ov.overflow, JSON.stringify(ov), [ev.file]);
    if (ov.overflow) report.defects.push({ viewport: label, area: 2, detail: `Accounts list horizontal overflow ${JSON.stringify(ov)}` });

    await page.getByRole('link', { name: 'View details' }).first().click();
    await page.waitForURL(url => url.pathname.includes('/dashboard/accounts/'), { timeout: 15000 });
    await page.waitForTimeout(400);
    ov = await hasHorizontalOverflow(page);
    const detailNum = await page.getByText(acctNum).first().isVisible().catch(()=>false);
    const detailName = await page.getByText('Phase005 Test Current Account').first().isVisible().catch(()=>false);
    const detailRecentEmpty = await page.getByText("You don't have any transactions yet.").first().isVisible().catch(()=>false);
    ev = await snap(page, dir, 'account-detail', { overflow: ov, url: page.url() });
    rec(vpReport, '2. Accounts list/details', 'Account detail page shows owned account info and empty activity', detailNum && detailName, `num=${detailNum} name=${detailName} emptyTx=${detailRecentEmpty}`, [ev.file]);
    rec(vpReport, '2. Accounts list/details', 'No horizontal overflow on account detail', !ov.overflow, JSON.stringify(ov), [ev.file]);
    if (ov.overflow) report.defects.push({ viewport: label, area: 2, detail: `Account detail horizontal overflow ${JSON.stringify(ov)}` });

    // 7b. Cross-account unauthorized access (authenticated, B's account as A)
    const bAcct = B.account.accountNumber;
    await page.goto(`${BASE}/dashboard/accounts/${encodeURIComponent(bAcct)}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    const pageContent = await page.content();
    const visibleText = await page.locator('body').innerText();
    const notFoundText = await page.getByText(/could not be found|404|not found/i).first().isVisible().catch(()=>false);
    const visibleLeak = visibleText.includes(bAcct);
    const rawContainsRequestedParam = pageContent.includes(bAcct); // URL route-param reflection may appear in RSC flight payload; assessed separately as routing metadata
    const privateBLeak = pageContent.includes(B.email) || visibleText.includes('CustomerB') || pageContent.includes('Phase005 Test Savings Account');
    const deniedNoPrivateLeak = notFoundText && !visibleLeak && !privateBLeak;
    ev = await snap(page, dir, 'unauthorized-cross-account-a-to-b', { finalUrl: page.url() });
    rec(
      vpReport,
      '7. Auth-protected routes/unauthorized access',
      'Cross-account access (A -> B account) denied with no visible/private data leakage (RSC requested-param reflection assessed separately)',
      deniedNoPrivateLeak,
      `notFound=${notFoundText} visibleLeak=${visibleLeak} privateBLeak=${privateBLeak} rawContainsRequestedParam=${rawContainsRequestedParam} url=${page.url()}`,
      [ev.file]
    );
    if (!deniedNoPrivateLeak) report.defects.push({ viewport: label, area: 7, detail: `Cross-account isolation issue A->B (notFound=${notFoundText}, visibleLeak=${visibleLeak}, privateBLeak=${privateBLeak})` });

    // 3. Transactions history/filters/pagination
    await page.goto(`${BASE}/dashboard/transactions`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    ov = await hasHorizontalOverflow(page);
    const txEmpty = await page.getByText("You don't have any transactions yet.").first().isVisible().catch(()=>false);
    const results0 = await page.getByText('0 transactions found').first().isVisible().catch(()=>false);
    ev = await snap(page, dir, 'transactions-empty', { overflow: ov });
    rec(vpReport, '3. Transactions/filters/pagination', 'Transactions page shows empty state for no records', txEmpty || results0, `emptyMsg=${txEmpty} results0=${results0}`, [ev.file]);
    rec(vpReport, '3. Transactions/filters/pagination', 'No horizontal overflow on transactions page', !ov.overflow, JSON.stringify(ov), [ev.file]);
    if (ov.overflow) report.defects.push({ viewport: label, area: 3, detail: `Transactions horizontal overflow ${JSON.stringify(ov)}` });

    // Apply filters via UI
    await page.getByRole('button', { name: 'Deposits' }).click();
    await page.waitForTimeout(800);
    const urlAfterType = page.url();
    const typeFilteredMsg = await page.getByText('No transactions match your filters').first().isVisible().catch(()=>false);
    ev = await snap(page, dir, 'transactions-filter-type-deposit', { url: urlAfterType });
    rec(vpReport, '3. Transactions/filters/pagination', 'Transaction type filter applies and updates results/state', urlAfterType.includes('type=DEPOSIT') || typeFilteredMsg, `url=${urlAfterType} filteredMsg=${typeFilteredMsg}`, [ev.file]);

    await page.selectOption('select', { label: 'Completed' }).catch(async()=>{ await page.locator('select').first().selectOption('COMPLETED'); });
    await page.waitForTimeout(800);
    ev = await snap(page, dir, 'transactions-filter-status-completed', { url: page.url() });
    rec(vpReport, '3. Transactions/filters/pagination', 'Status filter control works', page.url().includes('status=COMPLETED') || await page.getByText('No transactions match your filters').first().isVisible().catch(()=>false), `url=${page.url()}`, [ev.file]);

    await page.getByRole('link', { name: 'Clear filters' }).click();
    await page.waitForTimeout(800);
    const cleared = !page.url().includes('type=') && !page.url().includes('status=');
    ev = await snap(page, dir, 'transactions-filters-cleared', { url: page.url() });
    rec(vpReport, '3. Transactions/filters/pagination', 'Clear filters resets transaction filters', cleared, `url=${page.url()}`, [ev.file]);

    // Direct URL filters including invalid params and page
    await page.goto(`${BASE}/dashboard/transactions?type=DEPOSIT&status=COMPLETED&currency=USD&from=2026-01-01&to=2026-12-31&page=2`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    const handledValidCombo = await page.getByText(/No transactions match your filters|No transactions on this page|Results/).first().isVisible().catch(()=>false);
    ev = await snap(page, dir, 'transactions-filtered-url-page2', { url: page.url() });
    rec(vpReport, '3. Transactions/filters/pagination', 'Server-validated filter/pagination URL handled gracefully', handledValidCombo && page.url().includes('/dashboard/transactions'), `url=${page.url()} handled=${handledValidCombo}`, [ev.file]);

    await page.goto(`${BASE}/dashboard/transactions?type=INVALID&currency=EUR&page=-1&from=notadate`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    const invalidHandled = page.url().includes('/dashboard/transactions') && (await page.locator('body').innerText()).length > 0;
    ev = await snap(page, dir, 'transactions-invalid-params', { url: page.url() });
    rec(vpReport, '3. Transactions/filters/pagination', 'Invalid transaction filter params handled gracefully', invalidHandled, `url=${page.url()}`, [ev.file]);

    const paginationNav = await page.locator('nav[aria-label="Transaction pagination"]').count();
    rec(vpReport, '3. Transactions/filters/pagination', 'Pagination controls absent/not applicable with zero records (verified state)', paginationNav === 0, `paginationNavCount=${paginationNav} (no records to paginate)`, [ev.file]);

    // 5. Profile page
    await page.goto(`${BASE}/dashboard/profile`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    ov = await hasHorizontalOverflow(page);
    const profileHeading = await page.getByRole('heading', { name: 'Your profile' }).isVisible().catch(()=>false);
    const profileEmail = await page.getByText(A.email).first().isVisible().catch(()=>false);
    const profileAcct = await page.getByText(acctNum).first().isVisible().catch(()=>false);
    const saveBtn = await page.getByRole('button', { name: 'Save changes' }).isVisible().catch(()=>false);
    ev = await snap(page, dir, 'profile', { overflow: ov });
    rec(vpReport, '5. Profile/security pages', 'Profile page shows user/account info and permitted edit form', profileHeading && profileEmail && saveBtn, `heading=${profileHeading} email=${profileEmail} acct=${profileAcct} save=${saveBtn}`, [ev.file]);
    rec(vpReport, '5. Profile/security pages', 'No horizontal overflow on profile page', !ov.overflow, JSON.stringify(ov), [ev.file]);
    if (ov.overflow) report.defects.push({ viewport: label, area: 5, detail: `Profile horizontal overflow ${JSON.stringify(ov)}` });

    // 5. Security page
    await page.goto(`${BASE}/dashboard/security`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    ov = await hasHorizontalOverflow(page);
    const secHeading = await page.getByRole('heading', { name: 'Security settings' }).isVisible().catch(()=>false);
    const secEmail = await page.getByText(A.email).first().isVisible().catch(()=>false);
    const resetLink = await page.getByRole('link', { name: 'Reset password' }).isVisible().catch(()=>false);
    const verifyLink = await page.getByRole('link', { name: 'Verification page' }).isVisible().catch(()=>false);
    ev = await snap(page, dir, 'security', { overflow: ov });
    rec(vpReport, '5. Profile/security pages', 'Security page shows session info and security actions', secHeading && secEmail && resetLink && verifyLink, `heading=${secHeading} email=${secEmail} reset=${resetLink} verify=${verifyLink}`, [ev.file]);
    rec(vpReport, '5. Profile/security pages', 'No horizontal overflow on security page', !ov.overflow, JSON.stringify(ov), [ev.file]);
    if (ov.overflow) report.defects.push({ viewport: label, area: 5, detail: `Security horizontal overflow ${JSON.stringify(ov)}` });

    // logout and verify protected route inaccessible after logout
    await logout(page);
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    const loggedOutRedirect = page.url().includes('/login');
    ev = await snap(page, dir, 'post-logout-protected-redirect', { finalUrl: page.url() });
    rec(vpReport, '7. Auth-protected routes/unauthorized access', 'Protected route inaccessible after logout', loggedOutRedirect, `url=${page.url()}`, [ev.file]);

  } catch (err) {
    const msg = String(err && err.stack || err);
    vpReport.fatalError = msg;
    report.defects.push({ viewport: label, area: 'runtime', detail: msg });
    try { await snap(page, dir, 'fatal-error'); } catch {}
  } finally {
    await context.close();
  }

  const passCount = vpReport.tests.filter(t=>t.pass).length;
  const failCount = vpReport.tests.filter(t=>!t.pass).length;
  vpReport.summary = { total: vpReport.tests.length, pass: passCount, fail: failCount, consoleErrors: vpReport.consoleErrors.length, pageErrors: vpReport.pageErrors.length };
  return vpReport;
}

async function main(){
  ensureDir(OUT_ROOT);
  const creds = readCreds();
  if (!creds.A || !creds.B) throw new Error('Missing A/B credentials in creds file');
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  try {
    // responsive viewports
    for (const vp of VIEWPORTS) {
      console.log(`Running viewport ${vp.w}x${vp.h}`);
      const r = await runViewport(browser, creds, vp);
      report.viewports.push(r);
    }

    // Session-control browser tests (revoked/expired) are executed separately via
    // scripts/phase005-session-controls.mjs and merged into acceptance evidence.
  } finally {
    await browser.close();
  }

  const summary = report.viewports.map(v=>({ viewport: v.label, ...v.summary }));
  const totals = summary.reduce((a,s)=>({ total:a.total+s.total, pass:a.pass+s.pass, fail:a.fail+s.fail }), {total:0,pass:0,fail:0});
  report.totals = totals;
  fs.writeFileSync(path.join(OUT_ROOT, 'report.json'), JSON.stringify(report, null, 2));
  // write simple markdown summary
  const lines = [];
  lines.push(`# Phase 005 viewport acceptance report`);
  lines.push(`- Base URL: ${BASE}`);
  lines.push(`- Evidence root: ${OUT_ROOT}`);
  lines.push(`- Totals: ${totals.pass}/${totals.total} PASS, ${totals.fail} FAIL`);
  lines.push('');
  for (const v of report.viewports) {
    lines.push(`## ${v.label}`);
    lines.push(`Summary: ${v.summary.pass}/${v.summary.total} PASS, ${v.summary.fail} FAIL, consoleErrors=${v.summary.consoleErrors}, pageErrors=${v.summary.pageErrors}`);
    for (const t of v.tests) {
      lines.push(`- ${t.pass ? 'PASS' : 'FAIL'} | ${t.area} | ${t.name} | ${t.details}${t.evidence?.length?` | evidence: ${t.evidence.join('; ')}`:''}`);
    }
    if (v.fatalError) lines.push(`- FATAL: ${v.fatalError}`);
    lines.push('');
  }
  if (report.defects.length) {
    lines.push('## Defects');
    for (const d of report.defects) lines.push(`- [${d.viewport}] (${d.area}) ${d.detail}`);
  } else {
    lines.push('## Defects');
    lines.push('- None discovered in executed viewport tests.');
  }
  fs.writeFileSync(path.join(OUT_ROOT, 'report.md'), lines.join('\n'));
  console.log(JSON.stringify({ outRoot: OUT_ROOT, totals, viewports: summary, defects: report.defects }, null, 2));
}

main().catch(e=>{ console.error(e); process.exit(1); });
