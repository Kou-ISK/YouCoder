// Public-site observation in a separate empty profile. No routes, account,
// permission grants, request recording, ad interactions or downloaded media.
const h = require("./harness.cjs")
const { assert, fs, out } = h
const names = [
  "public playback",
  "native controls",
  "fullscreen enter/exit",
  "theater enter/exit",
  "captions",
  "small viewport",
  "real SPA and return",
  "advertisement"
]
const results = []
const record = (name, status, detail) => {
  results.push({ name, status, detail })
  fs.writeFileSync(out + "/live-results.json", JSON.stringify(results, null, 2))
  console.log({ name, status, detail })
}
const skip = (reason) => {
  for (const name of names)
    if (!results.some((r) => r.name === name)) record(name, "NOT RUN", reason)
}
async function test(name, fn) {
  try {
    record(name, "PASS", await fn())
  } catch (e) {
    record(name, "FAIL", e.message)
  }
}
async function geometry(page) {
  return page.evaluate(() => {
    const host = document.querySelector("plasmo-csui")
    const player = document.querySelector("#movie_player")
    const workspace = host?.shadowRoot?.querySelector(
      "[data-youcoder-workspace]"
    )
    return {
      viewport: { width: innerWidth, height: innerHeight },
      anchor: host?.parentElement.id,
      player: player?.getBoundingClientRect().toJSON(),
      workspace: workspace?.getBoundingClientRect().toJSON(),
      panels: [
        ...(host?.shadowRoot?.querySelectorAll("[data-youcoder-panel]") || [])
      ].map((e) => e.getBoundingClientRect().toJSON())
    }
  })
}
function bounded(g) {
  assert(
    g.player?.width > 0 && g.player?.height > 0,
    "Visible nonzero player geometry required"
  )
  assert.equal(g.anchor, "below")
  assert.equal(g.panels.length, 2)
  assert(g.workspace.top >= g.player.bottom - 1)
  for (const p of g.panels) {
    assert(p.left >= g.workspace.left - 1 && p.right <= g.workspace.right + 1)
    assert(p.top >= g.workspace.top - 1 && p.bottom <= g.workspace.bottom + 1)
  }
}
async function reachable(page, selector) {
  const control = page.locator(selector).first()
  assert(await control.isVisible(), `${selector} visible`)
  const observation = await control.evaluate((e) => {
    const r = e.getBoundingClientRect()
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
    return {
      rect: r.toJSON(),
      hit: hit?.tagName,
      reachable: e === hit || e.contains(hit)
    }
  })
  assert(observation.reachable, `${selector} pointer point is reachable`)
  return observation
}
;(async () => {
  const { context, popup } = await h.setup()
  await popup.evaluate((data) => chrome.storage.local.set(data), h.fixture)
  const page = await context.newPage()
  await page.setViewportSize({ width: 1440, height: 1000 })
  let response
  try {
    response = await page.goto("https://www.youtube.com/watch?v=jNQXAC9IVRw", {
      waitUntil: "domcontentloaded",
      timeout: 30000
    })
  } catch (e) {
    record("public page access", "BLOCKED", e.message)
    skip("Public YouTube navigation did not complete")
    await page.screenshot({ path: out + "/public-access.png" }).catch(() => {})
    return
  }
  await page
    .waitForFunction(
      () =>
        document.querySelector("video")?.readyState >= 2 ||
        /confirm you.re not a bot|unusual traffic|video unavailable/i.test(
          document.body.innerText
        ),
      null,
      { timeout: 15000 }
    )
    .catch(() => {})
  await page.screenshot({ path: out + "/public-initial.png" })
  const access = await page.evaluate(() => ({
    title: document.title,
    publicText: document.body.innerText.slice(0, 180),
    playerRect: document
      .querySelector("#movie_player")
      ?.getBoundingClientRect()
      .toJSON(),
    player: !!document.querySelector("#movie_player"),
    readyState: document.querySelector("video")?.readyState,
    playerError: document
      .querySelector(".ytp-error-content-wrap")
      ?.innerText?.slice(0, 500),
    consent: location.hostname.includes("consent."),
    url: location.origin + location.pathname
  }))
  record("public page access", response?.status() >= 400 ? "BLOCKED" : "PASS", {
    status: response?.status(),
    ...access
  })
  if (response?.status() >= 400 || access.consent || !access.player) {
    skip(
      "Public player unavailable; no login, consent or network restriction bypass attempted"
    )
    return
  }
  if (!(await page.locator("#movie_player").isVisible())) {
    record(
      "public playback",
      "BLOCKED",
      "Public player is not visible: " + access.publicText
    )
    skip(
      "Public player unavailable; native controls, full screen and SPA cannot be assessed"
    )
    return
  }
  if (!(await page.locator("[data-youcoder-workspace]").count())) {
    record(
      "native controls",
      "FAIL",
      "Extension workspace absent on this watch page"
    )
    skip("Extension workspace absent")
    return
  }
  const ad = page.locator("#movie_player.ad-showing")
  const hasAd = await ad.count()
  if (hasAd) {
    await test("advertisement", async () => {
      const g = await geometry(page)
      bounded(g)
      const r = g.player
      const hit = await page.evaluate((r) => {
        const e = document.elementFromPoint(
          r.x + r.width / 2,
          r.y + r.height / 2
        )
        return !!e?.closest("#movie_player")
      }, r)
      assert(hit)
      return { activeAd: true, geometry: g, playerCenterReachable: hit }
    })
    skip("An advertisement is showing; no player/ad interaction performed")
    return
  }
  record("advertisement", "NOT RUN", "No active advertisement observed")
  const video = page.locator("#movie_player video").first()
  if (access.playerError || access.readyState < 2) {
    record(
      "public playback",
      "BLOCKED",
      access.playerError || "Public media not ready"
    )
  } else {
    await test("public playback", async () => {
      await video.evaluate((v) => {
        v.muted = true
      })
      if (await video.evaluate((v) => v.paused))
        await page.locator(".ytp-play-button").click()
      const before = await video.evaluate((v) => v.currentTime)
      await h.delay(1000)
      const after = await video.evaluate((v) => {
        const t = v.currentTime
        v.pause()
        return t
      })
      assert(after > before)
      return { before, after }
    })
  }
  await test("native controls", async () => {
    await page.locator("#movie_player").hover()
    const g = await geometry(page)
    bounded(g)
    return {
      geometry: g,
      play: await reachable(page, ".ytp-play-button"),
      fullscreen: await reachable(page, ".ytp-fullscreen-button")
    }
  })
  await test("fullscreen enter/exit", async () => {
    await page.locator(".ytp-fullscreen-button").click()
    await page.waitForFunction(() => !!document.fullscreenElement)
    const entered = await page.evaluate(() => ({
      element: document.fullscreenElement.id,
      extensionInside: !!document.fullscreenElement.querySelector("plasmo-csui")
    }))
    assert.equal(entered.extensionInside, false)
    await page.screenshot({ path: out + "/public-fullscreen.png" })
    await page.locator(".ytp-fullscreen-button").click()
    await page.waitForFunction(() => !document.fullscreenElement)
    await h.delay(500)
    bounded(await geometry(page))
    return entered
  })
  // Restore fullscreen after a failed assertion before the remaining independent observations.
  await page.evaluate(async () => {
    if (document.fullscreenElement) await document.exitFullscreen()
  })
  await test("theater enter/exit", async () => {
    const before = await page
      .locator("ytd-watch-flexy")
      .evaluate((e) => e.hasAttribute("theater"))
    await page.locator(".ytp-size-button").click()
    await page.waitForFunction(
      (before) =>
        document.querySelector("ytd-watch-flexy").hasAttribute("theater") !==
        before,
      before
    )
    await h.delay(500)
    const expanded = await geometry(page)
    bounded(expanded)
    await page.locator(".ytp-size-button").click()
    await h.delay(500)
    bounded(await geometry(page))
    return expanded
  })
  const captions = page.locator(".ytp-subtitles-button")
  if (
    (await captions.isVisible()) &&
    (await captions.getAttribute("aria-disabled")) !== "true"
  ) {
    await test("caption control", async () => {
      await page.locator("#movie_player").hover()
      const control = await reachable(page, ".ytp-subtitles-button")
      if ((await captions.getAttribute("aria-pressed")) !== "true")
        await captions.click()
      assert.equal(await captions.getAttribute("aria-pressed"), "true")
      // This proves only control reachability and enabled state, not visible caption rendering.
      bounded(await geometry(page))
      return { control, enabled: true, visibleCaptionCompatibility: "NOT RUN" }
    })
    record(
      "captions",
      "NOT RUN",
      "Caption control tested; rendered caption track not observed"
    )
  } else record("captions", "NOT RUN", "No available caption control observed")
  await test("small viewport", async () => {
    const observations = []
    for (const width of [900, 375, 320, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      await h.delay(500)
      const g = await geometry(page)
      bounded(g)
      observations.push(g)
      if (width === 375)
        await page.screenshot({ path: out + "/public-375.png", fullPage: true })
    }
    return observations
  })
  const link = page
    .locator('ytd-compact-video-renderer a#thumbnail[href^="/watch?v="]')
    .first()
  if (await link.count()) {
    await test("real SPA and return", async () => {
      const original = page.url()
      const token = await page.evaluate(() => {
        window.__youcoderDocument = crypto.randomUUID()
        return window.__youcoderDocument
      })
      await link.click()
      await page.waitForURL((url) => url.href !== original, { timeout: 15000 })
      await h.delay(1200)
      assert.equal(await page.evaluate(() => window.__youcoderDocument), token)
      await video
        .evaluate((v) => {
          v.pause()
        })
        .catch(() => {})
      const after = await geometry(page)
      bounded(after)
      await page.goBack({ waitUntil: "domcontentloaded" })
      await h.delay(1200)
      assert.equal(await page.evaluate(() => window.__youcoderDocument), token)
      bounded(await geometry(page))
      return { documentPreserved: true, geometry: after }
    })
  } else
    record(
      "real SPA and return",
      "NOT RUN",
      "No ordinary related-video link observed"
    )
  await page.screenshot({ path: out + "/public-final.png", fullPage: true })
})()
  .catch((e) => {
    record("harness", "BLOCKED", e.message)
    skip("Browser/runtime startup or page operation failed")
  })
  .finally(async () => {
    await h.cleanup().catch(console.error)
    if (results.some((r) => r.status === "FAIL")) process.exitCode = 1
  })
