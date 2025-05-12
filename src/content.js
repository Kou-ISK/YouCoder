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

function getCurrentVideoTime() {
  const videoElement = document.querySelector('video');
  if (videoElement) {
    return videoElement.currentTime;
  }
  return 0;
}

// UI を挿入する関数
function injectUI() {
  // 既存の YouTube ページに挿入するコンテナを作成
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

  // UI の内容を作成
  container.innerHTML = `
    <h3 style="margin: 0 0 10px;">YouCoder</h3>
    <input id="spreadsheetUrl" type="text" placeholder="スプレッドシートのURLを入力" style="width: 100%; margin-bottom: 10px;" />
    <button id="saveUrlButton" style="margin-bottom: 10px;">URLを保存</button>
    <div id="buttonsContainer"></div>
  `;

  // ページに挿入
  document.body.appendChild(container);

  // ボタンのイベントリスナーを設定
  setupEventListeners();
}

// ボタンのイベントリスナーを設定
function setupEventListeners() {
  // スプレッドシートURLを保存する
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

  // ボタンを動的に生成
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
        alert(`${button.name} ボタンがクリックされました`);
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
        alert(`${button.name} ボタンがクリックされました`);
      });
      buttonsContainer.appendChild(labelButton);
    });
  });
}

// ページ読み込み時に UI を挿入
window.addEventListener('load', injectUI);
