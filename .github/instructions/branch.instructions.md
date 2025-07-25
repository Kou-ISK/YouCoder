---
applyTo: "**"
---

- Git Flowに基づいて、以下のブランチ構成を採用してください：

  - `main`: プロダクションブランチ

    - 本番環境にリリースするための安定版コード
    - 直接コミットは禁止

  - `develop`: 開発用のメインブランチ

    - 次回リリースの開発を行うブランチ
    - 機能実装やバグ修正はここにマージ

  - `feature/*`: 新機能開発用のブランチ

    - developから分岐
    - 例：`feature/add-timeline`
    - 完了後はdevelopにマージ

  - `release/*`: リリース準備用のブランチ

    - developから分岐
    - 例：`release/v1.0.0`
    - バグ修正のみ許可
    - mainとdevelopの両方にマージ

  - `hotfix/*`: 緊急バグ修正用のブランチ
    - mainから分岐
    - 例：`hotfix/fix-critical-bug`
    - mainとdevelopの両方にマージ

- ブランチ名は以下の規則に従ってください：

  - すべて小文字を使用
  - 単語の区切りはハイフン（-）を使用
  - 機能や目的を簡潔に表現する名前を使用

- Pull Request（PR）作成時の注意点：

  - PRのタイトルは変更内容を簡潔に説明
  - PRの説明はテンプレートに準拠する
    - ドキュメントなど、テストを伴わない変更時にはテストに「なし」と記載
    - 関連するissueがない場合は「なし」と記載
  - レビュー前にセルフレビューを実施
  - コンフリクトは作成者が解決

- マージ戦略：

  - `feature/*` → `develop`: スカッシュマージ
  - `release/*` → `main`: マージコミットを作成
  - `release/*` → `develop`: マージコミットを作成
  - `hotfix/*` → `main`: マージコミットを作成
  - `hotfix/*` → `develop`: マージコミットを作成

- バージョン管理：

  - リリース時にはセマンティックバージョニングを使用
  - releaseブランチ作成時にバージョンを更新
  - タグ付けはリリース時に`v1.0.0`の形式で行う

- ブランチ削除：

  - マージ完了後は作業ブランチを削除
  - リモートブランチも適切に削除
  - release/hotfixブランチは全環境へのデプロイ完了後に削除

- その他のガイドライン：

  - feature開発は必ず最新のdevelopから分岐
  - release作成後は新機能の追加は禁止
  - hotfix は緊急時以外は使用しない
  - 長期開発のfeatureは定期的にdevelopの変更を取り込む

- コミットメッセージの規則：
  - 簡潔に変更内容を表現
  - 以下のprefixを使用：
    - `feat: `: 新しい機能
    - `fix: `: バグの修正
    - `docs: `: ドキュメントのみの変更
    - `style: `: 空白、フォーマット、セミコロン追加など
    - `refactor: `: 仕様に影響がないコード改善(リファクタ)
    - `perf: `: パフォーマンス向上関連
    - `test: `: テスト関連
    - `chore: `: ビルド、補助ツール、ライブラリ関連
  - 例：`feat: 〇〇なため、△△を追加`
