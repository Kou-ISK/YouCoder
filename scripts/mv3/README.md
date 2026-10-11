# MV3 Cloud handoff

Application-under-test revision: **`bdbc02fdfff51d6d973e4844105f5adb1c530414`**.
Known-bad overlay revision: **`fbf732f25bcd1d0df5ecbeb9a4c3371020662080`**.
Zero-end fix: `a65de5a3fb9af325e1b8f753f2134fda215a3cc8`.

These scripts were ported from the private installed-Chrome checks and executed on official Cloud CI Chromium/CfT 156.0.8078.4. **Historical reproduction, corrected geometry and all 25 synthetic MV3 cases passed; real YouTube was blocked by its sign-in/bot challenge.** See [the Cloud verification record](../../docs/mv3-cloud-verification.md) for exact heads, CI, artifact links, runner corrections and unverified live cases. Production application code remains unchanged from bdbc02f.

## Runtime and launch

Use Node 22, pnpm 9.15.9, and a non-root Cloud runtime that supports Chromium's normal sandbox. Use a provided Playwright runtime if available. Otherwise an isolated tool installation can be created without changing this repository's dependencies:

```sh
pw_runtime=$(mktemp -d)
npm install --prefix "$pw_runtime" playwright
node "$pw_runtime/node_modules/playwright/cli.js" install chromium
export YOUCODER_PLAYWRIGHT_MODULE="$pw_runtime/node_modules/playwright"
```

The harness launches Playwright's bundled full Chromium (new headless mode) using a generated empty profile and a loopback CDP port, with only `--user-data-dir`, `--remote-debugging-port`, `--no-first-run`, `--no-default-browser-check`, `--load-extension`, `--window-size`, and `--headless=new`. It does **not** use `--no-sandbox`, certificate exceptions, web-security exceptions, auth, or a personal profile. If startup or local sockets are prohibited, report **BLOCKED**, not a product test failure, and use a permitted runtime. Do not weaken security or network restrictions to make it launch.

