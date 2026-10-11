const h = require("./harness.cjs")
const { assert, fs, out } = h
;(async () => {
  let { context, popup } = await h.setup()
  await popup.evaluate((data) => chrome.storage.local.set(data), h.fixture)
  let one = await h.synthetic(context, h.A)
  const p = one.page
  await p.getByRole("button", { name: "タグ付けを移動" }).focus()
  await p.keyboard.press("ArrowRight")
  const layout = await p.evaluate(() =>
    localStorage.getItem("youCoder.panelLayout.v2")
  )
  const r = await one.send(h.A, {
    type: "start",
    team: "RestartFixture",
    action: "Pass",
    start: 0
  })
  assert(r.ok)
  const saved = await popup.evaluate(() => chrome.storage.local.get(null))
  await h.closeCurrent()
  ;({ context, popup } = await h.setup())
  assert.deepEqual(
    await popup.evaluate(() => chrome.storage.local.get(null)),
    saved
  )
  one = await h.synthetic(context, h.A)
  assert.equal(
    await one.page.evaluate(() =>
      localStorage.getItem("youCoder.panelLayout.v2")
    ),
    layout
  )
  assert.equal(
    await one.page
      .locator('[data-youcoder-panel="タグ付け"]')
      .evaluate((e) => e.offsetLeft),
    10
  )
  const stopped = await one.send(h.A, {
    type: "stop",
    actionId: r.actions[0].id,
    end: 0
  })
  assert(stopped.ok)
  assert.equal(stopped.actions[0].end, 0)
  const result = {
    status: "PASS",
    storageKeys: Object.keys(saved).length,
    layoutRestored: true,
    writeAfterRestart: true
  }
  fs.writeFileSync(
    out + "/restart-results.json",
    JSON.stringify(result, null, 2)
  )
  console.log(result)
  await h.cleanup()
})().catch(async (e) => {
  console.error(e)
  await h.cleanup().catch(console.error)
  process.exitCode = 1
})
