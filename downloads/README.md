# ビルド済み配布物

**[YouCoder 0.0.2 をダウンロード](youcoder-0.0.2-chrome.zip?raw=true)** · [初めて使う方の導入・更新手順](../docs/install-from-github.md)

デスクトップ版Chromeで読み込む試用版です。ZIPを展開し、`manifest.json` が直接入っているフォルダを読み込んでください。Node.jsやビルドは不要です。リポジトリ内の固定ファイルなので、GitHub Actionsの成果物保持期限に依存しません。

## このZIPの出所

| 項目 | 値 |
| --- | --- |
| 版 | 0.0.2 |
| ソース | [`824ea30806ac602980bdba60c6ef928588ef4f82`](https://github.com/Kou-ISK/YouCoder/tree/824ea30806ac602980bdba60c6ef928588ef4f82) |
| ソースtree | `5cacc63b145ae6c93fbb0d922458d490ec9026ad` |
| 生成元 | [Test CI 38320354827 / attempt 1](https://github.com/Kou-ISK/YouCoder/actions/runs/38320354827) の `youcoder-candidate`（artifact `11778043034`） |
| ZIP SHA256 | `5edd2244ac485bde0fe53c19df2d7a1995f2d98a6fb785534ded3d0d8e7311c1` |
| 権限 | `storage`、`https://www.youtube.com/*` |

CI内の `chrome-mv3-prod.zip` と**同じバイト列**を、分かりやすいファイル名にして保存しています。再ビルド・再圧縮はしていません。同梱の `THIRD_PARTY_NOTICES.txt` も維持しています。[配布メタデータ](youcoder-0.0.2.provenance.json)、[ファイル別監査](youcoder-0.0.2.bundle-audit.json)、[SHA256ファイル](youcoder-0.0.2-chrome.zip.sha256)を照合できます。SHA256は一致確認用で、Store審査やコード署名を意味しません。

このZIPは上記コミットの固定版です。`develop` の将来の変更が自動でZIPへ反映されることはありません。更新する際は新しい版の配布記録と手順を確認してください。

## 検証結果

- [Test CI](https://github.com/Kou-ISK/YouCoder/actions/runs/38320354827): 単体389件、候補ゲート14件、型検査、production build、ライセンス・bundle監査・packageが成功。
- [MV3 CI](https://github.com/Kou-ISK/YouCoder/actions/runs/38320354833): 合成35件が成功。実際の拡張runtime/storageを使い、動画別保存、書き込み失敗時の表示・保全、CSV、ボタンセットJSON、再起動、320/375px操作などを検証。
- ローカルで配布ZIP全体、監査JSON、監査対象の全内部ファイルのSHA256一致を確認。
- **実YouTube検証は未完了**。上記CIは実YouTubeをSKIPPEDとしており、実サイトのSPA・字幕・広告・全画面や、このZIPのMac操作確認の代わりにはしません。

記録はChromeプロファイル内に保存されます。自動更新・クラウド同期・全データ復元UIはありません。導入・更新前に[保存とバックアップの制約](../docs/install-from-github.md)を確認してください。
