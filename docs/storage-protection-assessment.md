# 保存時保護の適用範囲と判定

2026-10-12。実装の確認対象はdevelop `835f42ff5e9d019957e7d1c5fab8149e19298697`（PR16と同じsource tree）。これは実装・公式文書の照合であり、Storeの審査結果や発行者の認証ではありません。

**独自の暗号化がないことは確認済みですが、それだけでStore不適合とは断定できません。保存時保護の要件に適合する根拠は未確認です。** 本記録は実装事実と適合根拠を区別するもので、暗号化機能を必須の次期仕様と決めたものではありません。

## 実際に保存するもの

| データ | 保存先・保持 | 実装根拠・保護の範囲 |
| --- | --- | --- |
| 動画ID、行ID、チーム名、アクション名、開始/終了時刻、ラベル | `chrome.storage.local` の `youCoder.timeline.<videoId>`。明示的な削除まで保持 | [timelineStore](../lib/timelineStore.ts)の`persist`と[background](../background.ts)。通常のJSON値を保存し、アプリで暗号化しない。動画IDは閲覧対象を示し、自由入力は個人名等を含み得る |
| 移行前の動画別記録 | 同じ保存領域の旧`timelines` | `readLatest`が新形式へコピーし、旧値は保全。新形式の行削除では旧コピーは消えない。現行の保全仕様であり、自動削除で対処しない |
| チーム一覧・ボタンセット名/アクション/ラベル・選択値・表示切替 | 同じ保存領域の`teams`、`buttonSets`、`selectedButtonSet`、`selectedAction`、`showExtension` | [popup](../popup.tsx)の保存処理。`buttonSets`には利用者がインポートしたJSONの検証済み内容も含む。旧版由来の別キーが残る可能性もある |
| パネル位置・サイズ（wide/narrow） | YouTube originの`localStorage`、`youCoder.panelLayout.v2`。旧配置キーも残り得る | [AnalysisWorkspace](../components/AnalysisWorkspace/index.tsx)と[layout](../components/AnalysisWorkspace/layout.ts)。動画ID・分析記録はこの保存処理に含まない。サイトと共有する領域で、拡張専用の秘密領域ではない |
| 現在の動画のチーム/アクション/時刻/ラベル | 利用者が出力するCSVファイル | [CSV生成](../lib/actionCsv.ts)と[ダウンロード](../lib/actionsManager.ts)。行ID・動画IDはCSVに含めない。平文ファイルで、式の無害化は暗号化ではない |
| 選択したボタンセット1個 | 利用者が出力するJSONファイル | [popup](../popup.tsx)の`handleJsonExport`。平文。チーム一覧・タイムラインは含まない |
| 動画ID・旧データを含む拡張ストレージ全体 | 上級者が手動でコピーするクリップボード/JSON | [退避手順](backup-restore.md)。自動送信・定期バックアップではない。アプリは暗号化せず、出力後の保存先・共有は把握しない |
| URL・エラー詳細・入力断片を含み得る診断情報 | ブラウザーのローカルコンソール。アプリ側で永続化/転送しない | [content](../content.tsx)、[popup](../popup.tsx)、[logger](../utils/errorHandling.ts)。開発限定debugと、本番でも残るwarn/error等を区別する。ログ保全やコピー先の保護は未確認 |

アプリがAPIへJSON値を渡すことと、物理ディスク全体が未暗号化であることは別です。ソース検査や合成MV3テストから、利用者のOS/ディスク/バックアップの暗号化状態までは判断できません。Chromeの保存領域の分離も暗号化の証明にはなりません。

## 公式文書が求めること

| 根拠 | 適用と、そこから断定できないこと |
| --- | --- |
| [Handling Requirements §2](https://developer.chrome.com/docs/webstore/program-policies/data-handling) | ユーザーデータを安全に扱い、転送時には現代的な暗号を使う要件。動画ID/記録/自由入力を扱うため対象。現行静的監査では開発者サーバー等への記録送信処理は見つかっていないが、それは保存時保護の合格を意味しない |
| [User Data FAQ Q3/Q14](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq) | 端末内だけの処理・保存でも開示とprivacy文書が必要。ローカルだからユーザーデータなし、とは扱わない |
| [同FAQ Q8/Q9](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq) | Q8は通信暗号化、Q9は保存時についても“stored at rest using a strong encryption method such as RSA or AES”と記載。保存時の要求を無視できない。一方、暗号化を実装する層、OSの暗号化の充足条件、利用者操作の平文エクスポートへの具体的適用はこの記載では定義されていない |
| [Storage API](https://developer.chrome.com/docs/extensions/reference/api/storage) / [Content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts) | 拡張ストレージは拡張のコンテキストから使い、content scriptも既定でアクセスできる。content scriptのJS実行環境はページと分離するが、Web Storageはサイトと共有する。これらの説明を、保存媒体の暗号化保証へ読み替えない |

## 不適合と未確認の区別

- **確認済みの実装事実**: 上表の永続化・エクスポートにはアプリ内暗号化がない。認証情報や決済情報を取得する機能はないが、記録が常に非個人情報であるとは限らない。
- **今回、確定していないこと**: この保存方式を理由とするStore不適合、未暗号化媒体への実保存、保存データの漏えい。任意の利用者環境での暗号化・端末アクセス制御を検査していないため、適合も不適合も一括判定しない。静的監査は全環境の通信/侵害検査ではない。
- **条件付きの不足**: ユーザーデータを保存する媒体・バックアップ等に強い保存時保護がなく、別の適用上の根拠も得られないなら、Q9を満たしたとは言えない。privacyに「暗号化なし」と書くことや本人の了承は、その代わりにならない。

## 最小の対応

1. 今回は曖昧だったリリース資料を本記録へ結び付け、判定を**保存時保護の適合根拠未確認**へ具体化する。現行privacyの暗号化未実装・サイト共有配置・平文出力の説明を維持する。今回の調査で再現した暗号化/漏えい不具合はなく、暗号化や新しい保存形式を即時追加する根拠は得られていない。
2. 提出判断までに、公開資料に基づくこの保存方式への要件の適用判断と根拠を記録する。Q9のローカル専用保存・利用者操作のCSV/JSON出力への適用、OS/保存先の保護で満たせる範囲を具体的に扱う。公開資料だけで解消できない点に限り正式照会を検討し、Googleの個別回答を一律の必須ゲートにしない。今回、問い合わせ送信はしていない。
3. その結果アプリ内保護が必要と確定した場合に限り、鍵を同じストレージに平置きするだけの暗号化や難読化を避け、鍵の管理・旧記録/バックアップの保全・復元・出力先まで含む最小設計を別変更で検証する。パスワード画面、全データ移行、クラウド保存、権限追加を今回の既定方針にしない。
4. 配置数値だけを理由に全記録を暗号化したり、`setAccessLevel(TRUSTED_CONTEXTS)`を単独で追加したりしない。後者はcontent scriptの設定読込/変更通知を壊し得るうえ、保存時暗号化にはならない。既存のデータ保全・CSV互換性を維持する。

公開資料だけで判断できない場合の照会論点（照会未実施）: Chrome storage.localへの動画ID・分析記録の端末内保存と、利用者が要求するCSV/JSON出力に対し、FAQ Q9を満たす保護の層・条件と平文出力の扱い。記録を開発者サーバーへ送信する処理が確認されていないことも前提に含める。

Store登録・掲載状態・発行主体は未確認です。送信先・権利の確認も完了していません。この検証では[提出経路](release-artifact-pipeline.md)の起動、main統合、Store送信、新しい認証情報/権限の設定は行っていません。
