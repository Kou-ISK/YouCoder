const h = require("./harness.cjs")
const { assert, fs, out, A, B, key, delay } = h
const results = []
const record = (name, status, detail) => {
  const row = { name, status, detail }
  results.push(row)
  fs.writeFileSync(out + "/results.json", JSON.stringify(results, null, 2))
  console.log(JSON.stringify(row))
}
async function test(name, fn) {
  try {
    record(name, "PASS", await fn())
  } catch (e) {
    record(name, "FAIL", e.stack)
  }
}
async function until(fn, limit = 5000) {
  const end = Date.now() + limit
  while (Date.now() < end) {
    if (await fn()) return
    await delay(50)
  }
  throw new Error("condition timed out")
}
;(async () => {
  const { browser, context, popup } = await h.setup()
  for (const p of context.pages())
    if (p.url().includes("YC_TEST_")) await p.close()
  await popup.evaluate(async (data) => {
    await chrome.storage.local.clear()
    await chrome.storage.local.set(data)
  }, h.fixture)
  const one = await h.synthetic(context, A)
  const p = one.page
  fs.writeFileSync(
    out + "/synthetic-ui.txt",
    await p.locator("html").ariaSnapshot()
  )
  const toggle = (team, action) =>
    p.getByRole("button", {
      name: new RegExp(`^${team}チームの${action}アクション`)
    })
  await test("UI start / label / stop on A", async () => {
    await h.seek(p, 0)
    await toggle("Alpha", "Pass").click()
    await until(async () => ((await h.storage(popup, A)) || []).length === 1)
    await p.getByRole("button", { name: /^成功ラベル/ }).click()
    await until(async () => (await h.storage(popup, A))[0].labels.length === 1)
    await h.seek(p, 12.345)
    await toggle("Alpha", "Pass").click()
    await until(async () => (await h.storage(popup, A))[0].end === 12345)
    const a = (await h.storage(popup, A))[0]
    assert.equal(a.start, 0)
    assert.deepEqual(a.labels, ["Result - 成功"])
    assert.match(a.id, /^[\da-f-]{36}$/)
    return a
  })
  await test("A → B → A keeps persisted rows and active state isolated", async () => {
    await h.nav(p, B)
    assert.equal(await p.locator("tbody tr").count(), 0)
    await h.seek(p, 20)
    await toggle("Alpha", "Shot").click()
    await until(async () => ((await h.storage(popup, B)) || []).length === 1)
    await h.nav(p, A)
    assert.equal(await p.locator("tbody tr").count(), 1)
    assert.match(await p.locator("tbody").innerText(), /Pass/)
    assert.doesNotMatch(await p.locator("tbody").innerText(), /Shot/)
    assert.match(
      await toggle("Alpha", "Pass").getAttribute("aria-label"),
      /非アクティブ/
    )
    await h.nav(p, B)
    assert.match(
      await toggle("Alpha", "Shot").getAttribute("aria-label"),
      /\(アクティブ\)/
    )
    await h.nav(p, A)
    return "A completed Pass, B active Shot, A restored"
  })
  await test("URL-leading navigation blocks stale A controls before finish event", async () => {
    const beforeA = await h.storage(popup, A),
      beforeB = await h.storage(popup, B)
    await p.evaluate((id) => {
      history.pushState({}, "", "/watch?v=" + id)
      document
        .querySelector("plasmo-csui")
        .shadowRoot.querySelector('button[aria-label^="AlphaチームのPass"]')
        .click()
    }, B)
    await p.getByRole("alert").waitFor()
    assert.match(await p.getByRole("alert").innerText(), /切り替え/)
    assert.deepEqual(await h.storage(popup, A), beforeA)
    assert.deepEqual(await h.storage(popup, B), beforeB)
    await p.evaluate(() =>
      document.dispatchEvent(new Event("yt-navigate-finish"))
    )
    await delay(200)
    await h.nav(p, A)
    return "no write to A or B"
  })
  const two = await h.synthetic(context, A)
  await test("Same-video two-tab concurrent starts and labels survive and synchronize", async () => {
    const r = await Promise.all([
      one.send(A, {
        type: "start",
        team: "Tab1",
        action: "Pass",
        start: 25000
      }),
      two.send(A, { type: "start", team: "Tab2", action: "Pass", start: 26000 })
    ])
    assert(r.every((x) => x.ok))
    let saved = await h.storage(popup, A)
    assert.equal(saved.length, 3)
    const id = saved.find((x) => x.team === "Tab1").id
    await Promise.all([
      one.send(A, { type: "label", actionId: id, label: "one" }),
      two.send(A, { type: "label", actionId: id, label: "two" })
    ])
    await Promise.all([
      one.send(A, { type: "label", actionId: id, label: "one" }),
      two.send(A, { type: "label", actionId: id, label: "one" })
    ])
    saved = await h.storage(popup, A)
    assert.deepEqual(saved.find((x) => x.id === id).labels.sort(), [
      "one",
      "two"
    ])
    await until(
      async () =>
        (await p.locator("tbody tr").count()) === 3 &&
        (await two.page.locator("tbody tr").count()) === 3
    )
    return "both tabs show all 3 records; no duplicate label"
  })
  await test("Different-video concurrent operations stay isolated", async () => {
    await h.nav(two.page, B)
    const [a, b] = await Promise.all([
      one.send(A, {
        type: "start",
        team: "CrossA",
        action: "Shot",
        start: 30000
      }),
      two.send(B, {
        type: "start",
        team: "CrossB",
        action: "Shot",
        start: 31000
      })
    ])
    assert(a.ok && b.ok)
    assert(!(await h.storage(popup, A)).some((x) => x.team === "CrossB"))
    assert(!(await h.storage(popup, B)).some((x) => x.team === "CrossA"))
    return "A and B isolated"
  })
  await test("Restart at identical timestamp rejects all stale-ID operations", async () => {
    const r = await one.send(A, {
      type: "start",
      team: "UUID",
      action: "SameTime",
      start: 40000
    })
    assert(r.ok)
    const old = r.actions.find((x) => x.team === "UUID").id
    await one.send(A, { type: "delete", actionId: old })
    const replacement = await one.send(A, {
      type: "start",
      team: "UUID",
      action: "SameTime",
      start: 40000
    })
    const next = replacement.actions.find((x) => x.team === "UUID")
    assert.notEqual(old, next.id)
    for (const op of [
      { type: "stop", actionId: old, end: 45000 },
      { type: "label", actionId: old, label: "stale" },
      { type: "delete", actionId: old }
    ]) {
      const res = await two.send(A, op)
      assert.equal(res.ok, false)
      assert.match(res.error, /changed/)
    }
    assert.deepEqual(
      (await h.storage(popup, A)).find((x) => x.id === next.id),
      next
    )
    return { oldId: old, newId: next.id }
  })
  await test("Delete confirmation remains on selected ID after sorting", async () => {
    const visibilityBefore = await p.evaluate(() => document.visibilityState)
    // The preceding concurrency cases leave the second tab in front.
    await p.bringToFront()
    await until(
      async () => (await p.evaluate(() => document.visibilityState)) === "visible"
    )
    await p.locator("tbody tr").filter({ hasText: "UUID" }).waitFor()
    const row = p.locator("tbody tr").filter({ hasText: "CrossA" })
    const confirmation = row.getByRole("button", { name: "削除確認" })
    // Wait for each visible state so a missed click cannot masquerade as an ID bug.
    await row.getByTitle("クリックして削除を開始").click()
    await confirmation.waitFor({ state: "visible" })
    const confirmationShownAt = Date.now()
    await p.getByRole("columnheader", { name: /チーム/ }).click()
    await p.getByRole("columnheader", { name: /チーム/ }).click()
    await until(
      async () =>
        (await p.locator("tbody tr").first().locator("td").first().innerText()) ===
        "UUID"
    )
    console.log(
      JSON.stringify({
        diagnostic: "sorted-delete-confirmation",
        visibilityBefore,
        visibilityAfter: await p.evaluate(() => document.visibilityState),
        elapsedSinceConfirmationMs: Date.now() - confirmationShownAt,
        confirmationCount: await confirmation.count()
      })
    )
    await confirmation.waitFor({ state: "visible" })
    await confirmation.click()
    await until(
      async () => !(await h.storage(popup, A)).some((x) => x.team === "CrossA")
    )
    assert((await h.storage(popup, A)).some((x) => x.team === "UUID"))
    return "only CrossA removed after descending sort; normal pointer clicks and visible confirmation verified"
  })
  await test("Legacy migration produces durable IDs and retains backup", async () => {
    const legacy = [
      { team: "Old", action: "Pass", start: 0, end: 0, labels: ["日本語"] },
      {
        id: "existing-id",
        team: "Old",
        action: "Shot",
        start: 1200,
        labels: []
      }
    ]
    await popup.evaluate(
      async (legacy) =>
        chrome.storage.local.set({ timelines: { YC_TEST_LEGACY: legacy } }),
      legacy
    )
    await h.nav(p, "YC_TEST_LEGACY")
    await h.nav(two.page, "YC_TEST_LEGACY")
    const [a, b] = await Promise.all([
      one.send("YC_TEST_LEGACY", { type: "read" }),
      two.send("YC_TEST_LEGACY", { type: "read" })
    ])
    assert(a.ok && b.ok)
    assert.equal(a.actions[0].id, b.actions[0].id)
    assert.equal(a.actions[1].id, "existing-id")
    assert.equal(a.actions[0].end, 0)
    assert.deepEqual(await h.storage(popup, "YC_TEST_LEGACY"), a.actions)
    const back = await popup.evaluate(
      async () =>
        (await chrome.storage.local.get("timelines")).timelines.YC_TEST_LEGACY
    )
    assert.deepEqual(back, legacy)
    await p.screenshot({ path: out + "/02-legacy-zero-end.png" })
    return "same generated ID in both tabs, existing ID and original backup preserved"
  })
  await test("Zero-second completed interval displays completed time", async () => {
    const row = p.locator("tbody tr").filter({ hasText: "Pass" })
    assert.equal(await row.locator("td").nth(3).innerText(), "00:00.000")
    await h.seek(p, 10)
    await row.locator("td").nth(3).click()
    assert.equal(await p.locator("video").evaluate((v) => v.currentTime), 0)
    return "end=0 displayed and seeks to 0"
  })
  await test("Invalid stored payload fails closed without replacement", async () => {
    await popup.evaluate(async () =>
      chrome.storage.local.set({
        "youCoder.timeline.YC_TEST_INVALID": { bad: true }
      })
    )
    await h.nav(p, "YC_TEST_INVALID")
    await p.getByRole("alert").waitFor()
    const r = await one.send("YC_TEST_INVALID", {
      type: "start",
      team: "No",
      action: "Write",
      start: 0
    })
    assert.equal(r.ok, false)
    assert.deepEqual(await h.storage(popup, "YC_TEST_INVALID"), { bad: true })
    return "error displayed and payload retained"
  })
  await test("Failed storage write surfaces error, preserves records and recovers", async () => {
    await h.nav(p, A)
    let worker = context
      .serviceWorkers()
      .find((w) => w.url().includes(h.extensionId))
    assert(worker)
    const before = await h.storage(popup, A)
    await worker.evaluate(() => {
      globalThis.__savedSet = chrome.storage.local.set
      chrome.storage.local.set = async () => {
        throw new Error("QA injected persistence failure")
      }
    })
    try {
      await h.seek(p, 50)
      await toggle("Alpha", "Shot").click()
      await p.getByRole("alert").waitFor()
      assert.match(await p.getByRole("alert").innerText(), /保存|読み込み/)
      assert.deepEqual(await h.storage(popup, A), before)
      await p.screenshot({ path: out + "/03-save-failure.png" })
    } finally {
      await worker.evaluate(() => {
        chrome.storage.local.set = globalThis.__savedSet
        delete globalThis.__savedSet
      })
    }
    await toggle("Alpha", "Shot").click()
    await until(
      async () => (await h.storage(popup, A)).length === before.length + 1
    )
    return "injected worker set rejection; no success or lost rows; next write succeeds"
  })
  await test("CSV download preserves BOM, CRLF, escaped text and formula literals", async () => {
    const records = [
      {
        id: "csv-1",
        team: "=SUM(1,2)",
        action: '日本語,"引用"',
        start: 0,
        end: 12345,
        labels: [
          "未分類",
          "Note - 一行目\n二行目",
          "Formula - =1+1",
          'Quote - a,"b"'
        ]
      },
      {
        id: "csv-2",
        team: "Beta",
        action: "Shot",
        start: 1250,
        labels: ["@danger"]
      }
    ]
    await popup.evaluate(
      async (records) =>
        chrome.storage.local.set({ "youCoder.timeline.YC_TEST_CSV": records }),
      records
    )
    await h.nav(p, "YC_TEST_CSV")
    const downloadPromise = p.waitForEvent("download")
    await p.getByRole("button", { name: "CSV出力" }).click()
    const download = await downloadPromise
    await download.saveAs(out + "/export-fixture.csv")
    const data = fs.readFileSync(out + "/export-fixture.csv")
    assert(data.subarray(0, 3).equals(Buffer.from([239, 187, 191])))
    const s = data.toString("utf8")
    assert(s.includes("\r\n"))
    assert(s.includes('"\'=SUM(1,2)"'))
    assert(s.includes('"日本語,""引用"""'))
    assert(s.includes('"12.345"'))
    assert(s.includes('"1.25"'))
    assert(s.includes('"\'=1+1"'))
    assert(s.includes('"\'@danger"'))
    assert(s.includes("一行目\n二行目"))
    return { filename: download.suggestedFilename(), bytes: data.length }
  })
  fs.writeFileSync(
    out + "/pre-restart-storage.json",
    JSON.stringify(
      await popup.evaluate(() => chrome.storage.local.get(null)),
      null,
      2
    )
  )
  await p.screenshot({ path: out + "/04-csv-fixture.png" })
  await two.page.close()
  await h.cleanup()
  if (results.some((x) => x.status === "FAIL")) process.exitCode = 1
})().catch(async (e) => {
  record("harness fatal", "FAIL", e.stack)
  await h.cleanup().catch(console.error)
  process.exitCode = 1
})
