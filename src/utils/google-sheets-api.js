const { GoogleSpreadsheet } = require('google-spreadsheet');

async function appendData(startTime, endTime, actionName, labels) {
  // スプレッドシートIDを取得
  const spreadsheetId = await getSpreadsheetId();
  const credentials = await getCredentials();

  const doc = new GoogleSpreadsheet(spreadsheetId);
  await doc.useServiceAccountAuth(credentials);
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[0];
  const row = {
    startTime,
    endTime,
    actionName,
    ...labels.reduce((acc, label, index) => {
      acc[`label${index + 1}`] = label;
      return acc;
    }, {}),
  };

  await sheet.addRow(row);
}

function getSpreadsheetId() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['spreadsheetId'], (result) => {
      resolve(result.spreadsheetId || '');
    });
  });
}

function getCredentials() {
  return new Promise((resolve) => {
    // 必要に応じて、credentials を chrome.storage に保存して取得するように変更
    resolve({
      client_email: 'YOUR_CLIENT_EMAIL',
      private_key: 'YOUR_PRIVATE_KEY',
    });
  });
}

module.exports = { appendData };
