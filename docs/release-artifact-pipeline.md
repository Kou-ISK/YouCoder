# レビュー済みZIPの提出経路

この変更の候補版は **0.0.2**。対象は、変更を含む最終PR headをTest CIが実際にcheckoutしたcommitです。固定値はartifact内の `candidate.json` の `source_commit` / `source_tree` / `version` / `sha256` に記録します。動くブランチ名や別の再buildを承認対象にしません。Store公開・契約・権利の承認はこの技術的な検証とは別です。

## 作成とレビュー

[Test CI](../.github/workflows/test.yml)はNode22 / pnpm9.15.9 / frozen lockでPR headを検証し、build → runtimeライセンス同梱 → bundle監査 → ZIP作成 → ZIP内部の照合を行います。`youcoder-candidate` artifactには次の4ファイルだけを保存します。

- `chrome-mv3-prod.zip`: 実際にレビュー・提出するバイト列。
- `chrome-mv3-prod.zip.sha256`: この内部ZIPのSHA256。Actionsの外側artifactのdigestとは別。
- `bundle-audit.json`: ZIP内の全ファイルのサイズ/ハッシュ、manifest、静的監査結果。
- `candidate.json`: source commit/tree、版、producer run/attempt、ZIP/監査/ライセンスのハッシュ。

レビュー記録にproducer run ID、artifact ID、`source_commit`、内部ZIPのSHA256を残します。これらは成功したCIの具体値から決まり、発行者に版番号や対象commitを推測してもらう項目ではありません。新しいcommit・版・ZIPを作れば、別候補としてCIとレビューをやり直します。保持期限切れの場合も、以前の承認を再生成ZIPへ流用しません。

## 提出workflowの検証

[submit.yml](../.github/workflows/submit.yml)は手動起動のみ、mainからのみ実行します。`publish` の初期値はfalseです。入力は上記のrun ID、artifact ID、全桁commit SHA、内部ZIPのSHA256です。版はmainのpackage.jsonと候補manifest/metadataから照合するため、手入力の版指定はありません。

1. 同じrepoの成功したTest PR runであること、forkではないこと、artifactが当該run/headに属し未失効であることを確認。
2. そのartifact IDだけを一時領域へ取得。mainが対象commitを含み、対象と同じファイルツリーであることを確認。異なるmainで古い候補を出す操作は拒否。
3. ZIPのSHA256、版、run attempt、全ファイルの監査ハッシュ、lockfile由来のライセンス本文を照合。安全な一時ディレクトリへ展開して、信頼するrepo側のbundle監査を再実行。ZIP内のコードは実行しない。
4. ZIPを変更せず検証済みパスへコピーし、受渡し後とpublisher直前に再ハッシュ。検証失敗・改変・欠落は処理を停止し、publisherを実行しない。
5. `publish=false` は検証receiptの保存まで。別途公開条件と送信が承認された場合だけ `publish=true` で、検証済みパスの同じZIPを既存のBPP actionへ渡す。提出側ではbuild/packageを実行しない。

既存の `GITHUB_TOKEN` でmetadata/artifactを読む構成で、権限設定やsecretは追加・変更していません。別runのダウンロードにはActions readが必要です。既存tokenで読めなければ停止し、別tokenや権限変更で自動的に進めません。`SUBMIT_KEYS` は既存publisher stepだけで参照します。この変更の検証ではsubmit workflowとpublisherを起動しません。

仕組みは[公式download-artifactの入力](https://github.com/actions/download-artifact/tree/v4)、[GitHub artifact API](https://docs.github.com/en/rest/actions/artifacts)、[BPPのartifact指定](https://github.com/PlasmoHQ/bpp#action-input-parameters-with)に基づきます。

## 確認範囲と残る事実

生成fixtureで正常な同一バイト列の受渡し、改変ZIP、別commit/tree/版、期限切れ/別run/fork/失敗CI、ライセンス欠落、監査不一致、権限増加、危険なZIPパス、publisher直前の改変を検査します。workflowの公開opt-in・main制限・再build不在も検査します。これらはStoreへの実送信や実YouTubeの合格ではありません。

0.0.2はrepo上の0.0.1から次のpatch候補として選定しました。Storeの既存版・掲載状態は未取得です。公開前にそれが0.0.2以上と判明した場合は、技術的に次の未使用版へ更新して新候補を生成・再検証します。publisher/contact、privacyの運用上の宣言、素材の利用権と掲載条件は不明な事実・本人の約束として別途確認します。実YouTubeのBLOCKEDも継続します。

更新時に掲載する技術的な案内は[0.0.2更新案内](release-notes-0.0.2.md)を使用します。quotaの挙動や復元機能の制限を発行者任せの未決事項にはしません。
