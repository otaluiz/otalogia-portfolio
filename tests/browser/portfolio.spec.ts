import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Isolate layout tests from third-party font availability.
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  await page.goto('/')
  await expect(page.locator('#inicio')).toBeVisible()
})

test('contact stays below earlier sections and anchors reveal it in Strict Mode', async ({ page }) => {
  await expect.poll(() => page.locator('#contato').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThan(1000)
  await page.locator('a[href="#solucoes"]').first().click()
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(500)
  await expect.poll(() => page.locator('#contato').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThan(1000)
  await page.locator('a[href="#contato"]').first().click()
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(3000)
  await expect.poll(() => page.locator('#contato').evaluate(el => Math.abs(el.getBoundingClientRect().top - innerHeight * 0.25))).toBeLessThan(3)
  await page.locator('a[href="#inicio"]').first().click()
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(2)
})

test('mobile resize and reduced motion restore flow without duplicate overlays', async ({ page }) => {
  await expect(page.locator('[data-st-overlay-el]')).toHaveCount(1)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
  await expect(page.locator('[data-st-overlay-el]')).toHaveCount(1)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('[data-st-overlay-el]')).toHaveCount(0)
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(page.locator('[data-st-overlay-el]')).toHaveCount(1)
})

test('transition boundary rules and mobile configuration preserve sibling flow', async ({ page }) => {
  const results = await page.evaluate(async () => {
    const modulePath = '/lib/section-transition.ts'
    const { sectionTransition01 } = await import(modulePath)
    const fixture = document.createElement('main')
    document.body.append(fixture)
    const checks: boolean[] = []
    fixture.innerHTML = '<section data-st-01="reveal" data-st-opacity="1"></section><section></section><section data-st-01="pin"></section>'
    let dispose = sectionTransition01(fixture)
    checks.push(!fixture.querySelector('[data-st-overlay-el]') && !fixture.querySelector('.pin-spacer'))
    dispose()
    fixture.innerHTML = '<section></section><section data-st-01="parallax" data-st-opacity="1"></section>'
    dispose = sectionTransition01(fixture)
    checks.push(!fixture.querySelector('[data-st-overlay-el]'))
    dispose()
    fixture.innerHTML = '<section data-st-01="parallax" data-st-opacity="0.5" data-st-overlay="white"></section><section></section>'
    dispose = sectionTransition01(fixture, { mobile: { breakpoint: 99999, strategy: 'disable' } })
    checks.push(!fixture.querySelector('[data-st-overlay-el]') && !fixture.querySelector('.pin-spacer'))
    dispose()
    dispose = sectionTransition01(fixture, { mobile: { breakpoint: 99999, strategy: 'simplify' } })
    checks.push(!!fixture.querySelector('.pin-spacer') && fixture.querySelector<HTMLElement>('[data-st-overlay-el]')?.style.background === 'white')
    dispose()
    checks.push(!fixture.querySelector('.pin-spacer') && !fixture.querySelector('[data-st-overlay-el]'))
    fixture.innerHTML = '<section data-st-01="pin" data-st-y="999" data-st-opacity="1"></section><section></section>'
    dispose = sectionTransition01(fixture)
    checks.push(!!fixture.querySelector('.pin-spacer') && !fixture.querySelector('[data-st-overlay-el]'))
    dispose()
    fixture.remove()
    return checks
  })
  expect(results).toEqual([true, true, true, true, true, true])
})


test('indicators count up and finish at the published values', async ({ page }) => {
  const counter = page.locator('[data-count-to="100"]')
  await expect(counter).toHaveText('0%')
  await page.locator('.stat-row-caldera').evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 250))
  await expect.poll(() => counter.textContent()).not.toBe('0%')
  await expect(counter).toHaveText('100%')
  await expect(page.locator('.stat-number')).toHaveText(['100%', '04', '24/7', '01'])
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.stat-number')).toHaveText(['100%', '04', '24/7', '01'])
  expect(await page.locator('.stat-row-caldera').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)')
  expect(await page.locator('.stat-card-caldera').first().evaluate(el => getComputedStyle(el).backdropFilter)).toContain('blur')
})

test('process precedes the laboratory and sections remain separated while scrolling', async ({ page }) => {
  test.setTimeout(60000)
  expect(await page.evaluate(() => {
    const lab = document.getElementById('laboratorio')!
    const projects = document.getElementById('projetos')!
    const process = document.getElementById('processo')!
    return process.nextElementSibling === lab && lab.nextElementSibling === projects && projects.nextElementSibling?.id === 'sobre'
  })).toBe(true)
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    const start = await page.locator('#processo').evaluate(el => el.getBoundingClientRect().top + scrollY - 500)
    for (const offset of [0, 200, 450, 700, 1000, 1400]) {
      await page.evaluate(y => window.scrollTo(0, y), start + offset)
      await page.waitForTimeout(180)
      const gap = await page.evaluate(() => {
        const process = document.getElementById('processo')!.getBoundingClientRect()
        const lab = document.getElementById('laboratorio')!.getBoundingClientRect()
        return lab.top - process.bottom
      })
      expect(gap, `Processo overlaps Laboratório at ${width}px, scroll offset ${offset}`).toBeGreaterThanOrEqual(0)
    }
  }
})
