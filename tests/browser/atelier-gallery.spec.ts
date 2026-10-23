import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 1280, height: 900 }, launchOptions: {
  executablePath: process.env.CHROMIUM_PATH,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
} })

test('Atelier sphere renders and selection updates visible descriptions', async ({ page }) => {
  test.setTimeout(90000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  for (const module of ['background-shader', 'wave-grid', 'agentic-factory-3d']) {
    await page.route(`**/components/ui/${module}.tsx*`, route => route.fulfill({ contentType: 'application/javascript', body: 'export default function Stub(){return null}' }))
  }
  await page.goto('/')
  await expect(page.locator('.atelier-selection')).toHaveCount(0)
  await page.locator('#projetos').scrollIntoViewIfNeeded()
  await expect(page.locator('.atelier-canvas canvas')).toBeVisible({ timeout: 30000 })
  await page.waitForTimeout(4500)
  await page.screenshot({ path: test.info().outputPath('atelier-sphere.png') })
  await page.locator('.atelier-index').getByRole('button', { name: 'CRM WhatsApp' }).click()
  await expect(page.locator('.atelier-selection h3')).toHaveText('CRM WhatsApp')
  await page.waitForTimeout(1500)
  await expect(page.locator('.atelier-selection h3')).toHaveText('CRM WhatsApp')
  await page.locator('#projetos').evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 40))
  await page.screenshot({ path: test.info().outputPath('atelier-desktop.png') })
  await page.getByRole('button', { name: 'Ver galeria', exact: true }).click()
  await expect(page.locator('.atelier-selection')).toHaveCount(0)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('.atelier-canvas canvas')).toBeVisible()
  await page.locator('.atelier-index').getByRole('button', { name: 'Hora da Chipa' }).click()
  await expect(page.locator('.atelier-selection h3')).toHaveText('Hora da Chipa')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
  expect(errors).toEqual([])
})
