const { GoogleSpreadsheet } = require('google-spreadsheet');
const config = require('../../config.json');

const CREDENTIALS = require(config.credentialsPath);

async function appendData(startTime, endTime, actionName, labels) {
  const doc = new GoogleSpreadsheet(config.spreadsheetId);
  await doc.useServiceAccountAuth({
    client_email: CREDENTIALS.client_email,
    private_key: CREDENTIALS.private_key,
  });
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

module.exports = { appendData };
