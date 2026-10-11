# PR12 Cloud MV3 verification — 2026-10-11 UTC

**Synthetic MV3 verification passed. Live YouTube compatibility remains blocked.**
This is not a Store/release approval. No merge or Store submission was performed.

## Revisions and runtime

| Item | Value |
| --- | --- |
| Initial fetched handoff | `3e604e5cfe66d3a88b01ef8abdcbcc1a4d17fdb4` |
| Verified test runner | `3bc650c02fc615765921529c55f7742d2424ab85` |
| Application under test | `bdbc02fdfff51d6d973e4844105f5adb1c530414` (production sources unchanged throughout Cloud work) |
| Historical baseline | `fbf732f25bcd1d0df5ecbeb9a4c3371020662080` |
| Successful runtime | GitHub Actions `ubuntu-22.04`, Node 22, pnpm 9.15.9, Playwright 1.64.0 |
| Actual browser | Playwright official full Chromium / Chrome for Testing **156.0.8078.4**, new headless mode |
| Reproduction viewport | **1440 × 730**, set before the extension mounts |
| Layout viewports | **1440, 900, 375, 320 × 1000**, then return to wide |
| Public observation viewport | **1440 × 1000** |

[MV3 run](https://github.com/Kou-ISK/YouCoder/actions/runs/38158308548),
[unit/type/build CI](https://github.com/Kou-ISK/YouCoder/actions/runs/38158308600),
[JSON, screenshots and CSV artifact](https://github.com/Kou-ISK/YouCoder/actions/runs/38158308548/artifacts/11709153219).
The artifact SHA256 is `7390eb7b72c6b2f1b2002436d0991348890c4730175a489b9fc8c870b73521ea`;
retention ends 2026-10-18. The artifact name uses GitHub's merge-event SHA;
`head.txt` records the actual checked-out PR head listed above.

The selected Cloud workspace first attempted Debian Chromium 154.0.8037.57.
It aborted with a misowned setuid sandbox helper (owner `nobody`, not root;
`NoNewPrivs=1`). The official Playwright CLI browser download there returned
HTTP 403 `Domain forbidden`. Those environment attempts are **BLOCKED**, not
product failures. The permitted GitHub-hosted runtime successfully installed
and launched the official browser without sandbox/TLS/site-isolation exceptions,
proxy changes, sysctl changes or AppArmor changes. No personal profile was used.
See the [official Playwright extension setup](https://playwright.dev/docs/chrome-extensions).

## Historical defects and corrected behavior

The **baseline PASS means the known defects were reproduced**. Both revisions
were built serially from separate source trees with frozen application lockfiles.
The same generated fixture and assertions were used.

| Measurement | Historical baseline | Corrected application |
| --- | --- | --- |
| Three native video control-area points at y=616.4375, x=59/440/821 | All hit `PLASMO-CSUI` (covered) | All hit `VIDEO` (unobstructed) |
| Tagging panel right edge | 1520 at viewport width 1440: **80 px overflow** | 405: **0 px overflow** |
| Saved legacy x=900 / width=460 | Not applied; actual x=1140 / width=380 | Unsafe legacy viewport coordinates intentionally ignored |
| Panel placement | Timeline y=550 overlaps video's bottom=636.4375 | Both panels begin y=700.4375 under `#below` |
| New saved workspace geometry | Unsupported by baseline | Pointer move/resize to x=30, y=30, 440×345 survives remount/reload; browser restart restores keyboard-moved x=10 |

These are native-video **area hit tests** on a generated silent-WAV fixture,
not a claim that actual YouTube fullscreen/play controls were exercised.
Below-player panels scroll with the page; their bottom may exceed the viewport
height, while remaining within their workspace and horizontal page bounds.

Workspace bounds constrain each panel independently. The application does not
prevent panel-to-panel collisions: independent artifact review observed a
**74 px-wide overlap** after moving a panel. Player non-obstruction does not
establish that the panels remain mutually unobstructed.

## Synthetic MV3 results — 25/25 PASS

Actual extension service worker, isolated content-script messages and
`chrome.storage.local` were used. No mocked Chrome API replaces the runtime.
Only this fixture tab intercepts navigation; it fetches no real YouTube media.

| Group | Results |
| --- | --- |
| Layout — 8/8 | Below-player anchor and native video control-area reachability; actual native Fullscreen API enter/exit via fixture pointer click; actual pointer move/resize; 900/375/320/wide outer panel/workspace containment; A→B→A plus anchor replacement; page reload restoration; 20 synchronous clicks with one delayed write followed by injected stop failure and recovery; collapse/reset |
| Core — 12/12 | UI start/label/stop; A→B→A data/active isolation; URL-leading navigation; same-video two-tab starts/labels/synchronization; different-video isolation; same-time replacement rejects old stop/label/delete IDs; sorted deletion identity; legacy migration with durable IDs and retained backup; end=0 display/seek; malformed payload retained; storage-write failure and recovery; CSV BOM/CRLF/Japanese/quotes/newlines/formula literals |
| Lifecycle — 4/4 | Old-ID rejection; sorted-row identity; actual `ServiceWorker.stopWorker`, target disappearance, message-triggered restart and subsequent write; browser identity and no insecure launch flags |
| Browser restart — 1/1 | Full process exit and new process with the same generated profile preserves all five storage keys exactly, restores saved layout and permits a zero-end stop |

The delayed-write check asserts both one interval and exactly one underlying
storage write. Failures are injected only into the ephemeral test worker and
restored in `finally`. Sorted deletion in both `core` and `lifecycle` uses
`force: true`, which bypasses normal actionability checks, including whether
the target receives pointer events. The PASS establishes selected-record ID
preservation after sorting; it does not establish normal click reachability.
Native fixture fullscreen is not real YouTube fullscreen.

The **375 px check covers outer panel/workspace bounds only**. Horizontal
scrolling to the timeline table's right-hand columns and access to every
operation were not tested and are not included in its PASS. The same bounds
assertions do not establish panel collision avoidance.

## Real YouTube — BLOCKED / NOT RUN

A separate empty, unrouted profile opened the ordinary public video
[Me at the zoo](https://www.youtube.com/watch?v=jNQXAC9IVRw). The page returned
HTTP 200 with the expected title, then displayed **“Sign in to confirm you’re
not a bot”**; media `readyState` remained 0.

| Case | Status |
| --- | --- |
| Public document access | PASS (HTTP 200 only) |
| Public video playback | BLOCKED by YouTube sign-in/bot challenge |
| Native YouTube play/fullscreen controls | NOT RUN |
| Real fullscreen enter/exit and theater mode | NOT RUN |
| Rendered captions | NOT RUN |
| Real SPA navigation/return | NOT RUN |
| Live resize and small viewport compatibility | NOT RUN |
| Active advertisement non-obstruction | NOT RUN; no ad compatibility claim |

No sign-in, challenge bypass, ad removal/click, downloaded media or private
history access was used. The observation command records blockers and exits
successfully when no product assertion failed: **its green CI step does not mean
live YouTube passed**. Synthetic results cannot replace these remaining checks.
The first run's small-viewport observation against a hidden/nonfunctional player
is not counted as live compatibility evidence.

## Harness fixes discovered by execution

Initial Cloud CI runs exposed portable-runner issues; no application changes
were necessary:

- Set the target viewport before first mount. Resizing after mount retained the
  historical component's original offscreen coordinates and tested a different defect.
- Record startup details before launching and recognize signal termination.
- Wait for normal browser process exit after `Browser.close`; immediately sending
  SIGTERM raced localStorage flushing and invalidated the restart test.
- Wait for usable media after reload/seek and for actionable controls before the
  burst. Diagnostics confirmed media was already ready in the remaining failure.
- Preserve the native StorageArea receiver inside the delayed setter. A probe
  confirmed the prior unbound call threw `Illegal invocation: Function must be
  called on an object of type StorageArea`. With `Reflect.apply` the burst and
  injected-failure recovery both pass.
- Preserve suite exit results and keep live statuses separate from fixtures.

Earlier failing runs are retained for comparison:
[initial](https://github.com/Kou-ISK/YouCoder/actions/runs/38157571478),
[geometry/restart corrected](https://github.com/Kou-ISK/YouCoder/actions/runs/38157865524),
[receiver diagnostic](https://github.com/Kou-ISK/YouCoder/actions/runs/38158092168).

## Evidence and limits

The artifact contains generated JSON, PNG and synthetic CSV only. Profiles,
cookies, browser logs, HAR and credentials are excluded. `environment.json`
records browser version, executable, launch arguments and manifest;
`reproduce.json`, case result JSONs, `suite.json` and `head.txt` identify each run.
Screenshots include old/fixed geometry, narrow layout, synthetic fullscreen,
save failure, migration/CSV and the public access blocker.

DOM measurements and every case result were reviewed through CI logs. Artifact
image transfer into this Cloud execution workspace failed through both available
normal transfer routes, so this executor did not inspect the image pixels locally.
The subsequent independent review, as reported in the task follow-up, obtained
and visually inspected the official artifact for exact head `aa15008`, confirmed
both CI runs and all 25 cases, and found no blocking issue for a normal develop
merge. It also identified the overlap and narrow-table coverage limits above.
This independent image review does not change the live YouTube BLOCKED status;
no merge or Store submission was performed by this task.

Local Node 22.23.3 / pnpm 9.15.9 verification also passed 22 suites / 402 tests,
TypeScript and both production builds. Frozen lockfiles, production sources and
extension permissions were unchanged. The optional Plasmo update-metadata lookup
reported EAI_AGAIN locally after successful builds; the actual build completed.
The manifest still grants only `storage`, existing `unlimitedStorage`, and the
YouTube HTTPS origin. Store disclosures, package metadata and the remaining
live-site checks are still required before release.
