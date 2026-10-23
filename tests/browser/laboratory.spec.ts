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
  await page.goto('/')
  await page.locator('#laboratorio').scrollIntoViewIfNeeded()
  await expect.poll(() => page.evaluate(() => !!window.__machineDebug), { timeout: 30000 }).toBe(true)
  await expect(page.locator('[data-loading]')).toBeHidden({ timeout: 30000 })
  await expect(page.locator('.process-controls [data-camera]')).toHaveCount(0)
  await expect(page.locator('.process-controls button')).toHaveCount(2)
  await expect(page.getByRole('button', { name: 'Acompanhar processo', exact: true })).toHaveAttribute('aria-pressed', 'true')
  const state = await page.evaluate(() => window.__machineDebug!.getState())
  expect(state.floor).toMatchObject({ transparent: true, depthWrite: false })
  expect((state.floor as { opacity: number }).opacity).toBeLessThan(0.3)
  expect(state.functionsVisible).toBe(true)
  expect(state.camera).toBe('flight')

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
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect.poll(() => page.evaluate(() => window.__machineDebug!.getState().playing)).toBe(false)
  await page.getByRole('button', { name: '01 Conectar dados', exact: true }).click()
  await expect(page.locator('[data-function]')).toHaveText(functions[0])
  expect(await page.evaluate(() => window.__machineDebug!.getState().playing)).toBe(false)
})
