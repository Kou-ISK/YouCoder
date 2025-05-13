let buttonTimes = {}; // ボタンごとに startTime と endTime を保持
let labels = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCurrentTime') {
    const currentTime = getCurrentVideoTime();
    sendResponse({ currentTime });
  }
});

chrome.runtime.sendMessage(
  { action: 'fetchData', url: 'https://example.com/resource' },
  (response) => {
    if (response) {
      console.log('データを取得しました:', response);
    } else {
      console.error('データの取得に失敗しました');
    }
  }
);

// UI を挿入する関数
function injectUI() {
  const container = document.createElement('div');
  container.id = 'youcoder-container';
  container.style.position = 'fixed';
  container.style.top = '10px';
  container.style.right = '10px';
  container.style.zIndex = '10000';
  container.style.backgroundColor = '#ffffff';
  container.style.border = '1px solid #ccc';
  container.style.borderRadius = '8px';
  container.style.padding = '10px';
  container.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';

  container.innerHTML = `
    <h3 style="margin: 0 0 10px;">YouCoder</h3>
    <input id="spreadsheetUrl" type="text" placeholder="スプレッドシートのURLを入力" style="width: 100%; margin-bottom: 10px;" />
    <button id="saveUrlButton" style="margin-bottom: 10px;">URLを保存</button>
    <button id="editButtonsButton" style="margin-bottom: 10px;">ボタンを編集</button>
    <div id="buttonsContainer"></div>
  `;

  document.body.appendChild(container);

  setupEventListeners();
}

// ボタンのイベントリスナーを設定
function setupEventListeners() {
  document.getElementById('saveUrlButton').addEventListener('click', () => {
    const spreadsheetUrl = document.getElementById('spreadsheetUrl').value;
    if (spreadsheetUrl) {
      chrome.runtime.sendMessage(
        { action: 'updateConfig', spreadsheetUrl },
        (response) => {
          if (response.success) {
            alert('スプレッドシートのURLが保存されました');
          } else {
            alert('URLの保存に失敗しました');
          }
        }
      );
    }
  });

  document.getElementById('editButtonsButton').addEventListener('click', () => {
    const newButtonPresets = [
      {
        name: 'custom',
        actionButtons: [
          { name: 'Custom Start', color: '#FF8800' },
          { name: 'Custom Stop', color: '#008800' },
        ],
        labelButtons: [
          { name: 'Custom Label1', color: '#8800FF' },
          { name: 'Custom Label2', color: '#FF0088' },
        ],
      },
    ];

    chrome.runtime.sendMessage(
      { action: 'updateConfig', buttonPresets: newButtonPresets },
      (response) => {
        if (response.success) {
          alert('ボタンプリセットが保存されました');
          generateButtons(); // 新しいボタンを表示
        } else {
          alert('ボタンプリセットの保存に失敗しました');
        }
      }
    );
  });

  generateButtons();
}

// ボタンを動的に生成
function generateButtons() {
  chrome.runtime.sendMessage({ action: 'getConfig' }, (config) => {
    const buttonsContainer = document.getElementById('buttonsContainer');
    buttonsContainer.innerHTML = ''; // 既存のボタンをクリア

    // アクションボタンを生成
    config.buttonPresets[0].actionButtons.forEach((button) => {
      const actionButton = document.createElement('button');
      actionButton.textContent = button.name;
      actionButton.style.backgroundColor = button.color;
      actionButton.style.marginRight = '5px';
      actionButton.addEventListener('click', () => {
        handleActionButtonClick(button.name);
      });
      buttonsContainer.appendChild(actionButton);
    });

    // ラベルボタンを生成
    config.buttonPresets[0].labelButtons.forEach((button) => {
      const labelButton = document.createElement('button');
      labelButton.textContent = button.name;
      labelButton.style.backgroundColor = button.color;
      labelButton.style.marginRight = '5px';
      labelButton.addEventListener('click', () => {
        labels.push(button.name);
        alert(`${button.name} ラベルが追加されました`);
      });
      buttonsContainer.appendChild(labelButton);
    });
  });
}

// アクションボタンがクリックされたときの処理
function handleActionButtonClick(actionName) {
  const currentTime = getCurrentVideoTime();

  if (!buttonTimes[actionName]) {
    buttonTimes[actionName] = { startTime: null, endTime: null };
  }

  if (buttonTimes[actionName].startTime === null) {
    buttonTimes[actionName].startTime = currentTime;
    alert(`開始時間を記録しました: ${currentTime}`);
  } else {
    buttonTimes[actionName].endTime = currentTime;
    alert(`終了時間を記録しました: ${currentTime}`);
    saveDataToSpreadsheet(
      actionName,
      buttonTimes[actionName].startTime,
      buttonTimes[actionName].endTime,
      labels
    );
    resetButtonTimes(actionName);
  }
}

// YouTube の現在の再生時間を取得
function getCurrentVideoTime() {
  const videoElement = document.querySelector('video');
  if (videoElement) {
    return videoElement.currentTime;
  }
  return 0;
}

// スプレッドシートにデータを保存
function saveDataToSpreadsheet(actionName, startTime, endTime, labels) {
  chrome.runtime.sendMessage(
    {
      action: 'appendData',
      data: {
        actionName,
        startTime,
        endTime,
        labels,
      },
    },
    (response) => {
      if (response.success) {
        alert('データがスプレッドシートに保存されました');
      } else {
        alert('データの保存に失敗しました');
      }
    }
  );
}

// ボタンごとのデータをリセット
function resetButtonTimes(actionName) {
  buttonTimes[actionName] = { startTime: null, endTime: null };
}

// ページ読み込み時に UI を挿入
window.addEventListener('load', injectUI);
