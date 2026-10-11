# Timeline data-safety changes

This branch is a **draft for review**, not a Store-ready release.

## What changed

- All timeline reads and mutations pass through a single MV3 background queue. Each operation reads the latest stored state, preventing one tab from overwriting another tab's edits.
- New writes use `youCoder.timeline.<videoId>`. Existing `timelines[videoId]` entries are read when no new key exists and are left untouched. Malformed saved data fails closed instead of being replaced with an empty timeline.
- Content-side state is scoped to the current video and guarded against delayed requests. Navigation and storage events refresh the timeline and active buttons together.
- A write is acknowledged only after `chrome.storage.local.set` resolves. Session storage and memory are not reported as persistent saves. Failed or uncertain results are visible; controls show a saving state while an operation is pending.
- Stop and label operations check the captured interval's start time, so stale tabs reject replacements with a different start time. Repeated identical labels are no-ops.
- CSV uses elapsed seconds with explicit column names, quoted/escaped fields, UTF-8 BOM, CRLF, a plain-label column, and spreadsheet-formula neutralization. This changes the old epoch-date CSV schema.
- Permissions are limited to `storage` and `https://www.youtube.com/*`. Injection and CSS access use the same site scope.

## Automated verification

Run from the repository after installing the lockfile dependencies:

```sh
pnpm test -- --runInBand
pnpm exec tsc --noEmit --incremental false
pnpm build
```

Verified in the cloud checkout: 20 suites / 342 tests passed; TypeScript passed. Production MV3 build passed. Plasmo emitted a non-fatal update-check timeout and an outdated Browserslist-data notice.

Focused tests cover A → B → A, out-of-order replies, same-video and cross-video concurrent operations, persisted write failures, legacy data, invalid data, zero timestamps, stale interval edits, duplicate labels, CSV quotes/newlines/Japanese/formula input, and React navigation/error/pending states.

The build's generated manifest must contain the background service worker, only the `storage` API permission, and only the YouTube HTTPS origin for host/content-script access. The unused Sheets prototype is not imported into the shipped entry points and is not enabled by this change.

## Required manual verification before release

Automated DOM tests use a mocked runtime. Actual MV3 service-worker lifecycle, Chrome storage quota behavior, and YouTube's live SPA/player/layout remain unverified. Cloud Chromium launch was blocked by the execution environment's socket restriction; no browser-security or system settings were changed to bypass it.

- Load `build/chrome-mv3-prod` unpacked in a separate Chrome test profile.
- Start/tag/stop a record on video A. Navigate to B within YouTube, record on B, then return to A. Verify each timeline and active state belongs to its own video.
- Repeat in two tabs for both the same video and different videos. Verify concurrent records/labels and deletion are preserved and visible across tabs.
- Restart Chrome and suspend/restart the extension service worker. Verify persisted timelines reload and subsequent edits work.
- Exercise a failed storage write and an invalid stored payload. Verify there is no success claim or silent overwrite.
- Export a fixture containing Japanese, commas, double quotes, multiline labels, uncategorized labels, and formula-leading text. Verify elapsed seconds and literal spreadsheet cells.
- Verify real-video playback, ads, navigation, fullscreen, captions, and YouTube controls continue to work. This patch does not approve the existing overlay layout or any Store/YouTube policy interpretation.
- Interval identity remains `(team, action, start)`, not a persistent UUID. Restarting after seeking to the exact same millisecond is indistinguishable from the old interval, and duplicate historical rows with this tuple make deletion ambiguous. Persistent per-record IDs and migration need a follow-up before claiming complete conflict protection.
- Large existing datasets require a quota/migration review before release: removing `unlimitedStorage` restores Chrome’s normal local-storage quota, while the untouched legacy copy also occupies space. Writes fail visibly if the quota is exceeded; this patch does not delete old data automatically.
- Do not edit the same data in an old extension build after migration: the old build only understands the legacy key and cannot see new-format edits.

No Store submission, production merge, or release is part of this patch.
