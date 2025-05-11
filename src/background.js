const ACTION_BUTTON_ID = 'actionButton';
const LABEL_BUTTON_ID = 'labelButton';

let startTime = null;
let endTime = null;
let labels = [];

chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Timestamp Extension installed.');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleActionButton') {
    handleActionButtonClick();
  } else if (request.action === 'addLabel') {
    handleLabelButtonClick(request.label);
  }
});

function handleActionButtonClick() {
  const currentTime = getCurrentTime();

  if (startTime === null) {
    startTime = currentTime;
    console.log(`Start time recorded: ${startTime}`);
  } else {
    endTime = currentTime;
    console.log(`End time recorded: ${endTime}`);
    saveDataToGoogleSheets();
    resetData();
  }
}

function handleLabelButtonClick(label) {
  if (startTime !== null && endTime === null) {
    labels.push(label);
    console.log(`Label added: ${label}`);
  }
}

function getCurrentTime() {
  // This function should be implemented to get the current video time from the content script
  return 0; // Placeholder
}

function saveDataToGoogleSheets() {
  const data = {
    startTime: startTime,
    endTime: endTime,
    labels: labels,
  };

  // Call the Google Sheets API to save the data
  // This should be implemented in google-sheets-api.js
}

function resetData() {
  startTime = null;
  endTime = null;
  labels = [];
}
