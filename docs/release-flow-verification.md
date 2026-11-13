# PR13後の利用フロー検証

2026-10-12。基点develop: `2f6026478266d5a2b1d234c9d03ae3b33c34639b`。追加作業は [PR14](https://github.com/Kou-ISK/YouCoder/pull/14) で独立コード・最終画像レビューを完了し、`83a0d3578978c0fae9f955c5260f1a44d68b86de` でdevelopへ統合済みです。

最終head `b228354ea57c0193f771eaebf5b18b04a488fa2b` の[Test CI](https://github.com/Kou-ISK/YouCoder/actions/runs/38210094974)（389単体・型・build）、[MV3 CI](https://github.com/Kou-ISK/YouCoder/actions/runs/38210094906)（合成35項目）と[マージ後MV3 CI](https://github.com/Kou-ISK/YouCoder/actions/runs/38210608262)は成功。レビュー対象とmergeのファイルツリーは同一です。以下の初回失敗と途中headの結果は履歴として残します。実YouTubeのBLOCKEDは継続しています。

## 初回の結果と修正

初回head `6b64e12` の[Test CI](https://github.com/Kou-ISK/YouCoder/actions/runs/38207673326)は389単体テスト・型・build・bundle監査・ZIP作成が成功。[MV3 CI](https://github.com/Kou-ISK/YouCoder/actions/runs/38207673288)では既存25項目に加え、追加9項目中8項目が成功しました。

375pxの通常クリックでは、削除確認ボタンへの入力を固定表ヘッダーが遮る不具合を検出しました（FAIL）。フィルターが縦に並んで表が狭くなるため、フィルターの折り返し、表の最低表示高さ、パネルの最低高さを修正しました。無理なクリック強制で合格にはしていません。

さらに、パネル移動/サイズ変更時の隣パネル調整、古い重複配置の補正、削除ボタン常時表示、通知のポインター透過を実装しました。空きがない操作は直前の配置を維持します。ドラッグ中のプレビューは一時的に重なり得ます。

修正版 `188f046d11b1370cf1a8c887945e8a40df5108e4` の[Test CI](https://github.com/Kou-ISK/YouCoder/actions/runs/38208180940)と[MV3 CI](https://github.com/Kou-ISK/YouCoder/actions/runs/38208180921)は成功。合成35項目（既存25＋experience 9＋大容量更新1）がPASS。公開動画への再アクセスは行っていません。

## 確認範囲

独立画像レビュー（artifact `11729070672`）で時刻の隣列への重なり、通知によるフィルター文字の遮蔽、狭幅のタグ付け案内の欠けを検出しました。PR14内で時刻列を固定幅にし、通知を表の上の専用行へ移動、案内の折り返しと縦スクロールを修正しています。追加MV3検査はセル内の文字範囲、横スクロール後の終了時刻の可視範囲、通知と操作部の非重複、320/375pxで案内全文に到達できることを測定します。`panels-after-move.png` とStore画像は通知が消えた後に取得し、狭幅では通知中・案内・時刻・操作の画像を分けて保存します。修正版の最終head・CI・画像レビュー状況はPR本文を参照してください。

| 項目 | 状態・意味 |
| --- | --- |
| 通常クリックによる並び替え後の削除 | 初回PASS。forceを使用しない |
| パネル移動・サイズ変更・再読込後の相互重なり | 初回PASS。操作可能な最低サイズを保つ |
| 375/320pxのタグ付け・フィルター・横スクロール・削除・CSV | 初回375pxでFAIL。修正版188f046で375/320pxともPASS（通常クリック・横スクロール） |
| 動画要素交換＋A/B切替、開始中のタグ付け継続 | 初回PASS。合成のyt-navigateイベントであり、実YouTube SPAではない |
| JSON設定の新規プロファイル復元・上書きキャンセル・不正JSON拒否 | 初回PASS。製品のインポートUIを使用 |
| 全storageの新規プロファイル復元・永続ID維持・編集継続 | 初回PASS。拡張機能APIによる上級者向け手順で、復元UIではない |
| storage権限のみで10,000行、実容量上限拒否・データ保持・復旧 | 初回PASS。1,126,712 bytes / quota 10,485,760 bytes |
| 旧unlimitedStorageで10MB超のプロファイルを更新 | 188f046でPASS。11,267,065 bytes / 100,000行を保持し、超過中の書込を拒否、整理後に復旧。旧版と新版を同じ一時ロード先で切替 |
| worker/browser再起動、旧ID、旧形式移行、複数タブ、保存失敗、CSV | 既存25項目は初回もPASS |
| 実YouTube | 今回もbot確認でBLOCKED。字幕・広告・全画面・実SPA等はNOT RUN |

公式GitHub Actions Ubuntu 22.04、Playwright 1.64.0、Chromium/CfT 156.0.8078.4、通常sandboxを使用。Cloud内の `/usr/bin/chromium` はSUID sandbox helper設定で起動不能でした。sandbox、TLS、ネットワーク制限、bot確認を解除していません。

## 証拠と配布候補

CIは生成データのJSON/PNG/CSV、head、bundle監査、配布候補ZIPとSHA256を保存します。ZIPは既存の提出workflowを使わず作成し、React/React DOM/Scheduler/Plasmo/Parcel runtimeのライセンス本文を同梱します。artifact保持は7日です。最終head・CI・artifactはPR本文を正本として記録します。

Store草案画像は実際の拡張UIをタイムライン1280×800・設定640×400で撮影したものです。タイムライン画像に「デモデータ / 合成ページ」を明示し、実YouTubeの検証証拠に流用しません。[最終画像artifact](https://github.com/Kou-ISK/YouCoder/actions/runs/38210094906/artifacts/11729072739)の独立目視レビューで、時刻列・通知・狭幅案内の修正を確認済みです。完了記録は[PR14](https://github.com/Kou-ISK/YouCoder/pull/14)にあります。

[Store画像の公式要件](https://developer.chrome.com/docs/webstore/images)に合わせた画面草案であり、既存仮アイコンの採用判断や440×280の必須プロモーション画像は別途残ります。旧画像・記録は履歴として維持し、最新の成果物と混同しません。

## 公開前に残る条件

実サイトの正常再生・字幕/広告/全画面/シアター/実SPA確認、最終branding素材、privacy/データ申告の発行者確認、保存時保護の方針、容量超過ユーザーへの更新案内、最終version/ZIP/素材権利の確認が必要です。[確定事実と未決事項](release-decisions.md)を参照してください。テスト成功だけを根拠に公開しません。新料金・契約・権限拡大・認証移送は行っていません。
