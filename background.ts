import {
  createTimelineMessageListener,
  createTimelineStore
} from "./lib/timelineStore"

// MV3 runs one service worker for this extension. All tabs submit operations to
// this instance instead of racing read/modify/write cycles in content scripts.
const timelines = createTimelineStore({
  get: (keys) => chrome.storage.local.get(keys),
  set: (items) => chrome.storage.local.set(items)
})

chrome.runtime.onMessage.addListener(
  createTimelineMessageListener(timelines, chrome.runtime.id)
)
