import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  await page.goto('/')
})

test('service file names remain exposed when folders open', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const folder of await page.locator('.gf-root').all()) {
    await folder.scrollIntoViewIfNeeded()
    await folder.locator('.gf-hit').click()
    await expect(folder).toHaveAttribute('data-open')
    await page.waitForTimeout(1000)
    const visible = await folder.locator('.gf-sheet-name').evaluateAll(names => names.map(name => {
      const box = name.getBoundingClientRect()
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      return hit === name || name.contains(hit)
    }))
    expect(visible).toEqual([true, true, true])
  }
})

test('Atelier gallery keeps every description and link accessible without WebGL', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.atelier-selection')).toHaveCount(0)
  expect(await page.locator('#sobre').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)')
  expect(await page.locator('.about-content-card').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)')
  const projects = [
    ['Aidea Lab', 'https://aidealab.com.br/#hero'],
    ['CRM WhatsApp', 'https://crm-api-tfa2.vercel.app/dashboard'],
    ['Pulso — Gestão de Manutenção', 'https://crm-manut.vercel.app/analises'],
    ['Shape MT', 'https://shapemt.vercel.app/'],
    ['Hora da Chipa', 'https://horadachipa.com.br/'],
  ]
  for (const width of [1440, 390, 360]) {
    await page.setViewportSize({ width, height: 900 })
    for (const [title, url] of projects) {
      await page.locator('.atelier-index').getByRole('button', { name: new RegExp(`${title}$`) }).click()
      await expect(page.locator('.atelier-selection h3')).toHaveText(title)
      await expect(page.locator('.atelier-selection p')).not.toBeEmpty()
      await expect(page.getByRole('link', { name: 'Explorar projeto' })).toHaveAttribute('href', url)
      expect(await page.locator('.atelier-fallback').evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
  }
})

test('laboratory uses the open section and readable secondary text', async ({ page }) => {
  const scene = page.locator('.process-machine')
  await expect(scene).toBeAttached()
  expect(await scene.evaluate(el => getComputedStyle(el).overflow)).toBe('visible')
  expect(await page.locator('.process-viewport').evaluate(el => getComputedStyle(el).overflow)).toBe('visible')
  expect(await page.locator('.stat-desc').first().evaluate(el => getComputedStyle(el).color)).toBe('rgb(238, 234, 245)')
})

test('three Instagram video projects use original covers and play locally on selection', async ({ page }) => {
  test.setTimeout(60000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const requestedVideos: string[] = []
  page.on('request', request => { if (request.url().includes('/videos/projects/')) requestedVideos.push(request.url()) })
  await expect(page.locator('.atelier-index button')).toHaveCount(8)
  const reels = [
    ['Soled Cuiabá — Campanha em vídeo', 'Db4Jz4Jg20H'],
    ['Shape MT — Edição de Reel', 'DdJYirDqJOc'],
    ['Edição dinâmica — Motion e sound design', 'DeJ6i5ACMsm'],
  ]
  for (const [title, code] of reels) {
    const priorRequests = requestedVideos.length
    await page.locator('.atelier-index').getByRole('button', { name: new RegExp(`${title}$`) }).click()
    await expect(page.locator('.atelier-selection h3')).toHaveText(title)
    await expect(page.getByRole('link', { name: 'Ver publicação no Instagram' })).toHaveAttribute('href', `https://www.instagram.com/reel/${code}/`)
    const player = page.locator('.atelier-video')
    await expect(player).toHaveAttribute('poster', `/images/projects/reel-${code}.jpg`)
    await expect(player).toHaveAttribute('preload', 'none')
    await expect(player.locator('source')).toHaveAttribute('src', `/videos/projects/${code}.mp4`)
    expect(requestedVideos.length).toBe(priorRequests)
    await player.evaluate(async el => { const video = el as HTMLVideoElement; video.muted = true; await video.play() })
    await expect.poll(() => player.evaluate(el => (el as HTMLVideoElement).currentTime), { timeout: 15000 }).toBeGreaterThan(0)
    expect(await player.evaluate(el => (el as HTMLVideoElement).videoWidth)).toBe(720)
    await page.getByRole('button', { name: 'Ver galeria', exact: true }).click()
    await expect(player).toHaveCount(0)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.locator('.atelier-index').getByRole('button', { name: new RegExp(`${reels[0][0]}$`) }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
  const playerWidth = await page.locator('.atelier-video').evaluate(el => el.getBoundingClientRect().width)
  expect(playerWidth).toBeLessThanOrEqual(390)
})
