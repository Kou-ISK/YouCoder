// Test an actual permission reduction using an owned temporary extension copy.
// The previous build already declared unlimitedStorage; no permission is granted
// to a user profile and no installed extension is changed.
const h = require("./harness.cjs")
const path = require("node:path"),
  os = require("node:os")
const { fs, assert, out, key } = h
;(async () => {
  const previous = process.env.YOUCODER_PREVIOUS_EXTENSION_DIR
  assert(
    previous,
    "Set YOUCODER_PREVIOUS_EXTENSION_DIR to the built historical baseline"
  )
  const current = path.resolve(
    process.env.YOUCODER_EXTENSION_DIR ||
      path.join(h.root, "build/chrome-mv3-prod")
  )
  const ownedCopy = fs.mkdtempSync(
    path.join(os.tmpdir(), "youcoder-capacity-extension-")
  )
  const originalOverride = process.env.YOUCODER_EXTENSION_DIR
  try {
    fs.cpSync(previous, ownedCopy, { recursive: true })
    process.env.YOUCODER_EXTENSION_DIR = ownedCopy
    let { context, popup } = await h.setup()
    const oldId = h.extensionId
    const olderManifest = await popup.evaluate(() =>
      chrome.runtime.getManifest()
    )
    assert(olderManifest.permissions.includes("unlimitedStorage"))
    const initial = {
      id: "capacity-sentinel",
      team: "Alpha",
      action: "Pass",
      start: 0,
      labels: []
    }
    const oldBytes = await popup.evaluate(
      async ({ fixture, initial }) => {
        const large = Array.from({ length: 100000 }, (_, i) => ({
          id: `old-${i}`,
          team: "Archive",
          action: "Pass",
          start: i * 1000,
          end: i * 1000 + 2000,
          labels: ["Result - 成功"]
        }))
        await chrome.storage.local.set({
          ...fixture,
          "youCoder.timeline.YC_TEST_A01": [initial],
          "youCoder.timeline.YC_OLD_LARGE": large
        })
        return chrome.storage.local.getBytesInUse(null)
      },
      { fixture: h.fixture, initial }
    )
    assert(oldBytes > 10485760)
    await h.closeCurrent()
    fs.rmSync(ownedCopy, { recursive: true, force: true })
    fs.cpSync(current, ownedCopy, { recursive: true })
    ;({ context, popup } = await h.setup())
    assert.equal(
      h.extensionId,
      oldId,
      "same unpacked path preserves extension identity"
    )
    assert.deepEqual(
      await popup.evaluate(() => chrome.runtime.getManifest().permissions),
      ["storage"]
    )
    const preserved = await popup.evaluate(async () => {
      const data = await chrome.storage.local.get([
        "youCoder.timeline.YC_OLD_LARGE",
        "youCoder.timeline.YC_TEST_A01"
      ])
      const rows = data["youCoder.timeline.YC_OLD_LARGE"]
      return {
        count: rows.length,
        first: rows[0].id,
        last: rows.at(-1).id,
        sentinel: data["youCoder.timeline.YC_TEST_A01"],
        bytes: await chrome.storage.local.getBytesInUse(null)
      }
    })
    assert.equal(preserved.count, 100000)
    assert.equal(preserved.first, "old-0")
    assert.equal(preserved.last, "old-99999")
    assert.deepEqual(preserved.sentinel, [initial])
    const one = await h.synthetic(context, h.A)
    const rejected = await one.send(h.A, {
      type: "stop",
      actionId: initial.id,
      end: 1000
    })
    assert.equal(rejected.ok, false)
    assert.match(rejected.error, /write failed/)
    assert.deepEqual(await h.storage(popup, h.A), [initial])
    // Read-only whole-storage backup remains available even above the quota.
    const backupCount = await popup.evaluate(
      async () =>
        (await chrome.storage.local.get(null))["youCoder.timeline.YC_OLD_LARGE"]
          .length
    )
    assert.equal(backupCount, 100000)
    // Only generated fixture data is removed to establish the recovery path.
    await popup.evaluate(() =>
      chrome.storage.local.remove("youCoder.timeline.YC_OLD_LARGE")
    )
    assert(
      (await one.send(h.A, { type: "stop", actionId: initial.id, end: 1000 }))
        .ok
    )
    const result = {
      name: "Existing >10MB profile after permission reduction",
      status: "PASS",
      oldBytes,
      preserved,
      backupCount,
      writesWhileOverQuota: "rejected without data replacement",
      recovery: "writes resume after generated archive removal",
      limitation:
        "Users above 10MB must back up and reduce data before continuing edits; no automatic deletion"
    }
    fs.writeFileSync(
      out + "/capacity-migration-results.json",
      JSON.stringify(result, null, 2)
    )
    console.log(JSON.stringify(result))
  } finally {
    await h.cleanup()
    fs.rmSync(ownedCopy, { recursive: true, force: true })
    if (originalOverride === undefined)
      delete process.env.YOUCODER_EXTENSION_DIR
    else process.env.YOUCODER_EXTENSION_DIR = originalOverride
  }
})().catch(async (e) => {
  console.error(e)
  await h.cleanup().catch(console.error)
  process.exitCode = 1
})
