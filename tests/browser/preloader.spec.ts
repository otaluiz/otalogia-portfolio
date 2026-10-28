import { expect, test } from '@playwright/test'

for (const width of [1440, 390]) {
  test(`preloader dissolves in soft pixels and releases the page at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.route('https://fonts.googleapis.com/**', route => route.abort())
    await page.clock.install()
    await page.goto('/')
    const loader = page.locator('.entry-preloader')
    await expect(loader).toBeVisible()
    await expect(loader.getByRole('progressbar')).toHaveCount(1)
    await expect(loader.locator('button, img')).toHaveCount(0)
    await expect(page.locator('.otalogia-page')).toHaveAttribute('inert', '')
    await page.clock.runFor(1000)
    await expect(loader).toHaveAttribute('data-state', 'leaving')
    const pixels = await loader.locator('.entry-preloader__pixels > span').evaluateAll(elements => elements.map(el => ({
      opacity: Number(getComputedStyle(el).opacity),
      width: el.getBoundingClientRect().width,
      height: el.getBoundingClientRect().height,
    })))
    expect(pixels.length).toBeGreaterThan(100)
    expect(pixels.some(pixel => pixel.opacity > 0 && pixel.opacity < 1)).toBe(true)
    expect(new Set(pixels.map(pixel => pixel.opacity)).size).toBeGreaterThan(1)
    expect(pixels.every(pixel => Math.abs(pixel.width - pixel.height) < 5)).toBe(true)
    await page.clock.runFor(3000)
    await expect(loader).toHaveCount(0)
    await expect(page.locator('.otalogia-page')).not.toHaveAttribute('inert', '')
  })
}

test('reduced motion releases the page without a pixel animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  await page.goto('/')
  await expect(page.locator('.entry-preloader')).toHaveCount(0)
  await expect(page.locator('.otalogia-page')).not.toHaveAttribute('inert', '')
})
