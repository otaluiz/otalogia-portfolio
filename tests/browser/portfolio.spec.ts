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

test('carousel opens project details, traps focus and restores its opener', async ({ page }) => {
  await page.locator('a[href="#projetos"]').first().click()
  await page.getByRole('button', { name: 'Próximo projeto' }).click()
  await expect(page.locator('.spiral-controls p')).toContainText('Otalogia Post')
  const opener = page.locator('.spiral-card[aria-current="true"]')
  await opener.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Otalogia Post' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(opener).toBeFocused()
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


test('scroll continuously rotates the project spiral while the section is pinned', async ({ page }) => {
  const start = await page.locator('#projetos').evaluate(el => el.getBoundingClientRect().top + scrollY - 110)
  await page.evaluate(y => window.scrollTo(0, y), start + 150)
  const first = page.locator('.spiral-card').first()
  await expect.poll(() => first.evaluate(el => el.style.transform)).not.toBe('')
  await page.waitForTimeout(900)
  const before = await first.evaluate(el => el.style.transform)
  await page.evaluate(y => window.scrollTo(0, y), start + 850)
  await expect.poll(() => first.evaluate(el => el.style.transform)).not.toBe(before)
  await expect.poll(() => page.locator('#projetos').evaluate(el => Math.abs(el.getBoundingClientRect().top - 110))).toBeLessThan(3)
  await expect.poll(() => page.locator('#contato').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThan(1000)
})

test('mobile projects fit the viewport and rotate without exposing the contact', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const start = await page.locator('#projetos').evaluate(el => el.getBoundingClientRect().top + scrollY - 110)
  await page.evaluate(y => window.scrollTo(0, y), start + 200)
  await expect.poll(() => page.locator('#projetos').evaluate(el => Math.abs(el.getBoundingClientRect().top - 110))).toBeLessThan(3)
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
  await expect.poll(() => page.locator('.spiral-controls').evaluate(el => el.getBoundingClientRect().bottom)).toBeLessThan(844)
  await expect.poll(() => page.locator('#contato').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThan(844)
  const before = await page.locator('.spiral-card').first().evaluate(el => el.style.transform)
  await page.mouse.wheel(0, 600)
  await expect.poll(() => page.locator('.spiral-card').first().evaluate(el => el.style.transform)).not.toBe(before)
})
