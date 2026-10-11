const fs = require("node:fs")
const path = require("node:path")
const os = require("node:os")
const assert = require("node:assert/strict")
const { spawn } = require("node:child_process")
const { A, B, fixture, fixtureHtml } = require("./fixture.cjs")
const root = path.resolve(__dirname, "../..")
const out = process.env.YOUCODER_TEST_OUTPUT
  ? path.resolve(process.env.YOUCODER_TEST_OUTPUT)
  : fs.mkdtempSync(path.join(os.tmpdir(), "youcoder-mv3-evidence-"))
fs.mkdirSync(out, { recursive: true, mode: 0o700 })
const key = (id) => `youCoder.timeline.${id}`
const delay = (ms) => new Promise((r) => setTimeout(r, ms))
let profile, child, browser, context, extensionId
async function until(fn, description, timeout = 10000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const value = await fn()
    if (value) return value
    await delay(100)
  }
  throw Error(`Timed out: ${description}`)
}
async function setup() {
  assert(!child, "Close the previous test browser before restarting")
  const { chromium } = require(
    process.env.YOUCODER_PLAYWRIGHT_MODULE || "playwright"
  )
  const extensionPath = path.resolve(
    process.env.YOUCODER_EXTENSION_DIR ||
      path.join(root, "build/chrome-mv3-prod")
  )
  const manifest = JSON.parse(
    fs.readFileSync(path.join(extensionPath, "manifest.json"))
  )
  assert.equal(manifest.manifest_version, 3)
  assert(manifest.background?.service_worker)
  profile ||= fs.mkdtempSync(path.join(os.tmpdir(), "youcoder-mv3-profile-"))
  const log = fs.openSync(path.join(out, "browser.log"), "a", 0o600)
  // Deliberately use only these flags. Sandbox, TLS checks and site isolation stay on.
  const args = [
    `--user-data-dir=${profile}`,
    "--remote-debugging-port=0",
    "--no-first-run",
    "--no-default-browser-check",
    `--load-extension=${extensionPath}`,
    "--window-size=1440,1000"
  ]
  if (process.env.YOUCODER_HEADED !== "1") args.push("--headless=new")
  args.push("about:blank")
  const executable = process.env.YOUCODER_BROWSER || chromium.executablePath()
  const environment = {
    status: "STARTING",
    extensionPath,
    profile,
    executable,
    args,
    manifest,
    node: process.version,
    platform: process.platform,
    playwright: require(
      path.join(
        process.env.YOUCODER_PLAYWRIGHT_MODULE || "playwright",
        "package.json"
      )
    ).version
  }
  fs.writeFileSync(
    path.join(out, "environment.json"),
    JSON.stringify(environment, null, 2)
  )
  child = spawn(executable, args, { stdio: ["ignore", log, log] })
  fs.closeSync(log)
  let spawnError
  child.on("error", (e) => {
    spawnError = e
  })
  const portFile = path.join(profile, "DevToolsActivePort")
  await until(
    () => {
      if (spawnError) throw spawnError
      if (child.exitCode !== null || child.signalCode !== null)
        throw Error(
          `Browser exited ${child.exitCode ?? child.signalCode}; inspect browser.log. Do not disable sandbox/security to work around this.`
        )
      return fs.existsSync(portFile)
    },
    "browser CDP startup",
    15000
  )
  const port = fs.readFileSync(portFile, "utf8").split("\n")[0]
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`)
  context = browser.contexts()[0]
  context.setDefaultTimeout(10000)
  const probe = await browser.newBrowserCDPSession()
  const target = await until(
    async () => {
      const { targetInfos } = await probe.send("Target.getTargets")
      return targetInfos.find(
        (t) =>
          t.type === "service_worker" &&
          t.url.startsWith("chrome-extension://") &&
          t.url.endsWith("/" + manifest.background.service_worker)
      )
    },
    "MV3 extension worker (use bundled Chromium, not regular branded Chrome)",
    15000
  )
  extensionId = new URL(target.url).host
  await probe.detach()
  fs.writeFileSync(
    path.join(out, "environment.json"),
    JSON.stringify(
      {
        ...environment,
        status: "RUNNING",
        browser: browser.version(),
        extensionId,
        extensionPath,
        profile,
        executable,
        args,
        manifest
      },
      null,
      2
    )
  )
  const popup = await context.newPage()
  await popup.goto(`chrome-extension://${extensionId}/popup.html`)
  console.log(`Private evidence: ${out}`)
  return { browser, context, popup }
}
async function closeCurrent() {
  if (browser) {
    try {
      const cdp = await browser.newBrowserCDPSession()
      await cdp.send("Browser.close")
    } catch (e) {
      if (!/closed|Target|disconnect/i.test(e.message)) console.error(e.message)
    }
    await browser.close().catch(() => {})
    browser = null
  }
  if (child) {
    const current = child
    if (current.exitCode === null && current.signalCode === null)
      current.kill("SIGTERM")
    await until(
      () => current.exitCode !== null || current.signalCode !== null,
      "owned browser process exit",
      5000
    )
    child = null
  }
  if (profile)
    fs.rmSync(path.join(profile, "DevToolsActivePort"), { force: true })
}
async function cleanup() {
  await closeCurrent()
  if (profile) {
    fs.rmSync(profile, { recursive: true, force: true })
    profile = null
  }
}
async function synthetic(context, id, options = {}) {
  const page = await context.newPage()
  await page.setViewportSize({ width: 1440, height: 1000 })
  // Only this tab is routed. No live YouTube requests or videos are fetched.
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url())
    if (
      url.origin === "https://www.youtube.com" &&
      url.pathname === "/watch" &&
      route.request().isNavigationRequest()
    )
      return route.fulfill({ contentType: "text/html", body: fixtureHtml() })
    return route.abort()
  })
  if (!options.defaultLayout)
    await page.addInitScript(() => {
      localStorage.setItem(
        "taggingPanel_position",
        JSON.stringify({ x: 900, y: 30 })
      )
      localStorage.setItem(
        "taggingPanel_size",
        JSON.stringify({ width: 460, height: 470 })
      )
      localStorage.setItem(
        "timelinePanel_position",
        JSON.stringify({ x: 10, y: 510 })
      )
      localStorage.setItem(
        "timelinePanel_size",
        JSON.stringify({ width: 1360, height: 360 })
      )
    })
  const response = await page.goto("https://www.youtube.com/watch?v=" + id)
  assert.equal(response.status(), 200)
  assert.equal(response.fromServiceWorker(), false)
  assert.equal(await page.title(), "YouCoder synthetic fixture")
  await page.waitForFunction(
    () => document.querySelector("video")?.readyState >= 2,
    null,
    { polling: 100, timeout: 15000 }
  )
  await page.getByRole("button", { name: "CSV出力" }).waitFor()
  const cdp = await context.newCDPSession(page),
    worlds = new Map()
  cdp.on("Runtime.executionContextCreated", (e) =>
    worlds.set(e.context.id, e.context)
  )
  cdp.on("Runtime.executionContextDestroyed", (e) =>
    worlds.delete(e.executionContextId)
  )
  cdp.on("Runtime.executionContextsCleared", () => worlds.clear())
  await cdp.send("Runtime.enable")
  const evaluate = async (expression) => {
    const world = await until(
      () =>
        [...worlds.values()].find(
          (c) =>
            c.name === extensionId ||
            c.origin === `chrome-extension://${extensionId}`
        ),
      "extension isolated world"
    )
    const r = await cdp.send("Runtime.evaluate", {
      expression,
      contextId: world.id,
      awaitPromise: true,
      returnByValue: true
    })
    if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails))
    return r.result.value
  }
  const send = (videoId, operation) =>
    evaluate(
      `chrome.runtime.sendMessage(${JSON.stringify({ type: "YOUCODER_TIMELINE", videoId, operation })})`
    )
  return { page, cdp, evaluate, send }
}
async function storage(popup, id) {
  return popup.evaluate(
    async (k) => (await chrome.storage.local.get(k))[k],
    key(id)
  )
}
async function seek(page, t) {
  await page.locator("video").evaluate((v, t) => {
    v.pause()
    v.currentTime = t
  }, t)
  await page.waitForFunction(
    (t) => Math.abs(document.querySelector("video").currentTime - t) < 0.01,
    t,
    { polling: 100 }
  )
}
async function nav(page, id) {
  await page.evaluate((id) => {
    history.pushState({}, "", "/watch?v=" + id)
    document.dispatchEvent(new Event("yt-navigate-finish"))
  }, id)
  await delay(250)
}
process.on("exit", () => {
  if (child && child.exitCode === null) child.kill("SIGTERM")
})
module.exports = {
  fs,
  assert,
  root,
  out,
  A,
  B,
  key,
  delay,
  until,
  setup,
  synthetic,
  storage,
  seek,
  nav,
  fixture,
  cleanup,
  closeCurrent,
  get extensionId() {
    return extensionId
  }
}
