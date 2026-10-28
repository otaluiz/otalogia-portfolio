import { chromium, expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  await page.goto('/')
  await expect(page.locator('.entry-preloader')).toHaveCount(0)
})

test('liquid navbar preserves anchors, keyboard activation and the CSS fallback', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Principal', exact: true })
  await expect(nav).toHaveAttribute('data-gl', 'off')
  await expect(nav.locator('.nimbus-drop')).toBeVisible()
  await expect(nav.locator('.nimbus-items').getByRole('link')).toHaveCount(5)
  await expect(nav.getByRole('link', { name: 'Otalogia início' })).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Vamos conversar' })).toBeVisible()
  await expect(nav.locator('.nimbus-glass')).toHaveCount(1)
  expect(await nav.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)')
  await nav.getByRole('link', { name: 'Soluções', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  const process = nav.getByRole('link', { name: 'Processo', exact: true })
  await expect(process).toBeFocused()
  await expect(page).not.toHaveURL(/#processo$/)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#processo$/)
  await expect(process).toHaveAttribute('aria-current', 'location')
  await nav.getByRole('link', { name: 'Sobre', exact: true }).click()
  await expect(page).toHaveURL(/#sobre$/)
  await expect(nav.getByRole('link', { name: 'Sobre', exact: true })).toHaveAttribute('aria-current', 'location')
  await expect.poll(() => nav.locator('.nimbus-drop').evaluate(el => {
    const drop = el.getBoundingClientRect()
    const active = el.parentElement!.querySelector('[aria-current]')!.getBoundingClientRect()
    return Math.abs(drop.left - active.left) < 1 && Math.abs(drop.width - active.width) < 1 && Math.abs(drop.height - active.height) < 1
  })).toBe(true)
  await page.screenshot({ path: test.info().outputPath('navbar-desktop.png') })
})

test('mobile menu works and the liquid navbar remeasures after resize', async ({ page }) => {
  for (const width of [1024, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    if (width < 1024) {
      await expect(page.locator('.nimbus-nav')).toBeVisible()
      await expect(page.locator('.nimbus-items')).toBeHidden()
      if (width <= 680) await expect(page.locator('.caldera-nav').getByRole('link', { name: 'Vamos conversar' })).toBeHidden()
      await page.getByRole('button', { name: 'Menu +' }).click()
      await page.locator('#mobile-nav').getByRole('link', { name: 'Projetos' }).click()
      await expect(page).toHaveURL(/#projetos$/)
      await expect(page.locator('#mobile-nav')).toHaveCount(0)
    } else {
      const links = await page.locator('.caldera-logo, .nimbus-items, .caldera-nav-actions').evaluateAll(elements => elements.map(el => {
        const { left, right } = el.getBoundingClientRect()
        return { left, right }
      }))
      expect(links[0].right).toBeLessThanOrEqual(links[1].left)
      expect(links[1].right).toBeLessThanOrEqual(links[2].left)
    }
  }
  await page.screenshot({ path: test.info().outputPath('navbar-mobile.png') })
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(page.locator('.nimbus-nav')).toBeVisible()
  await expect.poll(() => page.locator('.nimbus-drop').evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThan(40)
})

test.describe('WebGL water', () => {
  test('shader renders and context loss keeps navigation usable', async () => {
    test.setTimeout(60000)
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
      const errors: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      await page.route('https://fonts.googleapis.com/**', route => route.abort())
      await page.goto('http://127.0.0.1:5173')
      await expect(page.locator('.entry-preloader')).toHaveCount(0)
      const nav = page.locator('.nimbus-nav')
      await expect(nav).toHaveAttribute('data-gl', 'on')
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await nav.getByRole('link', { name: 'Projetos', exact: true }).click()
      await expect(page).toHaveURL(/#projetos$/)
      await page.locator('.caldera-nav').screenshot({ path: test.info().outputPath('navbar-webgl.png') })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await nav.locator('canvas').evaluate(canvas => {
        canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))
      })
      await expect(nav).toHaveAttribute('data-gl', 'off')
      await expect(nav.locator('.nimbus-drop')).toBeVisible()
      await nav.getByRole('link', { name: 'Soluções', exact: true }).click()
      await expect(page).toHaveURL(/#solucoes$/)
      expect(errors).toEqual([])
    } finally {
      await browser.close()
    }
  })
})
