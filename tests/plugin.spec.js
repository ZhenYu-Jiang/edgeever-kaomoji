import { test, expect } from '@playwright/test';

const key = 'kaomoji.preferences.v1';
const happy = '(＾▽＾)';
async function open(page, query = '') {
  await page.goto('/' + query);
  await expect(page.locator('.km-root')).toHaveAttribute('aria-busy', 'false');
}
async function stored(page) { return page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), key); }

test('search by meaning, English, literal symbols and category; clear with Escape', async ({ page }) => {
  await open(page);
  const initial = await page.locator('.km-pick').count();
  expect(initial).toBe(114);
  const search = page.getByRole('searchbox');
  await search.fill('生日');
  await expect(page.locator('.km-symbol')).toHaveText(['🎂']);
  await search.fill('HEART');
  expect(await page.locator('.km-pick').count()).toBeGreaterThan(7);
  await page.getByRole('button', { name: 'emoji', exact: true }).click();
  await expect(page.locator('.km-pick')).toHaveCount(7);
  await search.fill('不存在的分类');
  await expect(page.getByText('没有找到匹配的表情')).toBeVisible();
  await search.press('Escape');
  await expect(search).toHaveValue('');
  await page.getByRole('button', { name: '全部', exact: true }).click();
  await search.fill(happy);
  await expect(page.locator('.km-pick')).toHaveCount(1);
});

test('favorite is separate from insertion, survives reload and preserves focus when removed', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: `收藏 ${happy}`, exact: true }).click();
  await expect.poll(async () => (await stored(page))?.favorites).toEqual([happy]);
  expect(await page.evaluate(() => host.inserted)).toEqual([]);
  await page.reload();
  await expect(page.locator('.km-root')).toHaveAttribute('aria-busy', 'false');
  await page.getByRole('button', { name: '收藏 1', exact: true }).click();
  await expect(page.locator('.km-pick')).toHaveCount(1);
  const star = page.getByRole('button', { name: `取消收藏 ${happy}`, exact: true });
  await star.focus(); await page.keyboard.press('Enter');
  await expect(page.getByText('把喜欢的表情留在这里')).toBeVisible();
  await expect(page.getByRole('button', { name: '收藏 0', exact: true })).toBeFocused();
});

test('copy mode does not insert and is remembered; repeated success moves recent item to front', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: '复制', exact: true }).click();
  await page.getByRole('searchbox').fill('生日');
  await page.getByRole('button', { name: '复制 🎂', exact: true }).click();
  await expect.poll(() => page.evaluate(() => host.copied)).toEqual(['🎂']);
  expect(await page.evaluate(() => host.inserted)).toEqual([]);
  await page.getByRole('searchbox').fill(happy);
  await page.getByRole('button', { name: `复制 ${happy}`, exact: true }).click();
  await page.getByRole('searchbox').fill('生日');
  await page.getByRole('button', { name: '复制 🎂', exact: true }).click();
  await expect.poll(async () => (await stored(page))?.recent).toEqual(['🎂', happy]);
  await page.reload();
  await expect(page.getByRole('button', { name: '复制', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '最近 2', exact: true }).click();
  await expect(page.locator('.km-symbol')).toHaveText(['🎂', happy]);
});

test('insert and clipboard failures do not create false recent records', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { host.failInsert = true; });
  await page.getByRole('button', { name: `插入 ${happy}`, exact: true }).click();
  await expect.poll(() => page.evaluate(() => host.notices.at(-1))).toContain('可编辑');
  await expect(page.getByRole('button', { name: '最近 0', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '复制', exact: true }).click();
  await page.evaluate(() => { host.failCopy = true; });
  await page.getByRole('button', { name: `复制 ${happy}`, exact: true }).click();
  await expect.poll(() => page.evaluate(() => host.notices.at(-1))).toContain('复制失败');
  await expect(page.getByRole('button', { name: '最近 0', exact: true })).toBeVisible();
});

