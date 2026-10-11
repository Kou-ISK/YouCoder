const h = require("./harness.cjs")
const { assert, fs, out, delay } = h
const results = []
async function test(name, fn) {
  try {
    results.push({ name, status: "PASS", detail: await fn() })
  } catch (e) {
    results.push({ name, status: "FAIL", detail: e.stack })
  }
  fs.writeFileSync(
    out + "/lifecycle-results.json",
    JSON.stringify(results, null, 2)
  )
  console.log(results.at(-1))
}
;(async () => {
  const { browser, context, popup } = await h.setup()
  await popup.evaluate((data) => chrome.storage.local.set(data), h.fixture)
  const one = await h.synthetic(context, "YC_TEST_FOLLOWUP")
  const p = one.page
  await test("Stale-ID rejection retest with correct failure contract", async () => {
    const started = await one.send("YC_TEST_FOLLOWUP", {
      type: "start",
      team: "UUID",
      action: "Pass",
      start: 40000
    })
    const old = started.actions[0].id
    await one.send("YC_TEST_FOLLOWUP", { type: "delete", actionId: old })
    const fresh = await one.send("YC_TEST_FOLLOWUP", {
      type: "start",
      team: "UUID",
      action: "Pass",
      start: 40000
    })
    const next = fresh.actions[0]
    assert.notEqual(next.id, old)
    for (const op of [
      { type: "stop", actionId: old, end: 50000 },
      { type: "label", actionId: old, label: "stale" },
      { type: "delete", actionId: old }
    ]) {
      const r = await one.send("YC_TEST_FOLLOWUP", op)
      assert.equal(r.ok, false)
      assert.match(r.error, /changed/)
    }
    assert.deepEqual((await h.storage(popup, "YC_TEST_FOLLOWUP"))[0], next)
    return "all three stale operations explicitly rejected; replacement unchanged"
  })
  await test("Delete after sorting two visible rows keeps selected identity", async () => {
    await popup.evaluate(() =>
      chrome.storage.local.set({
        "youCoder.timeline.YC_TEST_SORT": [
          {
            id: "sort-A",
            team: "Alpha",
            action: "Pass",
            start: 1000,
            end: 2000,
            labels: []
          },
          {
            id: "sort-Z",
            team: "Zulu",
            action: "Shot",
            start: 3000,
            end: 4000,
            labels: []
          }
        ]
      })
    )
    await h.nav(p, "YC_TEST_SORT")
    const row = p.locator("tbody tr").filter({ hasText: "Alpha" })
    await row.hover()
    // Force bypasses actionability checks, including pointer-event reception.
    // This checks record identity, not whether a normal click can reach the control.
    await row.getByTitle("クリックして削除を開始").click({ force: true })
    await p.getByRole("columnheader", { name: /チーム/ }).click({ force: true })
    await p.getByRole("columnheader", { name: /チーム/ }).click({ force: true })
    assert.equal(
      await p.locator("tbody tr").first().locator("td").first().innerText(),
      "Zulu"
    )
    await row.getByRole("button", { name: "削除確認" }).click({ force: true })
    await delay(250)
    assert.deepEqual(
      (await h.storage(popup, "YC_TEST_SORT")).map((x) => x.id),
      ["sort-Z"]
    )
    return "Alpha remains confirmation target after descending sort; forced clicks verify identity, not pointer reachability"
  })
  await test("Actual MV3 service worker stop and message-triggered restart", async () => {
    const pageCDP = await context.newCDPSession(popup)
    let versions = []
    pageCDP.on("ServiceWorker.workerVersionUpdated", (e) =>
      versions.push(...e.versions)
    )
    await pageCDP.send("ServiceWorker.enable")
    await delay(300)
    const version = versions
      .filter(
        (x) =>
          x.scriptURL.includes(h.extensionId) && x.runningStatus === "running"
      )
      .at(-1)
    assert(version, "worker version available: " + JSON.stringify(versions))
    const before = await h.storage(popup, "YC_TEST_FOLLOWUP")
    await pageCDP.send("ServiceWorker.stopWorker", {
      versionId: version.versionId
    })
    await delay(200)
    const targets = await pageCDP.send("Target.getTargets")
    assert(
      !targets.targetInfos.some(
        (t) => t.type === "service_worker" && t.url.includes(h.extensionId)
      ),
      "worker target disappeared"
    )
    const r = await one.send("YC_TEST_FOLLOWUP", { type: "read" })
    assert(r.ok)
    assert.deepEqual(r.actions, before)
    const r2 = await one.send("YC_TEST_FOLLOWUP", {
      type: "start",
      team: "AfterRestart",
      action: "Shot",
      start: 60000
    })
    assert(r2.ok)
    assert(r2.actions.some((x) => x.team === "AfterRestart"))
    await pageCDP.detach()
    return {
      stoppedVersionId: version.versionId,
      restoredRecords: before.length,
      newWrite: true
    }
  })
  fs.writeFileSync(
    out + "/restart-expected.json",
    JSON.stringify(
      await popup.evaluate(() => chrome.storage.local.get(null)),
      null,
      2
    )
  )
  await p.screenshot({ path: out + "/05-worker-restart.png" })
  await test("Browser identity and launch argument isolation", async () => {
    const page = await context.newPage()
    await page.goto("chrome://version")
    const text = await page.locator("body").innerText()
    fs.writeFileSync(out + "/chrome-version.txt", text)
    assert(text.includes("youcoder-mv3-profile-"))
    assert(!text.includes("--no-sandbox"))
    assert(!text.includes("--disable-web-security"))
    await page.close()
    return browser.version()
  })
  await h.cleanup()
  if (results.some((x) => x.status === "FAIL")) process.exitCode = 1
})().catch(async (e) => {
  console.error(e)
  await h.cleanup().catch(console.error)
  process.exitCode = 1
})
