// Run serially. This runner writes local evidence; CI separately retains an allowlist.
const { spawnSync } = require("node:child_process")
const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os")
const requested = process.argv.slice(2),
  allowed = [
    "reproduce",
    "layout",
    "core",
    "lifecycle",
    "restart",
    "experience",
    "live"
  ]
const selected = requested.length
  ? requested
  : ["layout", "core", "lifecycle", "restart", "experience"]
if (selected.some((x) => !allowed.includes(x))) {
  console.error(
    "Usage: node scripts/mv3/run.cjs [reproduce|layout|core|lifecycle|restart|experience|live ...]"
  )
  process.exit(2)
}
const output = process.env.YOUCODER_TEST_OUTPUT
  ? path.resolve(process.env.YOUCODER_TEST_OUTPUT)
  : fs.mkdtempSync(path.join(os.tmpdir(), "youcoder-mv3-suite-"))
fs.mkdirSync(output, { recursive: true, mode: 0o700 })
const results = []
let failed = false
console.log(`Private suite output: ${output}`)
for (const test of selected) {
  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, test + ".cjs")],
    {
      env: { ...process.env, YOUCODER_TEST_OUTPUT: path.join(output, test) },
      stdio: "inherit"
    }
  )
  results.push({
    test,
    exitCode: result.status,
    signal: result.signal,
    error: result.error?.message
  })
  fs.writeFileSync(
    path.join(output, "suite.json"),
    JSON.stringify(results, null, 2)
  )
  if (result.status !== 0 || result.error) {
    failed = true
    if (result.error) console.error(result.error)
  }
}
process.exitCode = failed ? 1 : 0
