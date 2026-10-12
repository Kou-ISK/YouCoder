// Include the licenses of bundled runtime code, not the entire build toolchain.
const fs = require("node:fs")
const path = require("node:path")
const roots = [
  process.cwd(),
  path.dirname(require.resolve("react-dom/package.json")),
  path.dirname(require.resolve("plasmo/package.json"))
]
const names = ["react", "react-dom", "scheduler", "plasmo"]
const notices = names.map((name) => {
  const packagePath = require.resolve(name + "/package.json", { paths: roots })
  const pkg = JSON.parse(fs.readFileSync(packagePath))
  return `${name} ${pkg.version}\n${fs.readFileSync(path.join(path.dirname(packagePath), "LICENSE"), "utf8")}`
})
// The Parcel bootstrap is also embedded in the generated production JS.
const parcelRoot = fs
  .readdirSync("node_modules/.pnpm")
  .find((name) => name.startsWith("@parcel+runtime-js@2.9.3_"))
if (!parcelRoot)
  throw Error("Parcel runtime license not found in locked installation")
notices.push(
  "@parcel/runtime-js 2.9.3\n" +
    fs.readFileSync(
      path.join(
        "node_modules/.pnpm",
        parcelRoot,
        "node_modules/@parcel/runtime-js/LICENSE"
      ),
      "utf8"
    )
)
fs.writeFileSync(
  "build/chrome-mv3-prod/THIRD_PARTY_NOTICES.txt",
  notices.join("\n\n--------------------\n\n")
)
