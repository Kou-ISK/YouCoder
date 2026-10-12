# 公開前チェックリスト

2026-10-12。PR12/13/14はdevelopへ統合済み。PR14のmergeは [`83a0d357`](https://github.com/Kou-ISK/YouCoder/commit/83a0d3578978c0fae9f955c5260f1a44d68b86de)。[追加検証記録](release-flow-verification.md)と[公開前の未決事項・候補手順](release-decisions.md)を参照してください。公開済み・Store承認済みを意味しません。

## 準備済み

- [x] 作者・説明をKou Isaka (Kou-ISK) / YouCoderに整理。新しい個人メール・住所は追加しない。以後のGit commitは本人のGitHub noreplyを使用。
- [x] Sheets試作と専用依存を削除し、[データフロー](data-flow-audit.md)・[privacy](privacy.md)・[Store申告草案](store-listing-draft.md)を用意。
- [x] [導入](../README.md)と[バックアップ・容量・復元手順](backup-restore.md)を整備。全データ復元UIは未提供と明記。
- [x] パネル同士の重なりを補正し、空きがなければ安全な配置を保持。通常クリックでの並び替え後削除を実MV3で確認。
- [x] 設定JSONを新規プロファイルへ復元、上書きキャンセル、不正JSON拒否を実MV3で確認。
- [x] 合成SPAの動画要素交換、A/B別記録と開始中のタグ付け継続を確認。実YouTube SPAとは区別。
- [x] `unlimitedStorage` を削除。10,000行の容量とChromeの実quota拒否・データ保持・復旧を確認。popupの設定値ログは開発時限定へ変更。
- [x] 389単体テスト、型、production build、既存25 MV3項目、bundle監査を確認。ZIPと第三者ライセンス・SHA256をCIで生成する。
- [x] 1280×800（タイムライン）・640×400（設定）のStore画面草案をCI artifactに作成。デモデータ/合成ページを明示し、実YouTubeの証拠にしない。

## 最終確認

- [x] PR14最終head `b228354` の[Test CI](https://github.com/Kou-ISK/YouCoder/actions/runs/38210094974)（389単体・型・build）と[MV3 CI](https://github.com/Kou-ISK/YouCoder/actions/runs/38210094906)（合成35項目）が成功。追加狭幅・旧10MB超更新・手順そのものの復元を含み、[PR本文](https://github.com/Kou-ISK/YouCoder/pull/14)に結果とartifactを記録済み。[マージ後MV3 CI](https://github.com/Kou-ISK/YouCoder/actions/runs/38210608262)も成功。Test workflowはPR時のみ起動する設定。
- [x] 初回375pxで再現した固定ヘッダーによる削除確認ボタン遮蔽を修正し、375/320pxの通常操作を再検証。旧10MB超プロファイルの記録保持も確認。
- [x] `b228354` の独立コード・最終画像レビューが完了し、blockingなし。[PR14の完了記録](https://github.com/Kou-ISK/YouCoder/pull/14)と[最終画像artifact](https://github.com/Kou-ISK/YouCoder/actions/runs/38210094906/artifacts/11729072739)を参照。時刻列、通知、320/375pxの案内の指摘を修正済み。最終branding素材の選定・確認は別途残す。
- [ ] **実YouTube: BLOCKED**。今回も公開動画はbot確認で再生不可。実再生、通常操作、SPA A→B→A、全画面・シアター、字幕、リサイズ、小画面、広告を覆わないことは未確認。正常な許可済み環境で最小限の公開動画により確認する。ログイン、広告除去/クリック、動画ダウンロード、制限回避は行わない。
- [x] 10MB超データを持つ旧利用者向けの[0.0.2更新案内](release-notes-0.0.2.md)を作成。保存/編集やUI削除が拒否され得ること、バックアップ・容量整理、復元UIの制限、自動削除なしを明記。実際の配布/告知は未実施。
- [ ] 全データ復元UI、既存環境へのマージ、容量超過時の分割復元は未提供。これらを提供済みと宣伝しない。
- [ ] サイトと共有する配置保存、保存時暗号化がないこと、残るエラーログを含め、privacyと公開時保護要件の整合を確認する。
- [ ] 発行者がStoreのデータ分類・Limited Use認証を最終確認し、privacy文書を正式版にする。[現在の候補URL](https://github.com/Kou-ISK/YouCoder/blob/develop/docs/privacy.md)はログインなしで本文を読めることを2026-10-12に確認済みだが、内容は公開前草案。正式URLと最終文面の採用は未決。
- [ ] 既存のPlasmo仮アイコンをそのまま公開するか独自アイコンへ替えるか確定し、440×280必須プロモーション画像を用意する。PR14のUI画面は目視済み。最終branding素材を組み合わせた掲載内容の確認は残す。
- [ ] 0.0.2候補の最終ZIP・素材権利と配布条件をレビューする。[提出経路](release-artifact-pipeline.md)はCIの正確なcommit/tree、版、内部ZIPのhashと監査を照合し、提出側で再buildしない。Store上の既存版/掲載状態は未取得で、公開リリースではない。
- [ ] 新料金・契約・権限拡大・認証移送が必要なら別承認を得る。`Submit reviewed Web Store artifact` はpublish=falseを初期値とし、既存tokenでartifactが読めなければ停止する。この検証ではsubmit workflow/公開処理を実行しない。

画像artifactの保持期限は7日です。head、browser版、viewport、PASS/FAIL/BLOCKED/NOT RUNを記録し、生成データのJSON/PNG/CSVだけを保存します。実ユーザープロファイル、秘密情報、履歴を含めません。旧forced-click試験はID保持の証拠として残し、通常操作の合格は追加のforceなし試験で判断します。
