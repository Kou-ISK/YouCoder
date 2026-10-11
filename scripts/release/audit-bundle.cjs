// Static inventory for review; this does not prove absence of every network flow.
const assert = require("node:assert/strict")
const crypto = require("node:crypto")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")

const root = path.resolve(process.argv[2] || "build/chrome-mv3-prod")
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json")))
assert.equal(manifest.manifest_version, 3)
assert.deepEqual([...manifest.permissions].sort(), [
  "storage",
  "unlimitedStorage"
])
assert.deepEqual(manifest.host_permissions, ["https://www.youtube.com/*"])
assert.deepEqual(
  manifest.content_scripts.map((item) => item.matches),
  [["https://www.youtube.com/*"]]
)
assert.equal(
  manifest.content_security_policy.extension_pages,
  "script-src 'self'; object-src 'self';"
)
assert.equal(manifest.optional_permissions, undefined)
assert.equal(manifest.optional_host_permissions, undefined)

const files = []
const visit = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      visit(fullPath)
      continue
    }
    const bytes = fs.readFileSync(fullPath)
    const name = path.relative(root, fullPath).split(path.sep).join("/")
    const item = {
      file: name,
      bytes: bytes.length,
      sha256: crypto.createHash("sha256").update(bytes).digest("hex")
    }
    if (/\.(js|html|css)$/.test(name)) {
      const text = bytes.toString("utf8")
      // These markers were present in the removed prototype, never its bundle.
      assert.doesNotMatch(
        text,
        /apis\.google\.com\/js\/api|sheets\.googleapis\.com|googleapis\.com\/auth\/spreadsheets|YOUR_API_KEY|YOUR_CLIENT_ID|gapi\.client/
      )
      item.sheetsPrototypeMarkers = false
      if (name.endsWith(".js")) {
        const ast = ts.createSourceFile(
          name,
          text,
          ts.ScriptTarget.Latest,
          true
        )
        const urls = new Set()
        const networkNames = new Set()
        const scan = (node) => {
          if (
            ts.isStringLiteralLike(node) &&
            /^(https?:|wss?:|\/\/)/.test(node.text)
          )
            urls.add(node.text)
          if (
            ts.isIdentifier(node) &&
            /^(fetch|XMLHttpRequest|WebSocket|sendBeacon|importScripts)$/.test(
              node.text
            )
          )
            networkNames.add(node.text)
          ts.forEachChild(node, scan)
        }
        scan(ast)
        item.urlLiterals = [...urls].sort()
        item.networkApiIdentifiers = [...networkNames].sort()
      }
    }
    files.push(item)
  }
}
visit(root)
process.stdout.write(
  JSON.stringify(
    {
      scope:
        "Static production file inventory and targeted marker checks; not a runtime network audit",
      manifest,
      files: files.sort((a, b) => a.file.localeCompare(b.file))
    },
    null,
    2
  ) + "\n"
)
