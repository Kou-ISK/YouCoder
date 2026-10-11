// Fast browser-free check of the generated fixture and portable harness files.
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  { spawnSync } = require("node:child_process")
const { fixtureHtml, fixture, A, B } = require("./fixture.cjs")
const html = fixtureHtml()
assert.notEqual(A, B)
assert.equal(fixture.teams.length, 2)
assert(html.includes('<div id="below">'))
assert(!html.includes("<script"))
assert(!html.includes('src="https:'))
const encoded = html.match(/data:audio\/wav;base64,([A-Za-z0-9+/=]+)/)[1]
const wav = Buffer.from(encoded, "base64")
assert.equal(wav.toString("ascii", 0, 4), "RIFF")
assert.equal(wav.readUInt32LE(4), wav.length - 8)
assert.equal(wav.readUInt32LE(40), 8000 * 120)
assert(wav.subarray(44).every((n) => n === 128))
for (const file of fs
  .readdirSync(__dirname)
  .filter((f) => f.endsWith(".cjs"))) {
  const source = fs.readFileSync(path.join(__dirname, file), "utf8")
  assert(!source.includes(path.join("/", "Users", "/")))
  const checked = spawnSync(
    process.execPath,
    ["--check", path.join(__dirname, file)],
    { encoding: "utf8" }
  )
  assert.equal(checked.status, 0, checked.stderr)
}
console.log(
  "PASS: generated silent WAV, synthetic-only fixture, portable paths, all script syntax"
)
