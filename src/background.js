let startTime = null;
let endTime = null;
let labels = [];

// 初回インストール時に初期設定を保存
chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Timestamp Extension installed.');

  // 初期設定を保存
  const initialConfig = {
    spreadsheetId: '',
    buttonPresets: [
      {
        name: 'default',
        actionButtons: [
          { name: 'Start', color: '#FF0000' },
          { name: 'Stop', color: '#00FF00' },
        ],
        labelButtons: [
          { name: 'Label1', color: '#0000FF' },
          { name: 'Label2', color: '#FFFF00' },
        ],
      },
    ],
  };

  chrome.storage.local.set({ config: initialConfig }, () => {
    console.log('Initial config saved to chrome.storage.local');
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleActionButton') {
    handleActionButtonClick();
  } else if (request.action === 'addLabel') {
    handleLabelButtonClick(request.label);
  } else if (request.action === 'fetchData') {
    fetch(request.url, { mode: 'no-cors' })
      .then((response) => {
        console.log('リクエストが成功しました');
        sendResponse({ success: true });
      })
      .catch((error) => console.error('Fetch error:', error));
    return true; // 非同期応答を許可
  } else if (request.action === 'updateConfig') {
    // ボタンプリセットを更新
    chrome.storage.local.get(['config'], (result) => {
      const config = result.config || {};
      config.buttonPresets = request.buttonPresets; // ユーザーが送信したプリセットで上書き
      chrome.storage.local.set({ config }, () => {
        sendResponse({ success: true });
      });
    });
    return true; // 非同期応答を許可
  } else if (request.action === 'getConfig') {
    // 現在の設定を取得
    chrome.storage.local.get(['config'], (result) => {
      sendResponse(result.config || {});
    });
    return true; // 非同期応答を許可
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

  console.log('Saving data to Google Sheets:', data);

  // Call the Google Sheets API to save the data
  // This should be implemented in google-sheets-api.js
}

function resetData() {
  startTime = null;
  endTime = null;
  labels = [];
}

// スプレッドシートURLからIDを抽出
function extractSpreadsheetId(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}
