import { expect, test } from '@playwright/test'
test.use({ launchOptions: { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } })

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  for (const module of ['background-shader', 'wave-grid', 'agentic-factory-3d']) {
    await page.route(`**/components/ui/${module}.tsx*`, route => route.fulfill({ contentType: 'application/javascript', body: 'export default function Stub(){return null}' }))
  }
})

test('entry releases keyboard navigation in Strict Mode and portrait survives unavailable GPU', async ({ page }) => {
  await page.route('**/lib/lenticular-portrait.ts*', route => route.abort())
  await page.goto('/')
  await expect(page.locator('.entry-preloader')).toHaveCount(0, { timeout: 15000 })
  await expect(page.locator('.otalogia-page')).not.toHaveAttribute('inert', '')
  await page.locator('#sobre').scrollIntoViewIfNeeded()
  await expect(page.getByAltText('Retrato do fundador da Otalogia, sorrindo diante de um fundo laranja')).toBeVisible()
  const card = page.locator('.lenticular-portrait')
  await card.dispatchEvent('pointermove', { clientX: 200, clientY: 200 })
  await expect(card).toHaveAttribute('style', /portrait-ry/)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect.poll(() => card.evaluate(el => getComputedStyle(el).transform)).toBe('none')
})

test.describe('GPU portrait', () => {

  test('loads the lens surface, follows pointer and returns to rest', async ({ page }) => {
    test.setTimeout(90000)
    await page.goto('/')
    await expect(page.locator('.entry-preloader')).toHaveCount(0, { timeout: 15000 })
    await page.locator('#sobre').scrollIntoViewIfNeeded()
    const card = page.locator('.lenticular-portrait')
    await expect(card).toHaveAttribute('data-lenticular-ready', 'true', { timeout: 30000 })
    await expect(card.locator('canvas')).toHaveCount(1)
    const box = await card.boundingBox()
    await card.dispatchEvent('pointermove', { clientX: box!.x + box!.width * .8, clientY: box!.y + box!.height * .3 })
    await expect.poll(() => card.evaluate(el => parseFloat(el.style.getPropertyValue('--portrait-ry')))).toBeCloseTo(6)
    await card.dispatchEvent('pointerleave')
    await expect.poll(() => card.evaluate(el => el.style.getPropertyValue('--portrait-ry'))).toBe('0deg')
  })
})
