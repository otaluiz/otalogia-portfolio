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
  await expect(page.locator('.spiral-controls p')).toContainText('CRM WhatsApp')
  const opener = page.getByRole('button', { name: 'Abrir projeto CRM WhatsApp', exact: true })
  await opener.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'CRM WhatsApp', exact: true })).toBeVisible()
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

test('mobile project cards remain separated throughout scroll and manual navigation', async ({ page }) => {
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 844 })
    const start = await page.locator('#projetos').evaluate(el => el.getBoundingClientRect().top + scrollY - 110)
    for (const distance of [0, 170, 440, 830]) {
      await page.evaluate(y => window.scrollTo(0, y), start + distance)
      await page.waitForTimeout(180)
      const overlap = await page.locator('.spiral-card').evaluateAll(cards => {
        const boxes = cards.map(el => el.getBoundingClientRect())
        return boxes.some((a, i) => boxes.slice(i + 1).some(b =>
          Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
          Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1))
      })
      expect(overlap).toBe(false)
    }
    await page.getByRole('button', { name: 'Próximo projeto' }).click()
    await expect.poll(() => page.locator('.spiral-card[aria-current="true"]').count()).toBe(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
  }
})

test('desktop helix keeps visible cards separated throughout a complete turn', async ({ page }) => {
  test.setTimeout(90000)
  await page.locator('a[href="#projetos"]').first().click()
  for (const width of [900, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 })
    const collisions = await page.evaluate(async () => {
      let collisions = 0
      for (let turn = 0; turn < 5; turn++) {
        document.querySelector<HTMLButtonElement>('[aria-label="Próximo projeto"]')!.click()
        const end = performance.now() + 750
        while (performance.now() < end) {
          await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
          const viewport = document.querySelector('.spiral-viewport')!.getBoundingClientRect()
          const boxes = [...document.querySelectorAll('.spiral-card')]
            .filter(el => getComputedStyle(el).visibility !== 'hidden' && Number(getComputedStyle(el).opacity) > 0.05)
            .map(el => el.getBoundingClientRect())
            .filter(box => box.right > viewport.left && box.left < viewport.right && box.bottom > viewport.top && box.top < viewport.bottom)
          for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i], b = boxes[j]
            if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
                Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) collisions++
          }
        }
      }
      return collisions
    })
    expect(collisions, `visible cards overlap at ${width}px`).toBe(0)
  }
})

test('all five projects have a local image, details and their correct public link', async ({ page }) => {
  test.setTimeout(90000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.locator('a[href="#projetos"]').first().click()
  const expected = [
    ['Aidea Lab', 'https://aidealab.com.br/#hero'],
    ['CRM WhatsApp', 'https://crm-api-tfa2.vercel.app/dashboard'],
    ['Pulso — Gestão de Manutenção', 'https://crm-manut.vercel.app/analises'],
    ['Shape MT', 'https://shapemt.vercel.app/'],
    ['Hora da Chipa', 'https://horadachipa.com.br/'],
  ]
  await expect(page.locator('.spiral-card')).toHaveCount(5)
  for (const [title, url] of expected) {
    const opener = page.locator('.spiral-card[aria-current="true"]')
    await expect(opener).toHaveAttribute('aria-label', `Abrir projeto ${title}`)
    await expect.poll(() => opener.locator('img').evaluate(img => img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0)).toBe(true)
    await opener.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Explorar projeto' })).toHaveAttribute('href', url)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(opener).toBeFocused()
    await page.getByRole('button', { name: 'Próximo projeto' }).click()
  }
})

test('project description is revealed by smooth dialog scrolling and closing restores the page', async ({ page }) => {
  await page.locator('a[href="#projetos"]').first().click()
  const opener = page.locator('.spiral-card[aria-current="true"]')
  await opener.click()
  const dialog = page.getByRole('dialog')
  await expect.poll(() => dialog.evaluate(el => el.scrollTop)).toBeGreaterThan(20)
  await expect(dialog.locator('.project-description')).toBeInViewport()
  await expect.poll(() => dialog.evaluate(el => el.classList.contains('lenis'))).toBe(true)
  await page.getByRole('button', { name: 'Fechar projeto' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
})


test('projects follow the laboratory and process never overlaps about while scrolling', async ({ page }) => {
  test.setTimeout(60000)
  expect(await page.evaluate(() => {
    const lab = document.getElementById('laboratorio')!
    const projects = document.getElementById('projetos')!
    const process = document.getElementById('processo')!
    return !!(lab.compareDocumentPosition(projects) & Node.DOCUMENT_POSITION_FOLLOWING) &&
      !!(projects.compareDocumentPosition(process) & Node.DOCUMENT_POSITION_FOLLOWING)
  })).toBe(true)
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 })
    const start = await page.locator('#processo').evaluate(el => el.getBoundingClientRect().top + scrollY - 500)
    for (const offset of [0, 200, 450, 700, 1000, 1400]) {
      await page.evaluate(y => window.scrollTo(0, y), start + offset)
      await page.waitForTimeout(180)
      const gap = await page.evaluate(() => {
        const process = document.getElementById('processo')!.getBoundingClientRect()
        const about = document.getElementById('sobre')!.getBoundingClientRect()
        return about.top - process.bottom
      })
      expect(gap, `Processo overlaps Sobre at ${width}px, scroll offset ${offset}`).toBeGreaterThanOrEqual(0)
    }
  }
})
