# 配布コードのデータフロー監査

2026-10-11。基点はPR12マージ済みdevelop `01e468e25a6447b7cf3f1cf750d1b41f8b8e6f3e`。公開準備ブランチで、製品メタデータ・未使用Sheets試作・その専用依存を整理した。本監査はソース、生成エントリ、本番JavaScriptの静的確認であり、全ての外部通信を動的に観測したという意味ではない。

## データの流れ

| 入口 → 処理 → 保存/出力 | 根拠 |
| --- | --- |
| URLの `v` とvideo要素の `currentTime` → 開始/終了要求 | [`lib/actionsManager.ts`](../lib/actionsManager.ts)。ミリ秒化、動画の読み込み状態を確認 |
| content script → `chrome.runtime.sendMessage` → service worker | [`background.ts`](../background.ts)、[`lib/timelineStore.ts`](../lib/timelineStore.ts)。同一拡張ID、YouTube originのsender、操作内容を検証。runtime messageはHTTP送信ではない |
| workerの直列キュー → `chrome.storage.local` | `youCoder.timeline.<動画ID>` に `{id, team, action, start, end?, labels}` の配列を保存。行の永続IDで更新し、完了後に応答 |
| 旧 `timelines[動画ID]` → 動画別キー | 新キーがない場合だけ遅延コピー。IDのない行にIDを付与して永続化。旧コピーは削除・更新しない。壊れた配列は変更しない |
| ポップアップ入力/選択JSON → 設定 | [`popup.tsx`](../popup.tsx)。`teams`, `buttonSets`, `selectedButtonSet`, `selectedAction`, `showExtension`。互換用の `actions` / `labels` 読取もactionsManagerに残る |
| パネル移動 → サイトlocalStorage | [`components/AnalysisWorkspace`](../components/AnalysisWorkspace/index.tsx)。`youCoder.panelLayout.v2` のwide/narrow配置。YouTube origin共有。旧position/sizeキーは使わず、旧キー自体は削除しない |
| タイムライン → CSV Blob → ダウンロード | [`lib/actionCsv.ts`](../lib/actionCsv.ts)。Team/Action/秒単位Start/End/Labels/カテゴリ別列。行IDと動画IDは含まない。CSV式対策で一部文字列に先頭 `'` を付与 |
| 選択中ボタンセット → JSON Blob → ダウンロード | popupのexport。importは選択した1ファイルの検証後に追加/上書き。全設定・全記録のbackup/restoreではない |

ページはDOMから動画状態を確認し、記録時刻への移動で `video.currentTime` を変更する。動画ファイル・字幕本文・Cookieを取得する処理はない。Chrome storageのsyncは使用していない。

## 通信と依存の確認範囲

- 本番エントリはcontent script / popup / backgroundの3つ。`.plasmo/static/content.tsx`, `.plasmo/static/popup.tsx`, `.plasmo/static/background/index.ts` から本体への参照を確認した。
- React/React DOM 18.2.0、Plasmo 0.90.5の生成UI/runtime、および取り込まれたコードを含む本番の全JS/HTML/CSSを確認した。`events` / `react-draggable` などの残存依存もpackage/lockに残り、packageに存在することと本番への到達可能性は区別する。
- 本番JSの外部URLリテラルはYouTube origin/match、Reactのエラー説明リンク、W3CのXML/SVG等の名前空間。URL文字列だけでは通信を意味しない。Sheets/OAuth読込、分析記録のアップロード先、解析SDKの送信処理は見つからなかった。
- [`content.tsx`](../content.tsx)は `window.fetch` と `XMLHttpRequest.prototype.open` をラップし、元の呼出しをそのまま委譲してエラーを数える。URLやstatusをログ/警告に使うが、別エンドポイントへの送信や再送は実装していない。通常のcontent scriptのisolated worldであり、YouTubeの全通信を捕捉できる機能だとも断定しない。
- `ignoredNetworkDomains` の広告・analyticsドメイン名はエラーログを無視する判定用で、広告除去や解析サービスへの送信設定ではない。
- popupの `logger.info` は本番でも設定データ・入力名をコンソールへ出す。debugログは開発時のみ。エラーログも含め、公開Issue添付前に利用者が内容を除く必要がある。現状のローカルログをprivacyにも明記した。
- Plasmo CLIはビルド中にnpmレジストリへのバージョン確認を行う。Cloudではこの確認がDNSエラーになった一方、build本体は成功した。これは開発ツールの通信であり、インストールした本番拡張のタグ付け送信ではない。開発ビルドのHMRも本番監査の対象外。

静的な識別子・リテラル一覧は難読化や動的URL等を全て検出するものではない。「何も外部送信しない」といった包括的な保証は行わず、YouTube/Chrome自身の通信とサイト共有保存領域を別に説明する。

## Sheets削除の根拠

基点で `lib/sheets.ts` の参照は専用の `lib/sheets.test.ts` のみだった。エントリからのimportはなく、popupの `spreadsheetId` / `authUrl` stateも未使用だった。試作にはリモートGoogle API script、OAuth placeholder、Sheets appendがあったため、公開用コードの誤解を減らすために削除した。

`types/gapi.d.ts`、tsconfigのgapi型、`googleapis`、3個の `@types/gapi*` も削除対象。`googleapis` のimportは元から存在しなかった。依存の削除前後で本番bundleに試作のURL/placeholderがないことを確認した。content scriptとservice workerのSHA256は前後で一致し、popupは未使用stateの削除で52 bytes減った。

ローカル検証はNode 22.23.3 / pnpm 9.15.9。frozen install、21 suites / 386 tests、型検査、本番build、fixture構文/生成物チェック、配布物監査、diffチェックが成功した。以前の402件との差16件は削除したSheets専用テストと一致する。lockfileは263行の削除のみで、残す依存の版は変えていない。実MV3ブラウザー検証はこのブランチのPR CIに記録し、実YouTubeは自動CIではNOT RUNとする。

## 再現方法・証拠

Node22 / pnpm9.15.9で `pnpm install --frozen-lockfile` → `pnpm build` → `node scripts/release/audit-bundle.cjs`。この監査スクリプトはmanifestの既存権限・CSPとSheets試作マーカー不在を検査し、ファイルSHA256・URLリテラル・通信API識別子を出力する。セキュリティ認証の代わりではない。

- [削除前の配布物インベントリ](evidence/store-bundle-before.json)
- [整理後の配布物インベントリ](evidence/store-bundle-after.json)
- [公開前チェックリスト](release-checklist.md): 実サイトBLOCKED、手動バックアップ復元、最小権限等を残す。

権限は `storage` / `unlimitedStorage` / YouTube HTTPS hostのまま。Storeへの提出やOAuth設定は行っていない。
