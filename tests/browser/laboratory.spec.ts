import { expect, test } from '@playwright/test'

// Exercise the actual 3D scene with Chromium's software WebGL renderer.
test.use({
  viewport: { width: 900, height: 800 },
  launchOptions: {
    executablePath: process.env.CHROMIUM_PATH,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  },
})

test('glass laboratory follows the product through selected stages with functions always visible', async ({ page }) => {
  test.setTimeout(120000)
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  // Isolate this test from the other WebGL scenes on the page.
  await page.route('**/components/ui/background-shader.tsx*', route => route.fulfill({ contentType: 'application/javascript', body: 'export default function BackgroundShader(){return null}' }))
  await page.route('**/components/ui/wave-grid.tsx*', route => route.fulfill({ contentType: 'application/javascript', body: 'export default function WaveGrid(){return null}' }))
  await page.route('**/components/ui/project-gallery.tsx*', route => route.fulfill({ contentType: 'application/javascript', body: 'export default function ProjectGallery(){return null}' }))
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await page.locator('#laboratorio').scrollIntoViewIfNeeded()
  await expect.poll(() => page.evaluate(() => !!window.__machineDebug), { timeout: 30000 }).toBe(true)
  await expect(page.locator('[data-loading]')).toBeHidden({ timeout: 30000 })
  await expect(page.locator('.process-controls [data-camera]')).toHaveCount(0)
  await expect(page.locator('.process-controls button')).toHaveCount(3)
  for (const selector of ['.process-controls', '.lab-pills-row']) {
    const buttons = await page.locator(selector).boundingBox()
    const viewport = await page.locator('.process-viewport').boundingBox()
    expect(buttons!.y + buttons!.height).toBeLessThanOrEqual(viewport!.y)
  }
  await expect(page.getByRole('button', { name: 'Acompanhar processo', exact: true })).toHaveAttribute('aria-pressed', 'true')
  const state = await page.evaluate(() => window.__machineDebug!.getState())
  expect(state.floor).toMatchObject({ transparent: true, depthWrite: false })
  expect((state.floor as { opacity: number }).opacity).toBeLessThan(0.3)
  expect(state.functionsVisible).toBe(true)
  expect(state.camera).toBe('flight')
  await page.locator('.process-machine').screenshot({ path: test.info().outputPath('process-desktop.png') })

  const steps = ['Conectar dados', 'Aplicar inteligência', 'Desenvolver sistemas', 'Integrar e automatizar', 'Acompanhar resultados']
  const functions = ['Organiza e conecta dados', 'Analisa e enriquece dados', 'Executa regras do negócio', 'Conecta sistemas e APIs', 'Exibe métricas e resultados']
  for (let stage = 0; stage < steps.length; stage++) {
    await page.getByRole('button', { name: `0${stage + 1} ${steps[stage]}`, exact: true }).click()
    await expect(page.locator('[data-function]')).toHaveText(functions[stage])
    await expect.poll(() => page.evaluate(() => window.__machineDebug!.getState().activeStage)).toBe(stage)
    expect(await page.evaluate(() => window.__machineDebug!.getState().functionsVisible)).toBe(true)
  }
  const before = await page.evaluate(() => JSON.stringify(window.__machineDebug!.getState().cameraPosition))
  await expect.poll(() => page.evaluate(() => JSON.stringify(window.__machineDebug!.getState().cameraPosition))).not.toBe(before)
  await page.getByRole('button', { name: 'Pausar', exact: true }).click()
  expect(await page.evaluate(() => window.__machineDebug!.getState().playing)).toBe(false)
  const paused = await page.evaluate(() => window.__machineDebug!.getState().time)
  await page.waitForTimeout(200)
  expect(await page.evaluate(() => window.__machineDebug!.getState().time)).toBe(paused)
  await page.getByRole('button', { name: 'Acompanhar processo', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.__machineDebug!.getState().playing)).toBe(true)
  // Wheel scrolling leaves the camera alone; dragging still supports orbit and pan.
  await page.evaluate(() => window.__machine!.pause())
  await page.locator('.process-viewport canvas').scrollIntoViewIfNeeded()
  await expect.poll(() => page.evaluate(() => Number(window.__machineDebug!.getState().cameraDistance))).toBeLessThan(35)
  await page.waitForTimeout(1000)
  const bounds = await page.locator('.process-viewport canvas').boundingBox()
  let x = bounds!.x + bounds!.width / 2, y = bounds!.y + bounds!.height / 2
  const distance = await page.evaluate(() => Number(window.__machineDebug!.getState().cameraDistance))
  await page.mouse.move(x, y)
  const scrollBefore = await page.evaluate(() => scrollY)
  await page.mouse.wheel(0, -360)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(scrollBefore - 100)
  expect(await page.evaluate(() => window.__machineDebug!.getState().manualCamera)).toBe(false)
  expect(Math.abs(await page.evaluate(() => Number(window.__machineDebug!.getState().cameraDistance)) - distance)).toBeLessThan(.1)
  // Finish wheel inertia before measuring coordinates for a separate drag gesture.
  await page.waitForTimeout(1500)
  await page.locator('.process-viewport canvas').scrollIntoViewIfNeeded()
  const dragBounds = await page.locator('.process-viewport canvas').boundingBox()
  x = dragBounds!.x + dragBounds!.width / 2; y = dragBounds!.y + dragBounds!.height / 2
  await page.mouse.move(x, y)
  const orbitBefore = await page.evaluate(() => JSON.stringify(window.__machineDebug!.getState().cameraPosition))
  await page.mouse.down()
  await page.mouse.move(x + 100, y + 40, { steps: 8 })
  await page.mouse.up()
  await expect.poll(() => page.evaluate(() => window.__machineDebug!.getState().manualCamera)).toBe(true)
  await expect.poll(() => page.evaluate(() => JSON.stringify(window.__machineDebug!.getState().cameraPosition))).not.toBe(orbitBefore)
  const panBefore = await page.evaluate(() => JSON.stringify(window.__machineDebug!.getState().cameraTarget))
  await page.mouse.down({ button: 'right' })
  await page.mouse.move(x + 40, y + 60, { steps: 8 })
  await page.mouse.up({ button: 'right' })
  await expect.poll(() => page.evaluate(() => JSON.stringify(window.__machineDebug!.getState().cameraTarget))).not.toBe(panBefore)
  await page.getByRole('button', { name: 'Acompanhar processo', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.__machineDebug!.getState().manualCamera)).toBe(false)
  // One click follows the product continuously across stations without stopping.
  await page.evaluate(() => { window.__machine!.focusStation('cabinet'); window.__machine!.pause() })
  const follow = page.getByRole('button', { name: 'Acompanhar etapas', exact: true })
  await follow.click()
  await expect(follow).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => page.evaluate(() => window.__machineDebug!.getState().camera)).toBe('product')
  for (const stage of [1, 2]) {
    await expect.poll(() => page.evaluate(() => window.__machineDebug!.getState().activeStage), { timeout: 20000 }).toBe(stage)
    await expect(page.locator('[data-function]')).toHaveText(functions[stage])
    expect(await page.evaluate(() => window.__machineDebug!.getState().playing)).toBe(true)
  }
  // Finishing Results also continues directly into the next cycle.
  await page.evaluate(() => window.__machine!.focusStation('cashdesk'))
  await expect.poll(() => page.evaluate(() => window.__machineDebug!.getState().activeStage), { timeout: 20000 }).toBe(0)
  await expect(page.locator('[data-function]')).toHaveText(functions[0])
  expect(await page.evaluate(() => window.__machineDebug!.getState().playing)).toBe(true)
  expect(await page.evaluate(() => window.__machineDebug!.getState().camera)).toBe('product')
  await page.getByRole('button', { name: 'Pausar', exact: true }).click()
  const held = await page.evaluate(() => window.__machineDebug!.getState().time)
  await page.waitForTimeout(300)
  expect(await page.evaluate(() => window.__machineDebug!.getState().time)).toBe(held)
  await page.getByRole('button', { name: 'Reproduzir', exact: true }).click()
  expect(await page.evaluate(() => window.__machineDebug!.getState().camera)).toBe('product')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect.poll(() => page.evaluate(() => window.__machineDebug!.getState().playing)).toBe(false)
  expect(errors).toEqual([])
  await page.getByRole('button', { name: 'Acompanhar processo', exact: true }).click()
  expect(await page.evaluate(() => window.__machineDebug!.getState().camera)).toBe('flight')
  await expect.poll(() => page.evaluate(() => window.__machineDebug!.getState().playing)).toBe(false)
  await page.getByRole('button', { name: '01 Conectar dados', exact: true }).click()
  await expect(page.locator('[data-function]')).toHaveText(functions[0])
  expect(await page.evaluate(() => window.__machineDebug!.getState().playing)).toBe(false)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.locator('.process-machine').screenshot({ path: test.info().outputPath('process-mobile.png') })
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
})

