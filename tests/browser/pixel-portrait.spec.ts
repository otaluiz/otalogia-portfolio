import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  for (const module of ['background-shader', 'wave-grid', 'agentic-factory-3d', 'project-gallery']) {
    await page.route(`**/components/ui/${module}.tsx*`, route => route.fulfill({ contentType: 'application/javascript', body: 'export default function Stub(){return null}' }))
  }
})

test('portrait gains definition once when it enters view, without an entry preloader', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.entry-preloader, .lenticular-canvas')).toHaveCount(0)
  const card = page.locator('.pixel-portrait')
  await expect(card).not.toHaveAttribute('data-pixel-state', 'complete')
  await card.scrollIntoViewIfNeeded()
  await expect(card).toHaveAttribute('data-pixel-state', 'revealing')
  const canvas = card.locator('canvas')
  const initial = await canvas.evaluate(el => el.width)
  await expect.poll(() => canvas.evaluate(el => el.width)).toBeGreaterThan(initial)
  await expect(card).toHaveAttribute('data-pixel-state', 'complete')
  await expect(canvas).toBeHidden()
  await expect(card.locator('img')).toBeVisible()
  await page.locator('#inicio').scrollIntoViewIfNeeded()
  await card.scrollIntoViewIfNeeded()
  await expect(card).toHaveAttribute('data-pixel-state', 'complete')
})

test('reduced motion displays the original portrait directly', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const card = page.locator('.pixel-portrait')
  await card.scrollIntoViewIfNeeded()
  await expect(card).toHaveAttribute('data-pixel-state', 'complete')
  await expect(card.locator('canvas')).toBeHidden()
  await expect(card.locator('img')).toBeVisible()
  await expect(page.locator('.otalogia-page')).not.toHaveAttribute('inert', '')
})
