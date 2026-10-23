import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  await page.goto('/')
})

test('service file names remain exposed when folders open', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const folder of await page.locator('.gf-root').all()) {
    await folder.scrollIntoViewIfNeeded()
    await folder.locator('.gf-hit').click()
    await expect(folder).toHaveAttribute('data-open')
    await page.waitForTimeout(1000)
    const visible = await folder.locator('.gf-sheet-name').evaluateAll(names => names.map(name => {
      const box = name.getBoundingClientRect()
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      return hit === name || name.contains(hit)
    }))
    expect(visible).toEqual([true, true, true])
  }
})

test('Atelier gallery keeps every description and link accessible without WebGL', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const projects = [
    ['Aidea Lab', 'https://aidealab.com.br/#hero'],
    ['CRM WhatsApp', 'https://crm-api-tfa2.vercel.app/dashboard'],
    ['Pulso — Gestão de Manutenção', 'https://crm-manut.vercel.app/analises'],
    ['Shape MT', 'https://shapemt.vercel.app/'],
    ['Hora da Chipa', 'https://horadachipa.com.br/'],
  ]
  for (const width of [1440, 390, 360]) {
    await page.setViewportSize({ width, height: 900 })
    for (const [title, url] of projects) {
      await page.locator('.atelier-index').getByRole('button', { name: title }).click()
      await expect(page.locator('.atelier-selection h3')).toHaveText(title)
      await expect(page.locator('.atelier-selection p')).not.toBeEmpty()
      await expect(page.getByRole('link', { name: 'Explorar projeto' })).toHaveAttribute('href', url)
      expect(await page.locator('.atelier-fallback').evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
  }
})

test('laboratory uses the open section and readable secondary text', async ({ page }) => {
  const scene = page.locator('.process-machine')
  await expect(scene).toBeAttached()
  expect(await scene.evaluate(el => getComputedStyle(el).overflow)).toBe('visible')
  expect(await page.locator('.process-viewport').evaluate(el => getComputedStyle(el).overflow)).toBe('visible')
  expect(await page.locator('.stat-desc').first().evaluate(el => getComputedStyle(el).color)).toBe('rgb(238, 234, 245)')
})