test('recent list caps at 24 distinct successful inserts and keeps original unicode', async ({ page }) => {
  await open(page);
  const texts = await page.locator('.km-symbol').allTextContents();
  for (const text of texts.slice(0, 26)) {
    await page.getByRole('button', { name: `插入 ${text}`, exact: true }).click();
  }
  await expect.poll(async () => (await stored(page))?.recent).toEqual(texts.slice(2, 26).reverse());
  expect(await page.evaluate(() => host.inserted)).toEqual(texts.slice(0, 26));
});

test('delayed storage load cannot overwrite favorites; malformed entries are filtered', async ({ page }) => {
  await page.addInitScript(({ key, happy }) => localStorage.setItem(key, JSON.stringify({
    favorites: [happy, happy, 'unknown', null], recent: ['🎂', 'bad'], mode: 'copy',
  })), { key, happy });
  await page.goto('/?readDelay=400');
  await expect(page.locator('.km-pick').first()).toBeDisabled();
  await expect(page.locator('.km-root')).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByRole('button', { name: '收藏 1', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '最近 1', exact: true })).toBeVisible();
  expect(await page.evaluate(() => host.writes)).toEqual([]);
});

test('failed reads preserve saved data; failed writes retry with latest complete state', async ({ page }) => {
  await open(page, '?failRead');
  await page.getByRole('button', { name: `收藏 ${happy}`, exact: true }).click();
  await expect(page.locator('.km-hint')).toContainText('暂未保存');
  expect(await page.evaluate(() => host.writes)).toEqual([]);
  await open(page);
  await page.evaluate(() => { host.failWrite = true; });
  await page.getByRole('button', { name: `收藏 ${happy}`, exact: true }).click();
  await expect(page.locator('.km-hint')).toContainText('暂未保存');
  await page.evaluate(() => { host.failWrite = false; });
  await page.getByRole('button', { name: '复制', exact: true }).click();
  await expect.poll(async () => (await stored(page))?.favorites).toEqual([happy]);
  await expect(page.locator('.km-hint')).not.toContainText('暂未保存');
});

test('rapid favorites serialize persistence and duplicate pending insert is ignored', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { host.writeDelay = 60; host.insertDelay = 150; });
  await page.getByRole('button', { name: `收藏 ${happy}`, exact: true }).click();
  await page.getByRole('button', { name: '收藏 (⌒▽⌒)', exact: true }).click();
  await page.getByRole('button', { name: `取消收藏 ${happy}`, exact: true }).click();
  await expect.poll(async () => (await stored(page))?.favorites).toEqual(['(⌒▽⌒)']);
  await page.evaluate((text) => {
    const pick = [...document.querySelectorAll('.km-pick')].find((b) => b.title === text);
    pick.click(); pick.click();
  }, happy);
  await expect.poll(() => page.evaluate(() => host.inserted)).toEqual([happy]);
});

test('narrow dark panel fits viewport and unmount cleans up while storage is pending', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await open(page, '?dark');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = await page.locator('.km-scroll').boundingBox();
  expect(box.height).toBeGreaterThan(100);
  await page.screenshot({ path: 'test-results/kaomoji-mobile-dark.png', fullPage: true });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?readDelay=300');
  await page.waitForFunction(() => Boolean(window.host?.deactivate));
  await page.evaluate(() => host.deactivate());
  await page.waitForTimeout(400);
  await expect(page.locator('.km-root')).toHaveCount(0);
  expect(await page.evaluate(() => [host.panelDisposed, host.commandDisposed])).toEqual([1, 1]);
  expect(errors).toEqual([]);
});

test('real browser clipboard works from a trusted user click', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page, '?realClipboard');
  await page.getByRole('button', { name: '复制', exact: true }).click();
  await page.getByRole('button', { name: `复制 ${happy}`, exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(happy);
});
