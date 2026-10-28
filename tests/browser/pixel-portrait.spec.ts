import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  for (const module of ['background-shader', 'wave-grid', 'agentic-factory-3d', 'project-gallery']) {
    await page.route(`**/components/ui/${module}.tsx*`, route => route.fulfill({ contentType: 'application/javascript', body: 'export default function Stub(){return null}' }))
  }
})

test('without WebGL the original portrait stays visible on hover', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.entry-preloader')).toHaveCount(0, { timeout: 10000 })
  const card = page.locator('.pixel-portrait')
  await card.scrollIntoViewIfNeeded()
  await card.hover()
  await expect(card).toHaveAttribute('data-pixel-state', 'idle')
  await expect(card.locator('.pixel-portrait__effect')).toHaveCount(0)
  await expect(card.locator('img')).toBeVisible()
})

test('reduced motion displays the original portrait directly', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const card = page.locator('.pixel-portrait')
  await card.scrollIntoViewIfNeeded()
  await card.hover()
  await expect(card).toHaveAttribute('data-pixel-state', 'idle')
  await expect(card.locator('.pixel-portrait__effect')).toHaveCount(0)
  await expect(card.locator('img')).toBeVisible()
  await expect(page.locator('.otalogia-page')).not.toHaveAttribute('inert', '')
})