`YOUCODER_BROWSER` may point to an approved Chromium/Chrome for Testing binary. Regular installed Google Chrome no longer supports this command-line side-loading path. `YOUCODER_HEADED=1` requires an existing display. See [Playwright extension documentation](https://playwright.dev/docs/chrome-extensions) and [CDP documentation](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp). Cloud Chromium results must be labeled separately from installed branded-Chrome results.

## Reproduce old failures, then test the fixed application

Keep this handoff checkout for its scripts. Build the two application revisions in separate checkouts; point the same scripts at each generated extension. Do not copy these scripts into the old application revision or change its production sources.

```sh
# From the handoff checkout. Build serially.
handoff_dir=$PWD
build_dir=$(mktemp -d)
git worktree add --detach "$build_dir/baseline" fbf732f25bcd1d0df5ecbeb9a4c3371020662080
git worktree add --detach "$build_dir/fixed" bdbc02fdfff51d6d973e4844105f5adb1c530414
(cd "$build_dir/baseline" && pnpm install --frozen-lockfile && PARCEL_WORKERS=1 pnpm build)
(cd "$build_dir/fixed" && pnpm install --frozen-lockfile && PARCEL_WORKERS=1 pnpm build)

node scripts/mv3/fixture-check.cjs
YOUCODER_EXTENSION_DIR="$build_dir/baseline/build/chrome-mv3-prod" \
  YOUCODER_EXPECT=baseline node scripts/mv3/run.cjs reproduce
YOUCODER_EXTENSION_DIR="$build_dir/fixed/build/chrome-mv3-prod" \
  YOUCODER_EXPECT=fixed node scripts/mv3/run.cjs reproduce
YOUCODER_EXTENSION_DIR="$build_dir/fixed/build/chrome-mv3-prod" \
  node scripts/mv3/run.cjs
```

The runner executes sequentially and returns nonzero on failure. Each case owns its generated temporary profile; `restart` closes and relaunches the browser with the same profile, then removes it. Evidence goes to a fresh private temporary directory printed as `Private suite output`. No screenshots, generated CSVs, profile data, browser logs, or test results are automatically uploaded. Preserve required evidence privately, then remove only the generated test directories and worktrees.

For a single case, pass `layout`, `core`, `lifecycle`, or `restart` to `run.cjs`. Extension ID is discovered from the actual MV3 target and is not hardcoded. A startup failure can leave a temporary test profile; its path is reported in `environment.json` if startup progressed that far.

## Fixture and assertions

The synthetic tab intercepts its own requests and serves only `https://www.youtube.com/watch?v=YC_TEST_*` documents. Other requests in that tab are aborted. The HTML contains a native video element with a generated 120-second silent PCM WAV and a minimal `ytd-watch-flexy #below` anchor. It includes no downloaded media, account information, live-site recording, or real user records. Configuration uses Alpha/Beta, Pass/Shot, and synthetic labels.

- `reproduce`: at 1440×730, expect the old overlay to obstruct a point near native video controls, place the tagging panel beyond the viewport, and fail to apply saved legacy geometry. For the fixed build, expect two panels inside `#below`, beneath the video, with no obstruction/overflow. A `baseline` PASS means the **known bug was reproduced**, not that the old product is good.
- `layout`: actual pointer move/resize; bounding boxes at 1440/900/375/320; wide preference retained; synthetic A→B→A; anchor replacement; page reload; 20 synchronous UI clicks with a delayed write; worker write failure/recovery; collapse/reset.
- `core`: UI start/tag/stop; A→B→A; URL change before navigation event; same/different-video tabs; stale-ID stop/label/delete rejection; sorted deletion; legacy migration; end=0 display/seek; malformed payload retention; injected write failure; downloaded CSV BOM/CRLF/Japanese/quotes/newlines/formula literals.
- `lifecycle`: stale-ID rejection; sorted deletion identity; actual `ServiceWorker.stopWorker`, disappearance of the target, runtime-message restart, preserved storage and a subsequent write; browser identity/launch arguments. Sorted-row clicks use forced pointer dispatch to isolate confirmation identity from hover animation, so they are not evidence of unrestricted UI reachability.
- `restart`: exact extension storage preservation, saved layout restoration, and a successful zero-end stop after full browser restart.

Requests use actual `chrome.runtime.sendMessage` from the isolated content-script world and actual `chrome.storage.local` in the test extension. Storage failures are injected only into this ephemeral extension's worker and restored afterward. No mocked Chrome API replaces the MV3 runtime.

## Existing evidence and remaining cases

Installed Google Chrome 154 on macOS, baseline fbf732f: A→B→A, URL-leading navigation, two tabs, stale IDs, sorted deletion, migration, injected save failure/recovery, CSV, worker restart and browser restart passed. a65de5a's zero-end display/seek passed. The baseline's live player control points were covered by the extension while shown, and reachable while hidden. Tagging extended 80px past a 1440px viewport; saved geometry was not applied. Original private evidence remains on the originating execution environment; it is intentionally not in Git.

bdbc02f: 22 suites / 402 tests, TypeScript, production MV3 build and [CI](https://github.com/Kou-ISK/YouCoder/actions/runs/38156092489) passed. Revised UI browser checks were not run there; this Cloud handoff replaces the Mac GUI wait.

After synthetic tests, use a **separate clean unrouted tab/profile** for a minimum ordinary public YouTube check. Observe controls and their `elementFromPoint` reachability with the extension shown, native player fullscreen enter/exit, captions when available, theater mode, real YouTube SPA navigation without document reload, and returned panel geometry. Keep playback short and CPU low. Do not download media, bypass ads, sign in, post, or accept new permissions. If no advertisement or caption track appears, mark that case **NOT RUN**; synthetic geometry does not prove live-ad/caption compatibility. Unsupported YouTube page structures should leave the extension UI absent.

Before Store submission, privacy disclosures/URL, placeholder package metadata, unused Sheets prototype/dependency cleanup, real storage quota/device failure handling, and current Store policy review remain. No merge or Store submission is authorized by this handoff.


## Automated Cloud execution

`.github/workflows/mv3.yml` runs on the PR's exact head on GitHub's supported
Ubuntu 22.04 runner, with Node 22, pnpm 9.15.9, frozen application installs,
and isolated Playwright 1.64.0 plus its official full Chromium distribution.
It builds the historical baseline first and the checked-out head second.
No sandbox, TLS, site-isolation, sysctl or AppArmor exceptions are applied.
A blocked browser setup is not a product pass.

`YOUCODER_TEST_OUTPUT` now selects the suite directory. `suite.json` records
process exit status. `live` is an explicit, separate case with an empty profile
and no request routing. It observes a short ordinary public video, native
controls, fullscreen/theater, viewport changes and ordinary related-link SPA
navigation where available. Caption control reachability is separate from
rendered captions; absent ads/captions are NOT RUN. Site access failures are
BLOCKED even if the observation command exits successfully. Read the case
statuses, not just the workflow's green check.

The CI artifact retains only generated JSON, screenshots and synthetic CSV for
7 days. Profiles, cookies, browser logs, network archives and credentials are
not uploaded. Screenshots from `public-youtube` are public unauthenticated page
observations; other screenshots are synthetic. The local runner still uploads
nothing.
