chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCurrentTime') {
    const currentTime = getCurrentVideoTime();
    sendResponse({ currentTime });
  }
});

function getCurrentVideoTime() {
  const videoElement = document.querySelector('video');
  if (videoElement) {
    return videoElement.currentTime;
  }
  return 0;
}
