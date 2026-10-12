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
const parcelRoots = fs
  .readdirSync("node_modules/.pnpm")
  .filter((name) => name.startsWith("@parcel+runtime-js@"))
  .sort()
if (!parcelRoots.length)
  throw Error("Parcel runtime license not found in locked installation")
for (const parcelRoot of parcelRoots) {
  const directory = path.join(
    "node_modules/.pnpm",
    parcelRoot,
    "node_modules/@parcel/runtime-js"
  )
  const pkg = JSON.parse(fs.readFileSync(path.join(directory, "package.json")))
  notices.push(
    `@parcel/runtime-js ${pkg.version}\n` +
      fs.readFileSync(path.join(directory, "LICENSE"), "utf8")
  )
}
fs.writeFileSync(
  "build/chrome-mv3-prod/THIRD_PARTY_NOTICES.txt",
  notices.join("\n\n--------------------\n\n")
)
