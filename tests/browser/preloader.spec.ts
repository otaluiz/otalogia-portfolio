import { expect, test } from '@playwright/test'

test('bar-only preloader clips inward and automatically releases the page', async ({ page }) => {
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
  expect(await loader.evaluate(el => getComputedStyle(el).clipPath)).not.toBe('polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)')
  await page.clock.runFor(3000)
  await expect(loader).toHaveCount(0)
  await expect(page.locator('.otalogia-page')).not.toHaveAttribute('inert', '')
})
