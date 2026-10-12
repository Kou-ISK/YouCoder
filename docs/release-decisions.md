# 公開前の未決事項と候補手順

2026-10-12。対象はdevelop `83a0d3578978c0fae9f955c5260f1a44d68b86de`。PR14のCI・独立コード/画像レビューは[完了済み](release-checklist.md)。この文書はStore提出・公開の承認ではありません。

## mainだけの1コミット

- main `52c0bd144a796c2d6b1b6315f2319d4437652599` と対象developの比較はdevelop側88コミット、main側1コミット。
- main側の1件は [PR4のマージコミット](https://github.com/Kou-ISK/YouCoder/commit/52c0bd144a796c2d6b1b6315f2319d4437652599)。第2親 `cf2a08ad81e51f0cf440c5e4ca91f0c3610595f5` とファイルツリーが一致し、その親は現在のdevelopの祖先に含まれる。
- `git merge-tree --write-tree origin/develop origin/main` の結果もdevelopのtree `aa01db2fc69ac4db2ac8b44609f806c6de0d697f` と一致し、競合なし。main独自の未反映コードはなく、追加のcherry-pickや同期のためのコード修正は不要。
- 将来のrelease→mainは[Git Flow手順](../.github/instructions/branch.instructions.md)の通常マージで履歴を含められる。今回main/developの同期マージ・履歴書換え・release作成は行わない。コミット数は上記SHA時点の値。

## 確定できる事実と、本人が決める事項

| 項目 | リポジトリ・既存証拠から確定 | 発行者の判断・未取得情報 |
| --- | --- | --- |
| identity / 公開主体 | [package.json](../package.json)の作者はKou Isaka (Kou-ISK)、名称はYouCoder、サポート候補はGitHub Issues | Storeの公開主体/開発者アカウント、連絡先、登録状態、価格・配布地域。packageのauthorから法的名義・登録完了は判断しない。個人メール/住所はrepoに書かない |
| privacy | [草案](privacy.md)に保存項目・YouTubeと共有する配置保存・暗号化未実装・残るローカルログを記載。権限はstorageとYouTube host。[候補URL](https://github.com/Kou-ISK/YouCoder/blob/develop/docs/privacy.md)はログインなしで本文閲覧を確認済み | 正式文面/URL、Storeデータ分類、Limited Use等の運用上の約束、保存時保護の方針と要件との整合。草案を適合性認証や本人の宣言として扱わない |
| branding | [現行icon](../assets/icon.png)は既存仮素材。PR14の合成UI画像は独立目視済み | 仮アイコンの採用/置換、440×280プロモーション画像、素材利用権、最終掲載画像/文面の選定。実YouTube未検証の保証表現は追加しない |
| version / 配布物 | 次の候補版を0.0.2に選定。[提出経路](release-artifact-pipeline.md)でCIの実checkout commit/tree・版・内部ZIPのhashを記録し、そのバイト列だけを検証して渡す | Storeの既存版/掲載状態、リリース時期、素材権利。版番号・target commit・ZIP照合は技術手順で確定し、本人に推測を求めない |
| quota更新説明 | 10,485,760 bytes超の旧記録保持・退避、書込拒否、整理後復旧は検証済み。[0.0.2更新案内](release-notes-0.0.2.md)にバックアップ/容量確認、UI削除も失敗し得る点、新規空プロファイル限定復元、全体/分割復元UIなしを具体化 | 実際の告知・配布時期。技術的な挙動の説明文は作成済み |

## 実サイト検証の状態

公開動画は[既存観測](https://github.com/Kou-ISK/YouCoder/actions/runs/38207673288)でHTTP200ながらbot確認・readyState0でした。実SPA、全画面/シアター出入り、字幕、リサイズ/小画面、広告非遮蔽は **BLOCKED / NOT RUN** のままです。

今回確認できたCloudのローカルChromiumは以前と同じ154.0.8037.57で、既存記録ではSUID sandboxの起動制約があります。正常sandboxで動く既存GitHub CIでは合成MV3を検証済みですが、実YouTubeは上記の状態です。別の許可済み再生環境や制約が解消した根拠は得られていないため、同一の実サイト試行は繰り返していません。別環境が明示的に利用可能になるまで未確認を残し、Macへの差戻し・ログイン・bot確認回避・広告操作・動画DLは行いません。

## 候補手順（未実行）

1. 発行者が上表の公開主体/連絡先、privacyの宣言、branding/素材権利、配布条件を確認する。技術的な版・対象commit・ZIP検証とquota文面は[提出経路](release-artifact-pipeline.md)と[更新案内](release-notes-0.0.2.md)を使う。
2. 正常再生可能な許可済み環境を利用できる場合だけ、最小の公開動画で残る実YouTube項目を検証し、環境/head/viewport/結果を記録する。利用できなければBLOCKEDを維持する。
3. 公開条件が揃ったら最新developからreleaseブランチを作り、0.0.2候補に必要な最終文書・素材を反映。Node22 / pnpm9.15.9 / frozen lockでそのPR headのCIを実行し、生成された同一ZIPをレビューする。commitや素材が変われば新候補として検証する。
4. レビュー対象をmainへ通常マージし、同じファイルツリーであることを確認して[submit.yml](../.github/workflows/submit.yml)の検証経路へ渡す。提出側で再buildせず、成功run/commit/版/hash/ライセンス/監査を照合する。公開処理は別途の送信承認まで起動しない。契約・権限変更は行わない。

CI artifactは2026-10-19に保持期限を迎えるため、必要な生成データの画像/記録と承認対象ZIPは期限前に許可された保管先へ保存する。別版の再生成物で過去の承認を代替しない。
