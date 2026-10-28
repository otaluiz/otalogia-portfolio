import { expect, test } from '@playwright/test'

test.use({ launchOptions: {
  executablePath: process.env.CHROMIUM_PATH,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
} })

test('Atelier Pixel Media follows hover and restores the photo on exit', async ({ page }) => {
  test.setTimeout(90000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  for (const module of ['background-shader', 'wave-grid', 'agentic-factory-3d', 'project-gallery']) {
    await page.route(`**/components/ui/${module}.tsx*`, route => route.fulfill({ contentType: 'application/javascript', body: 'export default function Stub(){return null}' }))
  }
  await page.goto('/')
  await expect(page.locator('.entry-preloader')).toHaveCount(0, { timeout: 10000 })
  const card = page.locator('.pixel-portrait')
  await card.scrollIntoViewIfNeeded()
  await expect(page.locator('[data-atelier-webgl]')).toHaveCount(1)
  await expect(page.locator('[data-st-overlay-el]')).toHaveCount(1)
  await expect(card).toHaveAttribute('data-pixel-state', 'idle')
  await expect(card.locator('.pixel-portrait__effect')).toHaveCount(0)
  await card.hover()
  await expect(card).toHaveAttribute('data-pixel-state', 'interactive')
  await expect(card.locator('.pixel-portrait__effect')).toHaveCount(1)
  const box = await card.boundingBox()
  const x = box!.x + box!.width * .5, y = box!.y + box!.height * .45
  await page.mouse.move(x - 60, y)
  await page.waitForTimeout(1500)
  const before = await card.screenshot()
  await page.mouse.move(x + 70, y + 40, { steps: 8 })
  const during = await card.screenshot({ path: test.info().outputPath('portrait-hover.png') })
  expect(before.equals(during)).toBe(false)
  await page.mouse.move(0, 0)
  await expect(card).toHaveAttribute('data-pixel-state', 'idle')
  await expect(card.locator('.pixel-portrait__effect')).toHaveCount(0)
  await page.screenshot({ path: test.info().outputPath('portrait-idle.png') })
  await card.hover()
  await expect(card).toHaveAttribute('data-pixel-state', 'interactive')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(card.locator('.pixel-portrait__effect')).toHaveCount(0)
  await expect(card.locator('img')).toBeVisible()
  expect(errors).toEqual([])
})
