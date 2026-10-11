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
    out + "/layout-results.json",
    JSON.stringify(results, null, 2)
  )
  console.log(results.at(-1))
}
async function until(fn) {
  for (let i = 0; i < 100; i++) {
    if (await fn()) return
    await delay(50)
  }
  throw Error("condition timeout")
}
const rect = async (p) =>
  p.locator('[data-youcoder-panel="タグ付け"]').evaluate((e) => ({
    x: e.offsetLeft,
    y: e.offsetTop,
    width: e.offsetWidth,
    height: e.offsetHeight
  }))
;(async () => {
  const { browser, context, popup } = await h.setup()
  await popup.evaluate(async (data) => {
    await chrome.storage.local.clear()
    await chrome.storage.local.set(data)
  }, h.fixture)
  const one = await h.synthetic(context, h.A)
  const p = one.page
  await p.setViewportSize({ width: 1440, height: 1000 })
  await test("Bounded panels below player and native controls unobstructed", async () => {
    const g = await p.evaluate(() => {
      const host = document.querySelector("plasmo-csui"),
        v = document.querySelector("video"),
        b = host.getBoundingClientRect(),
        r = v.getBoundingClientRect()
      return {
        hostY: b.y,
        videoBottom: r.bottom,
        anchor: host.parentElement.id,
        hit: document.elementFromPoint(r.x + r.width / 2, r.bottom - 15).tagName
      }
    })
    assert.equal(g.anchor, "below")
    assert(g.hostY >= g.videoBottom)
    assert.equal(g.hit, "VIDEO")
    return g
  })
  await test("Synthetic native fullscreen excludes panels and exit restores geometry", async () => {
    const before = await rect(p)
    await p.evaluate(() => {
      const button = document.createElement("button")
      button.id = "fixture-fullscreen"
      button.textContent = "Fixture fullscreen"
      button.style.cssText = "position:absolute;top:0;left:0"
      button.onclick = () => document.querySelector("video").requestFullscreen()
      document.body.append(button)
    })
    try {
      await p.locator("#fixture-fullscreen").click()
      await p.waitForFunction(
        () => document.fullscreenElement?.tagName === "VIDEO"
      )
      assert.equal(
        await p.evaluate(() =>
          document.fullscreenElement.contains(
            document.querySelector("plasmo-csui")
          )
        ),
        false
      )
      await p.screenshot({ path: out + "/synthetic-fullscreen.png" })
      await p.evaluate(() => document.exitFullscreen())
      await p.waitForFunction(() => !document.fullscreenElement)
      assert.deepEqual(await rect(p), before)
      return "Native video Fullscreen API via fixture pointer click; not real YouTube controls"
    } finally {
      await p.evaluate(async () => {
        if (document.fullscreenElement) await document.exitFullscreen()
        document.querySelector("#fixture-fullscreen")?.remove()
        scrollTo(0, 0)
      })
    }
  })
  await test("Actual pointer resize / move constrained to workspace", async () => {
    const resize = p.getByRole("button", { name: "タグ付けのサイズを変更" })
    await resize.scrollIntoViewIfNeeded()
    let b = await resize.boundingBox()
    await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
    await p.mouse.down()
    await p.mouse.move(b.x + 70, b.y - 65, { steps: 5 })
    await p.mouse.up()
    let r = await rect(p)
    assert(r.width > 380)
    assert(r.height < 420)
    const move = p.getByRole("button", { name: "タグ付けを移動" })
    b = await move.boundingBox()
    await p.mouse.move(b.x + 40, b.y + 15)
    await p.mouse.down()
    await p.mouse.move(b.x + 70, b.y + 45, { steps: 5 })
    await p.mouse.up()
    r = await rect(p)
    assert.equal(r.x, 30)
    assert.equal(r.y, 30)
    const saved = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("youCoder.panelLayout.v2"))
    )
    assert.equal(saved.wide.taggingPanel.position.x, 30)
    return r
  })
  const preference = await rect(p)
  await test("Viewport widths 900 / 375 / 320 and return preserve wide layout", async () => {
    const sizes = []
    for (const width of [900, 375, 320, 1440]) {
      await p.setViewportSize({ width, height: 1000 })
      await delay(150)
      const g = await p.locator("[data-youcoder-workspace]").evaluate((e) => {
        const b = e.getBoundingClientRect()
        return {
          bounds: b.toJSON(),
          panels: [...e.querySelectorAll("[data-youcoder-panel]")].map((p) =>
            p.getBoundingClientRect().toJSON()
          ),
          docWidth: document.documentElement.scrollWidth,
          windowWidth: innerWidth
        }
      })
      for (const r of g.panels) {
        assert(r.left >= g.bounds.left - 1)
        assert(r.right <= g.bounds.right + 1)
        assert(r.top >= g.bounds.top - 1)
        assert(r.bottom <= g.bounds.bottom + 1)
      }
      assert(g.docWidth <= g.windowWidth)
      sizes.push({ width, panels: g.panels })
      if (width === 375)
        await p.screenshot({ path: out + "/narrow-375.png", fullPage: true })
    }
    assert.deepEqual(await rect(p), preference)
    return sizes
  })
  await test("A → B → A and anchor remount restore panel geometry", async () => {
    await h.nav(p, h.B)
    assert.deepEqual(await rect(p), preference)
    await h.nav(p, h.A)
    assert.deepEqual(await rect(p), preference)
    await p.evaluate(() => {
      const old = document.querySelector("#below")
      const fresh = document.createElement("div")
      fresh.id = "below"
      old.replaceWith(fresh)
    })
    await p.getByRole("button", { name: "CSV出力" }).waitFor()
    assert.deepEqual(await rect(p), preference)
    return preference
  })
  await test("Full page reload restores saved geometry", async () => {
    await p.reload()
    await p.getByRole("button", { name: "CSV出力" }).waitFor()
    assert.deepEqual(await rect(p), preference)
    return preference
  })
  await test("Rapid UI clicks produce one pending operation and recover after storage failure", async () => {
    await p.getByRole("button", { name: "配置をリセット" }).click()
    console.log(
      "Before reload-media readiness",
      await p.locator("video").evaluate((v) => ({
        readyState: v.readyState,
        seeking: v.seeking,
        time: v.currentTime
      }))
    )
    await h.seek(p, 12)
    const worker = context
      .serviceWorkers()
      .find((w) => w.url().includes(h.extensionId))
    assert(worker)
    const receiverProbe = await worker.evaluate(async () => {
      const unbound = chrome.storage.local.set
      try {
        await unbound({})
        return { unbound: "accepted" }
      } catch (e) {
        return { unbound: "rejected", error: e.message }
      }
    })
    console.log("Chrome storage receiver probe", receiverProbe)
    await worker.evaluate(() => {
      globalThis.__savedSet = chrome.storage.local.set
      globalThis.__delayedWrites = 0
      chrome.storage.local.set = async (...args) => {
        globalThis.__delayedWrites++
        await new Promise((r) => setTimeout(r, 400))
        // Native StorageArea methods require their original receiver.
        return Reflect.apply(globalThis.__savedSet, chrome.storage.local, args)
      }
    })
    try {
      // A reload can expose the buttons before the initial worker read completes.
      // Trial click waits for the real disabled fieldset to become actionable.
      await p
        .getByRole("button", { name: /^AlphaチームのPassアクション/ })
        .click({ trial: true })
      await p
        .getByRole("button", { name: /^AlphaチームのPassアクション/ })
        .evaluate((b) => {
          for (let i = 0; i < 20; i++) b.click()
        })
      await until(async () => (await h.storage(popup, h.A))?.length === 1)
      const a = await h.storage(popup, h.A)
      assert.equal(a[0].end, undefined)
      assert.equal(await worker.evaluate(() => globalThis.__delayedWrites), 1)
    } catch (e) {
      const diagnostic = {
        storage: await h.storage(popup, h.A),
        alerts: await p.getByRole("alert").allTextContents(),
        media: await p.locator("video").evaluate((v) => ({
          readyState: v.readyState,
          seeking: v.seeking,
          time: v.currentTime,
          error: v.error?.message
        })),
        url: p.url()
      }
      fs.writeFileSync(
        out + "/rapid-diagnostic.json",
        JSON.stringify(diagnostic, null, 2)
      )
      console.log(JSON.stringify(diagnostic))
      throw e
    } finally {
      await worker.evaluate(() => {
        chrome.storage.local.set = globalThis.__savedSet
        delete globalThis.__savedSet
        delete globalThis.__delayedWrites
      })
    }
    const before = await h.storage(popup, h.A)
    await worker.evaluate(() => {
      globalThis.__savedSet = chrome.storage.local.set
      chrome.storage.local.set = async () => {
        throw Error("private synthetic failure")
      }
    })
    try {
      await p
        .getByRole("button", { name: /^AlphaチームのPassアクション/ })
        .click()
      await p.getByRole("alert").waitFor()
      assert.deepEqual(await h.storage(popup, h.A), before)
      await p.screenshot({ path: out + "/failure.png" })
    } finally {
      await worker.evaluate(() => {
        chrome.storage.local.set = globalThis.__savedSet
        delete globalThis.__savedSet
      })
    }
    await p
      .getByRole("button", { name: /^AlphaチームのPassアクション/ })
      .click()
    await until(async () => (await h.storage(popup, h.A))[0].end === 12000)
    assert.equal(await p.getByRole("alert").count(), 0)
    return "20 synchronous clicks: one interval; failed stop preserves it; retry completes"
  })
  await test("Collapse / reset remain accessible", async () => {
    await p.getByRole("button", { name: "パネルを折りたたむ" }).click()
    assert.equal(
      await p
        .locator("[data-youcoder-workspace]")
        .evaluate((e) => e.offsetHeight),
      0
    )
    await p.getByRole("button", { name: "配置をリセット" }).click()
    await p.getByRole("button", { name: "パネルを開く" }).click()
    assert.equal((await rect(p)).x, 0)
    return "header accessible with panels hidden"
  })
  await p.screenshot({ path: out + "/wide.png", fullPage: true })
  await h.cleanup()
  if (results.some((x) => x.status === "FAIL")) process.exitCode = 1
})().catch(async (e) => {
  console.error(e)
  await h.cleanup().catch(console.error)
  process.exitCode = 1
})
