import { expect, test } from '@playwright/test'

test.use({
  viewport: { width: 1280, height: 900 },
  launchOptions: { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
})

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  for (const module of ['background-shader', 'wave-grid', 'agentic-factory-3d']) {
    await page.route(`**/components/ui/${module}.tsx*`, route => route.fulfill({ contentType: 'application/javascript', body: 'export default function Stub(){return null}' }))
  }
})

test('curved WebGL helix loads the five screenshots and opens a panel by raycasting', async ({ page }) => {
  test.setTimeout(90000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('#projetos')).toHaveAttribute('data-helix-ready', 'true', { timeout: 30000 })
  await page.locator('#projetos').evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + scrollY))
  const state = await page.evaluate(() => window.__projectHelixDebug!.getState())
  expect(state).toMatchObject({ panels: 20, loadedImages: 5, curved: true, phase: 0 })
  expect(Number(state.angularGap)).toBeGreaterThan(0)
  expect(await page.locator('.spiral-stage').evaluate(el => getComputedStyle(el).opacity)).toBe('0')
  await expect(page.locator('.spiral-stage')).toHaveAttribute('aria-hidden', 'true')
  const bounds = await page.locator('.spiral-canvas').boundingBox()
  await page.mouse.click(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2)
  await expect(page.getByRole('heading', { name: 'Aidea Lab', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Abrir projeto Aidea Lab', exact: true })).toBeFocused()
  await page.getByRole('button', { name: 'Próximo projeto', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Abrir projeto CRM WhatsApp', exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.__projectHelixDebug!.getState().phase)).toBe(1)
  await page.keyboard.press('ArrowRight')
  await expect.poll(() => page.evaluate(() => window.__projectHelixDebug!.getState().phase)).toBe(2)
  await expect(page.getByRole('button', { name: 'Abrir projeto Pulso — Gestão de Manutenção', exact: true })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('.spiral-canvas')).toHaveCount(0)
  await expect(page.locator('#projetos')).not.toHaveAttribute('data-helix-ready', 'true')
  expect(await page.evaluate(() => !!window.__projectHelixDebug)).toBe(false)
  await page.getByRole('button', { name: 'Abrir projeto Aidea Lab', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Aidea Lab', exact: true })).toBeVisible()
})

test('scroll finishes on Ver todos and the catalogue opens the selected project', async ({ page }) => {
  test.setTimeout(90000)
  await page.goto('/')
  await expect(page.locator('#projetos')).toHaveAttribute('data-helix-ready', 'true', { timeout: 30000 })
  await expect.poll(() => page.evaluate(() => typeof window.__projectHelixDebug!.getState().scrollEnd)).toBe('number')
  const end = await page.evaluate(() => Number(window.__projectHelixDebug!.getState().scrollEnd))
  await page.evaluate(y => window.scrollTo(0, y), end)
  await expect.poll(() => page.evaluate(() => Number(window.__projectHelixDebug!.getState().exit)), { timeout: 15000 }).toBeGreaterThan(.9)
  const all = page.getByRole('button', { name: 'Ver todos', exact: true })
  await expect(all).toHaveAttribute('aria-hidden', 'false')
  await all.click()
  await expect(page.getByRole('heading', { name: 'Todos os projetos' })).toBeVisible()
  await expect(page.locator('.project-catalogue-grid button')).toHaveCount(5)
  await page.getByRole('button', { name: 'Abrir projeto Shape MT', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Shape MT', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Explorar projeto' })).toHaveAttribute('href', 'https://shapemt.vercel.app/')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
})
