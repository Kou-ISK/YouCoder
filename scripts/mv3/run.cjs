// Run serially. Evidence lives outside the checkout and is never uploaded.
const { spawnSync } = require("node:child_process")
const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os")
const requested = process.argv.slice(2),
  allowed = ["reproduce", "layout", "core", "lifecycle", "restart"]
const selected = requested.length
  ? requested
  : ["layout", "core", "lifecycle", "restart"]
if (selected.some((x) => !allowed.includes(x))) {
  console.error(
    "Usage: node scripts/mv3/run.cjs [reproduce|layout|core|lifecycle|restart ...]"
  )
  process.exit(2)
}
const output = fs.mkdtempSync(path.join(os.tmpdir(), "youcoder-mv3-suite-"))
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
  if (result.status !== 0 || result.error) {
    failed = true
    if (result.error) console.error(result.error)
  }
}
process.exitCode = failed ? 1 : 0
