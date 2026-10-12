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
| version / 配布物 | 現行versionは0.0.1。PR14の[Test CI](https://github.com/Kou-ISK/YouCoder/actions/runs/38210094974)がライセンス同梱・bundle監査・候補ZIP/内部ZIPのSHA256を生成 | 公開版番号、公開対象commit、リリース時期、最終ZIPとその権利確認。Store上の既存version/掲載状態は未取得のため、0.0.1をそのまま提出可能とは判断しない |
| quota更新説明 | 10,485,760 bytes超の旧記録の保持・退避、超過中の書込拒否、生成データ整理後の復旧は実MV3で確認済み | 更新前バックアップ/容量確認/整理の案内と告知方法。[復元手順](backup-restore.md)の新規空プロファイル限定、全体復元/分割復元UIなし、自動削除なしを掲載説明に反映 |

## 実サイト検証の状態

公開動画は[既存観測](https://github.com/Kou-ISK/YouCoder/actions/runs/38207673288)でHTTP200ながらbot確認・readyState0でした。実SPA、全画面/シアター出入り、字幕、リサイズ/小画面、広告非遮蔽は **BLOCKED / NOT RUN** のままです。

今回確認できたCloudのローカルChromiumは以前と同じ154.0.8037.57で、既存記録ではSUID sandboxの起動制約があります。正常sandboxで動く既存GitHub CIでは合成MV3を検証済みですが、実YouTubeは上記の状態です。別の許可済み再生環境や制約が解消した根拠は得られていないため、同一の実サイト試行は繰り返していません。別環境が明示的に利用可能になるまで未確認を残し、Macへの差戻し・ログイン・bot確認回避・広告操作・動画DLは行いません。

## 候補手順（未実行）

1. 発行者が上表の公開主体/連絡先、privacyの宣言、branding、版番号/配布条件、容量超過の案内を確定する。
2. 正常再生可能な許可済み環境を利用できる場合だけ、最小の公開動画で残る実YouTube項目を検証し、環境/head/viewport/結果を記録する。利用できなければBLOCKEDを維持する。
3. 公開条件が揃ったら最新developからreleaseブランチを作り、確定した版番号・文書・素材を反映。Node22 / pnpm9.15.9 / frozen lockでCIを実行し、最終ZIP・manifest・ライセンス/素材権利・内部ZIPのSHA256を確認する。
4. 提出前に、レビュー済みZIPと実際の提出物が一致する経路を確定する。[現行submit.yml](../.github/workflows/submit.yml)は再buildして公開処理を呼ぶ一方、Test CIのライセンス同梱スクリプト・bundle監査・承認ZIPのハッシュ照合は含まない。この差を解消/確認せずに実行しない。Storeへの送信、契約、料金、権限付与はこの整理では行わない。

CI artifactは2026-10-19に保持期限を迎えるため、必要な生成データの画像/記録と承認対象ZIPは期限前に許可された保管先へ保存する。別版の再生成物で過去の承認を代替しない。
