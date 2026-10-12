// User-facing flows in a synthetic page. No public YouTube requests are made.
const h = require("./harness.cjs")
const { assert, fs, out, A, B, key, until } = h
const results = []
async function test(name, fn) {
  try {
    results.push({ name, status: "PASS", detail: await fn() })
  } catch (error) {
    results.push({ name, status: "FAIL", detail: error.stack })
  }
  fs.writeFileSync(
    out + "/experience-results.json",
    JSON.stringify(results, null, 2)
  )
  console.log(JSON.stringify(results.at(-1)))
}
const savedRow = (id, team, start = 1000) => ({
  id,
  team,
  action: "Pass",
  start,
  end: start + 2000,
  labels: ["Result - 成功"]
})
const toggle = (page, action = "Pass") =>
  page.getByRole("button", {
    name: new RegExp(`^Alphaチームの${action}アクション`)
  })
async function panelGeometry(page) {
  const boxes = await page
    .locator("[data-youcoder-panel]")
    .evaluateAll((panels) =>
      panels.map((p) => p.getBoundingClientRect().toJSON())
    )
  assert.equal(boxes.length, 2)
  const [a, b] = boxes
  assert(
    a.right <= b.left ||
      b.right <= a.left ||
      a.bottom <= b.top ||
      b.bottom <= a.top,
    "panel controls must not overlap"
  )
  return boxes
}
async function timeCellBounds(page) {
  const measurements = await page
    .locator("tbody tr td:nth-child(3), tbody tr td:nth-child(4)")
    .evaluateAll((cells) =>
      cells.map((cell) => {
        const range = document.createRange()
        range.selectNodeContents(cell)
        return {
          text: cell.textContent,
          cell: cell.getBoundingClientRect().toJSON(),
          textRects: [...range.getClientRects()].map((r) => r.toJSON())
        }
      })
    )
  assert(measurements.length > 0, "time cells exist")
  for (const { text, cell, textRects } of measurements) {
    for (const rect of textRects) {
      assert(
        rect.left >= cell.left && rect.right <= cell.right,
        `time ${text} fits its own column: ${JSON.stringify({ cell, rect })}`
      )
      assert(
        rect.top >= cell.top && rect.bottom <= cell.bottom,
        `time ${text} fits the row height`
      )
    }
  }
  return measurements
}
async function settledTimeline(page) {
  await page
    .getByText("新しいアクション追加", { exact: true })
    .waitFor({ state: "hidden" })
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      )
  )
}
async function promptBounds(page, width) {
  const region = page.getByRole("region", { name: "タグ付けの操作と案内" })
  const prompt = page.getByText("🎯 アクションを選択してください", {
    exact: true
  })
  await prompt.locator("..").scrollIntoViewIfNeeded()
  const measured = await region.evaluate((region) => {
    const heading = [...region.querySelectorAll("div")].find(
      (e) => e.textContent === "🎯 アクションを選択してください"
    )
    const card = heading.parentElement
    const range = document.createRange()
    range.selectNodeContents(card)
    return {
      region: region.getBoundingClientRect().toJSON(),
      scrollWidth: region.scrollWidth,
      clientWidth: region.clientWidth,
      scrollTop: region.scrollTop,
      scrollHeight: region.scrollHeight,
      card: card.getBoundingClientRect().toJSON(),
      textRects: [...range.getClientRects()].map((r) => r.toJSON())
    }
  })
  assert(
    measured.scrollWidth <= measured.clientWidth + 1,
    "prompt does not cause horizontal clipping"
  )
  assert(
    measured.card.top >= measured.region.top - 1 &&
      measured.card.bottom <= measured.region.bottom + 1,
    "the whole prompt card, including its padding, is reachable by scrolling"
  )
  for (const rect of measured.textRects) {
    assert(
      rect.left >= measured.region.left - 1 &&
        rect.right <= measured.region.right + 1,
      "prompt text wraps inside the scroll region"
    )
    assert(
      rect.top >= measured.region.top - 1 &&
        rect.bottom <= measured.region.bottom + 1,
      "complete prompt is reachable inside the scroll region"
    )
  }
  await page.screenshot({
    path: out + `/narrow-${width}-prompt.png`,
    fullPage: true
  })
  return measured
}
async function badgeBounds(page, width) {
  const badge = page.getByText("新しいアクション追加", { exact: true })
  await badge.waitFor()
  const measured = await badge.evaluate((badge) => {
    const panel = badge.closest("[data-youcoder-panel]")
    return {
      badge: badge.getBoundingClientRect().toJSON(),
      controls: [
        ...panel.querySelectorAll(
          ".timeline-actions select, .timeline-actions button, thead"
        )
      ].map((e) => e.getBoundingClientRect().toJSON())
    }
  })
  for (const control of measured.controls) {
    const b = measured.badge
    assert(
      b.right <= control.left ||
        control.right <= b.left ||
        b.bottom <= control.top ||
        control.bottom <= b.top,
      "new-action notice has its own row and does not cover filters or table header"
    )
  }
  await page.screenshot({
    path: out + `/narrow-${width}-new-action.png`,
    fullPage: true
  })
  return measured
}
async function exportJson(popup) {
  const download = popup.waitForEvent("download")
  await popup.getByRole("button", { name: "エクスポート", exact: true }).click()
  const file = await download
  const destination = out + "/button-set.json"
  await file.saveAs(destination)
  return fs.readFileSync(destination)
}
async function importJson(popup, buffer) {
  const chooser = popup.waitForEvent("filechooser")
  await popup.getByRole("button", { name: "インポート", exact: true }).click()
  await (
    await chooser
  ).setFiles({ name: "button-set.json", mimeType: "application/json", buffer })
}
;(async () => {
  let { context, popup } = await h.setup()
  await popup.evaluate((data) => chrome.storage.local.set(data), {
    ...h.fixture,
    [key(A)]: [savedRow("row-A", "Alpha"), savedRow("row-Z", "Zulu", 3000)]
  })
  await popup.reload()
  let one = await h.synthetic(context, A)
  let p = one.page
  await test("Normal pointer clicks delete the selected row after sorting", async () => {
    const row = p.locator("tbody tr").filter({ hasText: "Alpha" })
    await row.getByTitle("クリックして削除を開始").click()
    await p.getByRole("columnheader", { name: /チーム/ }).click()
    await p.getByRole("columnheader", { name: /チーム/ }).click()
    assert.match(await p.locator("tbody tr").first().innerText(), /Zulu/)
    await row.getByRole("button", { name: "削除確認" }).click()
    await until(
      async () => (await h.storage(popup, A)).length === 1,
      "one row deleted"
    )
    assert.equal((await h.storage(popup, A))[0].id, "row-Z")
    return "all clicks use Playwright actionability; no force or DOM click"
  })
  await test("Moved/resized panels and restored legacy overlap keep both controls reachable", async () => {
    await p.evaluate(() =>
      localStorage.setItem(
        "youCoder.panelLayout.v2",
        JSON.stringify({
          wide: {
            taggingPanel: {
              position: { x: 30, y: 30 },
              size: { width: 444, height: 350 }
            },
            timelinePanel: {
              position: { x: 396, y: 0 },
              size: { width: 994, height: 420 }
            }
          }
        })
      )
    )
    await p.reload()
    await p.getByRole("button", { name: "CSV出力" }).waitFor()
    const before = await panelGeometry(p)
    await p.getByRole("button", { name: "タグ付けを移動" }).focus()
    await p.keyboard.press("ArrowRight")
    await p.getByRole("button", { name: "タグ付けのサイズを変更" }).focus()
    await p.keyboard.press("ArrowRight")
    await panelGeometry(p)
    const download = p.waitForEvent("download")
    await p.getByRole("button", { name: "CSV出力" }).click()
    await (await download).saveAs(out + "/reachable-after-move.csv")
    await settledTimeline(p)
    const times = await timeCellBounds(p)
    await p.screenshot({ path: out + "/panels-after-move.png", fullPage: true })
    await p.reload()
    await p.getByRole("button", { name: "CSV出力" }).waitFor()
    await panelGeometry(p)
    return { before, restored: await panelGeometry(p), times }
  })
  await test("375px and 320px: tag, filter, scroll right, delete and export via normal UI", async () => {
    const measured = []
    for (const width of [375, 320]) {
      await p.setViewportSize({ width, height: 900 })
      await p.getByRole("button", { name: "配置をリセット" }).click()
      const videoId = `YC_NARROW_${width}`
      await h.nav(p, videoId)
      const prompt = await promptBounds(p, width)
      await h.seek(p, 1)
      await toggle(p).click()
      await until(
        async () => (await h.storage(popup, videoId))?.length === 1,
        "narrow start"
      )
      const badge = await badgeBounds(p, width)
      await p.getByRole("button", { name: /^成功ラベル/ }).click()
      await h.seek(p, 4)
      await toggle(p).click()
      await until(
        async () => (await h.storage(popup, videoId))[0].end === 4000,
        "narrow stop"
      )
      const timeline = p.locator('[data-youcoder-panel="タイムライン"]')
      await timeline.getByRole("combobox").nth(0).selectOption("Alpha")
      assert.equal(await p.locator("tbody tr").count(), 1)
      const scroller = p.getByLabel(
        "タイムライン表（左右にスクロールできます）"
      )
      await settledTimeline(p)
      const endCell = p.locator("tbody tr td:nth-child(4)").first()
      await endCell.scrollIntoViewIfNeeded()
      const times = await timeCellBounds(p)
      const visibleTime = await endCell.evaluate((cell) => {
        const range = document.createRange()
        range.selectNodeContents(cell)
        return {
          text: range.getBoundingClientRect().toJSON(),
          scroller: cell
            .closest("table")
            .parentElement.getBoundingClientRect()
            .toJSON()
        }
      })
      assert(
        visibleTime.text.left >= visibleTime.scroller.left &&
          visibleTime.text.right <= visibleTime.scroller.right,
        "horizontal scrolling exposes the complete end time"
      )
      await p.screenshot({
        path: out + `/narrow-${width}-times.png`,
        fullPage: true
      })
      await scroller.scrollIntoViewIfNeeded()
      await scroller.hover()
      await p.mouse.wheel(1000, 0)
      await until(
        () => scroller.evaluate((e) => e.scrollLeft > 0),
        "horizontal wheel reaches action column"
      )
      await p.screenshot({
        path: out + `/narrow-${width}-actions.png`,
        fullPage: true
      })
      await p.getByTitle("クリックして削除を開始").click()
      console.log(
        "Narrow confirmation geometry",
        await scroller.evaluate((e) => ({
          clientHeight: e.clientHeight,
          scrollTop: e.scrollTop,
          scrollLeft: e.scrollLeft
        }))
      )
      await p.getByRole("button", { name: "削除確認" }).click()
      await until(
        async () => (await h.storage(popup, videoId)).length === 0,
        "narrow row deleted"
      )
      const download = p.waitForEvent("download")
      await p.getByRole("button", { name: "CSV出力" }).click()
      await (await download).saveAs(out + `/narrow-${width}.csv`)
      measured.push({
        width,
        panels: await panelGeometry(p),
        times,
        visibleTime,
        badge,
        prompt
      })
    }
    return measured
  })
  await test("SPA video element replacement keeps A/B active tagging isolated and resumable", async () => {
    await p.setViewportSize({ width: 1440, height: 1000 })
    await p.getByRole("button", { name: "配置をリセット" }).click()
    const ids = ["YC_CONTINUE_A", "YC_CONTINUE_B"]
    for (const id of ids) {
      await p.evaluate((id) => {
        document.dispatchEvent(new Event("yt-navigate-start"))
        history.pushState({}, "", "/watch?v=" + id)
        const old = document.querySelector("video")
        old.replaceWith(old.cloneNode(true))
        document.dispatchEvent(new Event("yt-navigate-finish"))
      }, id)
      await h.seek(p, 5)
      await toggle(p).click()
      await until(
        async () => (await h.storage(popup, id))?.length === 1,
        "start in replaced video"
      )
    }
    await h.nav(p, ids[0])
    await p.getByRole("button", { name: /^成功ラベル/ }).click()
    await h.seek(p, 8)
    await toggle(p).click()
    await until(
      async () => (await h.storage(popup, ids[0]))[0].end === 8000,
      "resume A"
    )
    assert.equal((await h.storage(popup, ids[1]))[0].end, undefined)
    await h.nav(p, ids[1])
    await h.seek(p, 9)
    await toggle(p).click()
    await until(
      async () => (await h.storage(popup, ids[1]))[0].end === 9000,
      "resume B"
    )
    assert.deepEqual((await h.storage(popup, ids[1]))[0].labels, [])
    return "synthetic yt-navigate events plus real DOM video replacement; not live YouTube SPA"
  })
  await test("Storage-only permission: measured 10k records and real quota rejection/recovery", async () => {
    const manifest = await popup.evaluate(() => chrome.runtime.getManifest())
    assert.deepEqual(manifest.permissions, ["storage"])
    const sample = Array.from({ length: 10000 }, (_, i) =>
      savedRow(`capacity-${i}`, "Alpha", i * 1000)
    )
    const capacity = await popup.evaluate(async (sample) => {
      const k = "youCoder.timeline.YC_CAPACITY_SAMPLE"
      await chrome.storage.local.set({ [k]: sample })
      const bytes = await chrome.storage.local.getBytesInUse(k)
      await chrome.storage.local.remove(k)
      return {
        records: sample.length,
        bytes,
        quota: chrome.storage.local.QUOTA_BYTES
      }
    }, sample)
    const before = await h.storage(popup, A)
    try {
      await popup.evaluate(async () => {
        const used = await chrome.storage.local.getBytesInUse(null)
        await chrome.storage.local.set({
          __youcoderQuotaProbe: "x".repeat(
            chrome.storage.local.QUOTA_BYTES - used - 512
          )
        })
      })
      const rejected = await one.send(A, {
        type: "start",
        team: "x".repeat(2000),
        action: "Quota",
        start: 0
      })
      assert.equal(rejected.ok, false)
      assert.match(rejected.error, /write failed/)
      assert.deepEqual(await h.storage(popup, A), before)
    } finally {
      await popup.evaluate(() =>
        chrome.storage.local.remove("__youcoderQuotaProbe")
      )
    }
    assert(
      (
        await one.send(A, {
          type: "start",
          team: "Alpha",
          action: "AfterQuota",
          start: 10000
        })
      ).ok
    )
    return capacity
  })
  let buttonSet, snapshot
  await test("Export button-set JSON and read-only whole-storage backup", async () => {
    buttonSet = await exportJson(popup)
    assert.deepEqual(JSON.parse(buttonSet), h.fixture.buttonSets[0])
    snapshot = await popup.evaluate(() => chrome.storage.local.get(null))
    fs.writeFileSync(
      out + "/full-backup-fixture.json",
      JSON.stringify(snapshot, null, 2)
    )
    return {
      exportedSet: JSON.parse(buttonSet).setName,
      timelineKeys: Object.keys(snapshot).filter((k) =>
        k.startsWith("youCoder.timeline.")
      ).length
    }
  })
  await h.cleanup()
  ;({ context, popup } = await h.setup())
  await test("Import settings JSON into fresh profile, cancel overwrite and reject invalid JSON", async () => {
    assert(buttonSet)
    await importJson(popup, buttonSet)
    await until(
      async () =>
        (
          await popup.evaluate(() => chrome.storage.local.get("buttonSets"))
        ).buttonSets?.some((x) => x.setName === "QA"),
      "imported set"
    )
    const before = await popup.evaluate(() => chrome.storage.local.get(null))
    popup.once("dialog", (d) => d.dismiss())
    await importJson(
      popup,
      Buffer.from(JSON.stringify({ ...h.fixture.buttonSets[0], buttons: [] }))
    )
    await h.delay(200)
    assert.deepEqual(
      await popup.evaluate(() => chrome.storage.local.get(null)),
      before
    )
    await importJson(popup, Buffer.from("{not-json"))
    await popup
      .getByText(
        "JSONファイルの解析に失敗しました。ファイル形式を確認してください。"
      )
      .waitFor()
    assert.deepEqual(
      await popup.evaluate(() => chrome.storage.local.get(null)),
      before
    )
    return "UI filechooser import into a new generated browser profile; cancel preserves original"
  })
  await h.cleanup()
  ;({ context, popup } = await h.setup())
  await test("Whole-storage backup restored in a fresh profile preserves IDs and allows continued edits", async () => {
    assert(snapshot)
    const current = await popup.evaluate(() => chrome.storage.local.get(null))
    assert(
      !Object.keys(current).some(
        (k) => k === "timelines" || k.startsWith("youCoder.timeline.")
      )
    )
    const guide = fs.readFileSync(h.root + "/docs/backup-restore.md", "utf8")
    const restoreScript = guide.match(/```js\n(const input[\s\S]+?)\n```/)[1]
    const chooser = popup.waitForEvent("filechooser")
    await popup.evaluate(`(() => {${restoreScript}})()`)
    await (
      await chooser
    ).setFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(snapshot))
    })
    await until(
      async () =>
        (await h.storage(popup, A))?.length === snapshot[key(A)].length,
      "documented restore procedure"
    )
    const beforeRefusedOverwrite = await popup.evaluate(() =>
      chrome.storage.local.get(null)
    )
    const rejection = popup.waitForEvent("console", {
      predicate: (message) =>
        message.text().includes("既存データがあるため中止")
    })
    const secondChooser = popup.waitForEvent("filechooser")
    await popup.evaluate(`(() => {${restoreScript}})()`)
    await (
      await secondChooser
    ).setFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(snapshot))
    })
    await rejection
    assert.deepEqual(
      await popup.evaluate(() => chrome.storage.local.get(null)),
      beforeRefusedOverwrite
    )
    await popup.reload()
    one = await h.synthetic(context, A)
    p = one.page
    assert.deepEqual(await h.storage(popup, A), snapshot[key(A)])
    await h.seek(p, 11)
    // Continue the restored active record through the real worker protocol.
    const active = (await h.storage(popup, A)).find(
      (a) => a.action === "AfterQuota"
    )
    assert(active)
    assert(
      (await one.send(A, { type: "stop", actionId: active.id, end: 11000 })).ok
    )
    assert.equal(
      (await h.storage(popup, A)).find((a) => a.id === active.id).end,
      11000
    )
    await h.nav(p, "YC_CONTINUE_B")
    assert.deepEqual(
      await h.storage(popup, "YC_CONTINUE_B"),
      snapshot[key("YC_CONTINUE_B")]
    )
    return "documented file-picker script in extension context; fresh-profile restore and existing-data refusal; no product restore UI"
  })
  await test("Store screenshot drafts use actual extension UI with explicit synthetic-data caption", async () => {
    await p.setViewportSize({ width: 1280, height: 800 })
    await h.nav(p, A)
    await settledTimeline(p)
    await timeCellBounds(p)
    await p.evaluate(() => {
      const label = document.createElement("p")
      label.textContent =
        "YouCoder — デモデータ / 合成ページ（実YouTubeの動作証拠ではありません）"
      label.style.cssText = "font:16px sans-serif;color:#334155;padding:12px 0"
      document.querySelector("#below").prepend(label)
      document.body.style.paddingBottom = "320px"
      label.scrollIntoView()
    })
    await p.screenshot({ path: out + "/store-timeline-draft-1280x800.png" })
    await popup.setViewportSize({ width: 640, height: 400 })
    await popup.evaluate(() => {
      const caption = document.createElement("p")
      caption.textContent = "YouCoder — 設定画面 / デモデータ"
      caption.style.cssText =
        "font:14px sans-serif;padding:8px 24px;margin:0;color:#334155"
      document.body.prepend(caption)
    })
    await popup.screenshot({
      path: out + "/store-settings-draft-640x400.png",
      scale: "css"
    })
    for (const [name, width, height] of [
      ["store-settings-draft-640x400.png", 640, 400],
      ["store-timeline-draft-1280x800.png", 1280, 800]
    ]) {
      const png = fs.readFileSync(out + "/" + name)
      assert.equal(png.readUInt32BE(16), width)
      assert.equal(png.readUInt32BE(20), height)
    }
    return "1280x800 timeline and 640x400 settings screenshots of actual production UI, generated fixture only; review before publishing"
  })
  await h.cleanup()
  if (results.some((x) => x.status === "FAIL")) process.exitCode = 1
})().catch(async (e) => {
  console.error(e)
  await h.cleanup().catch(console.error)
  process.exitCode = 1
})
