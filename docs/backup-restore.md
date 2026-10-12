# バックアップ・別プロファイル復元・容量

2026-10-12。通常の利用には[README](../README.md#バックアップと移行)のボタンセットJSON/CSVを使います。JSONは選択中のセット1個だけ、CSVは現在の動画の分析用です。CSVから全記録を復元する機能はありません。

## ボタンセットの復元

1. 元の環境で各セットを選び、ポップアップの「エクスポート」を実行します。
2. 新しい環境で「インポート」から自分で保存したJSONを選択します。
3. 同名セットがある場合は上書き確認が出ます。不要な上書きはキャンセルしてください。壊れたJSONは拒否されます。
4. チーム一覧はJSONに含まれないため、別に控えて作り直します。

合成データで別の空プロファイルへの読込、上書きキャンセル、不正JSON拒否を実MV3で検証しました。[検証記録](release-flow-verification.md)を参照してください。

## 全storageの退避（上級者向け）

YouCoderを使う全ての動画ページを閉じ、設定の編集を止めてから、`chrome://extensions` のYouCoder → service workerの検証を開きます。YouCoderのDevTools Consoleで次を実行し、クリップボードのJSONをローカルのUTF-8ファイルへ保存します。

```js
copy(JSON.stringify(await chrome.storage.local.get(null), null, 2))
```

JSONには動画ID、個人名を含み得る入力、旧 `timelines` も入ります。端末内で保管し、公開Issueへ貼り付けないでください。YouTubeサイト側のパネル配置は含みません。全storageを定期退避する機能や、暗号化する機能はありません。

## 全storageの復元（新しい空プロファイル限定）

これは復元UIではありません。別のChromeプロファイルまたは別IDのインストール先で、**既存の分析記録がないことを確認できる上級者向け手順**です。既存記録とのマージや全動画の一括上書きには使いません。

1. 元のプロファイルとバックアップを残したまま、新規プロファイルに同じバージョンのYouCoderを導入します。
2. YouTubeページを全て閉じます。新規環境でタグ付けや設定編集を始めないでください。
3. YouCoderのポップアップを右クリックして「検証」を開きます。ここはYouTubeページのConsoleとは別です。
4. 下のコードはファイル選択を行い、JSONとして読み取ります。自分が退避したファイルだけを選びます。既存の記録・チーム・ボタンセットがあれば中止します。文字列をJavaScriptコードとして実行する方法は使いません。

```js
const input = document.createElement("input")
input.type = "file"
input.accept = ".json"
input.onchange = async () => {
  try {
    const file = input.files?.[0]
    if (!file) return
    const snapshot = JSON.parse(await file.text())
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
      throw new Error("バックアップはJSONオブジェクトである必要があります")
    }
    const current = await chrome.storage.local.get(null)
    if (Object.keys(current).some((key) =>
      key === "timelines" || key.startsWith("youCoder.timeline.") ||
      key === "teams" || key === "buttonSets")) {
      throw new Error("既存データがあるため中止しました。新しい空プロファイルを使用してください")
    }
    await chrome.storage.local.set(snapshot)
    console.info("復元しました。ポップアップを閉じて開き直し、元の動画で内容を確認してください")
  } catch (error) {
    console.error("復元できませんでした。元の環境とバックアップを残してください", error)
  } finally {
    input.remove()
  }
}
document.body.append(input)
input.click()
```

5. ポップアップを開き直し、設定と複数動画の記録を確認します。開始中だった区間の続行・停止も確認します。元の環境を削除する前にCSVを比較してください。

検証したのは同じスキーマの自己生成バックアップを新規プロファイルへ復元する流れです。未知の旧版、改変したJSON、既存環境へのマージ、他の端末の全条件を保証するものではありません。ブラウザーがConsoleの貼付けを制限する場合、制限を解除して実行する案内は行いません。安全に操作できない場合は元のプロファイルを維持してください。

## 容量と既存の大きなデータ

`storage` 権限のみで通常上限10,485,760 bytesを使います。Chromeの[storage API仕様](https://developer.chrome.com/docs/extensions/reference/api/storage)ではキーとJSON値が容量に数えられます。合成の10,000行は1,126,712 bytesでした。行数だけで容量は決まらず、長いラベルや旧コピーで増えます。

YouCoderのConsoleで読み取り専用の容量確認ができます。

```js
await chrome.storage.local.getBytesInUse(null)
```

旧版の `unlimitedStorage` により既に上限を超えている場合、新版では保存・編集や旧形式からのコピーに失敗します。移行用の旧 `timelines` も容量に含まれます。既存記録を勝手に削除しません。更新前に退避し、復元先でも上限に収まることを確認してください。

不要な動画のデータを整理する場合も、まず全JSONと動画別CSVを保存します。旧 `timelines` や動画別キーをDevToolsから削除する操作は不可逆です。この自動検証では生成した大容量ダミーだけを削除して復旧を確認し、利用者のデータには触れません。容量超過時の全動画整理・分割復元UIは未提供です。
