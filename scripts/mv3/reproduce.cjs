const h = require("./harness.cjs")
const { assert, fs, out } = h
;(async () => {
  const expected = process.env.YOUCODER_EXPECT
  assert(
    ["baseline", "fixed"].includes(expected),
    "Set YOUCODER_EXPECT=baseline or fixed"
  )
  const { context, popup } = await h.setup()
  await popup.evaluate((data) => chrome.storage.local.set(data), h.fixture)
  const { page } = await h.synthetic(context, h.A)
  await page.setViewportSize({ width: 1440, height: 730 })
  await h.delay(300)
  const observed = await page.evaluate(() => {
    const host = document.querySelector("plasmo-csui"),
      shadow = host.shadowRoot,
      video = document.querySelector("video").getBoundingClientRect()
    const panels = [...shadow.querySelectorAll("div")]
      .filter(
        (e) =>
          (getComputedStyle(e).position === "fixed" && e.offsetWidth > 250) ||
          e.hasAttribute("data-youcoder-panel")
      )
      .map((e) => ({
        name: e.getAttribute("data-youcoder-panel"),
        rect: e.getBoundingClientRect().toJSON()
      }))
    const point = { x: video.left + video.width / 2, y: video.bottom - 20 }
    const hit = document.elementFromPoint(point.x, point.y)
    return {
      viewport: { width: innerWidth, height: innerHeight },
      anchor: host.parentElement.id,
      panels,
      point,
      hit: hit?.tagName,
      covered: hit === host,
      overflow: panels.some((p) => p.rect.right > innerWidth),
      video: video.toJSON()
    }
  })
  fs.writeFileSync(
    out + "/reproduce.json",
    JSON.stringify({ expected, observed }, null, 2)
  )
  await page.screenshot({ path: out + "/reproduce.png", fullPage: true })
  if (expected === "baseline") {
    assert(
      observed.covered,
      "Old timeline should obstruct native video controls"
    )
    assert(observed.overflow, "Old tagging panel should extend beyond viewport")
    assert(
      !observed.panels.some(
        (p) => Math.abs(p.rect.x - 900) < 1 && Math.abs(p.rect.width - 460) < 1
      ),
      "Old component should fail to apply saved legacy geometry"
    )
  } else {
    assert.equal(observed.covered, false)
    assert.equal(observed.overflow, false)
    assert.equal(observed.anchor, "below")
    assert.equal(observed.panels.length, 2)
    for (const p of observed.panels)
      assert(
        p.rect.top >= observed.video.bottom,
        "Panel must stay below player"
      )
  }
  console.log(`PASS: ${expected} expectations`)
  await h.cleanup()
})().catch(async (e) => {
  console.error(e)
  await h.cleanup().catch(console.error)
  process.exitCode = 1
})
