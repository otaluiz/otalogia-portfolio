import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 1280, height: 900 }, launchOptions: {
  executablePath: process.env.CHROMIUM_PATH,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
} })

test('Atelier sphere renders and selection updates visible descriptions', async ({ page }) => {
  test.setTimeout(120000)
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
  const sphere = page.locator('.atelier-sphere')
  await expect(sphere).toHaveAttribute('data-gallery-view', 'globe')
  // Frame the canvas center so the real WebGL raycaster receives the click.
  await page.locator('.atelier-canvas').evaluate(el => {
    const box = el.getBoundingClientRect()
    window.scrollTo(0, scrollY + box.top + box.height / 2 - innerHeight / 2)
  })
  await page.waitForTimeout(1200)
  const beforeRotation = await page.screenshot({ path: test.info().outputPath('atelier-sphere.png') })
  await page.waitForTimeout(1500)
  const afterRotation = await page.screenshot()
  expect(beforeRotation.equals(afterRotation)).toBe(false)
  const box = await page.locator('.atelier-canvas').boundingBox()
  const x = box!.x + box!.width / 2, y = box!.y + box!.height / 2
  await page.mouse.click(x, y)
  await expect(sphere).toHaveAttribute('data-gallery-view', 'inside')
  await expect(page.locator('.atelier-selection')).toHaveCount(0)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: test.info().outputPath('atelier-inside.png') })
  await page.mouse.click(x, y)
  await expect(page.locator('.atelier-selection')).toHaveCount(1)
  await expect(sphere).toHaveAttribute('data-gallery-view', 'project')
  await page.getByRole('button', { name: 'Ver galeria', exact: true }).click()
  await expect(page.locator('.atelier-selection')).toHaveCount(0)
  await expect(sphere).toHaveAttribute('data-gallery-view', 'inside')
  await page.getByRole('button', { name: 'Voltar ao globo', exact: true }).click()
  await expect(sphere).toHaveAttribute('data-gallery-view', 'globe')
  await page.locator('.atelier-index').getByRole('button', { name: 'CRM WhatsApp' }).click()
  await expect(page.locator('.atelier-selection h3')).toHaveText('CRM WhatsApp')
  await page.waitForTimeout(1500)
  await expect(page.locator('.atelier-selection h3')).toHaveText('CRM WhatsApp')
  await page.locator('#projetos').evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 40))
  await page.screenshot({ path: test.info().outputPath('atelier-desktop.png') })
  const layout = await page.locator('.atelier-view').evaluate(el => {
    const image = el.querySelector('.atelier-stage')!.getBoundingClientRect()
    const text = el.querySelector('.atelier-details')!.getBoundingClientRect()
    return image.right <= text.left && Math.min(image.bottom, text.bottom) > Math.max(image.top, text.top)
  })
  expect(layout).toBe(true)
  await page.locator('.atelier-index').getByRole('button', { name: /Soled Cuiabá — Campanha em vídeo$/ }).click()
  await expect(page.locator('.atelier-video')).toBeVisible()
  await page.locator('.atelier-video').evaluate(async el => { const video = el as HTMLVideoElement; video.muted = true; await video.play() })
  await expect.poll(() => page.locator('.atelier-video').evaluate(el => (el as HTMLVideoElement).currentTime)).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Ver galeria', exact: true }).click()
  await expect(page.locator('.atelier-selection')).toHaveCount(0)
  await page.getByRole('button', { name: 'Voltar ao globo', exact: true }).click()
  await expect(sphere).toHaveAttribute('data-gallery-view', 'globe')
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('.atelier-canvas canvas')).toBeVisible()
  await page.locator('.atelier-index').getByRole('button', { name: 'Hora da Chipa' }).click()
  await expect(page.locator('.atelier-selection h3')).toHaveText('Hora da Chipa')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
  expect(errors).toEqual([])
})