test('hero grid renders behind services and about without covering their controls', async ({ page }) => {
  test.setTimeout(120000)
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  for (const component of ['background-shader', 'project-gallery', 'agentic-factory-3d']) {
    await page.route(`**/components/ui/${component}.tsx*`, route => route.fulfill({ contentType: 'application/javascript', body: 'export default function Scene(){return null}' }))
  }
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page.locator('.entry-preloader')).toHaveCount(0, { timeout: 15000 })
  await expect(page.locator('.card-wave-backdrop canvas')).toHaveCount(5)
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 })
    const card = page.locator('.solution-card-caldera').first()
    await card.scrollIntoViewIfNeeded()
    await card.locator('.gf-hit').click()
    await expect(card.locator('.gf-root')).toHaveAttribute('data-open')
    await card.screenshot({ path: test.info().outputPath(`service-grid-${width}.png`) })
    await card.locator('.gf-hit').click()
    const about = page.locator('.about-content-card')
    await about.scrollIntoViewIfNeeded()
    await expect(about.getByRole('link', { name: 'Instagram @otalogia' })).toBeVisible()
    const bounds = await about.boundingBox()
    await page.mouse.move(bounds!.x + bounds!.width * .8, bounds!.y + bounds!.height * .5)
    await about.screenshot({ path: test.info().outputPath(`about-grid-${width}.png`) })
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
  }
  expect(errors).toEqual([])
})
