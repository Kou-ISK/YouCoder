let startTime = null;
let endTime = null;
let labels = [];

document.getElementById('actionButton').addEventListener('click', () => {
  const currentTime = getCurrentTime();

  if (startTime === null) {
    startTime = currentTime;
    alert(`開始時間を記録しました: ${currentTime}`);
  } else {
    endTime = currentTime;
    alert(`終了時間を記録しました: ${currentTime}`);
    saveDataToGoogleSheets(startTime, endTime, labels);
    resetData();
  }
});

document.getElementById('labelButton').addEventListener('click', () => {
  const labelName = prompt('ラベルを入力してください:');
  if (labelName) {
    labels.push(labelName);
    const labelList = document.getElementById('labelList');
    const listItem = document.createElement('li');
    listItem.textContent = labelName;
    labelList.appendChild(listItem);
  }
});

function getCurrentTime() {
  // YouTube の動画の現在時間を取得するロジックを実装
  return new Date().toLocaleTimeString(); // 仮の値
}

function saveDataToGoogleSheets(start, end, labels) {
  console.log('データを保存:', { start, end, labels });
  // Google Sheets API を呼び出してデータを保存するロジックを実装
}

function resetData() {
  startTime = null;
  endTime = null;
  labels = [];
  document.getElementById('labelList').innerHTML = '';
}
