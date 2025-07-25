# YouCoder 要件定義書

## 1. プロジェクト概要

YouTubeの映像を視聴しながらスポーツ分析のための「アクション」と「ラベル」タグ付けを行うChrome拡張機能。

## 2. 目的

- スポーツの映像分析における手作業の効率化
- アクションの発生タイミングとラベル情報の正確な記録
- 分析データの再利用可能な形式での保存と共有

## 3. 対象ユーザー

- スポーツコーチ
- トレーナー
- 映像分析担当者
- チームアナリスト

## 4. 技術スタック

- **フレームワーク**: Plasmo, React
- **言語**: TypeScript
- **スタイル**: Tailwind CSS
- **データ保存**:
  - ローカル: Chrome Storage API (JSON)
  - エクスポート: CSV, Google Sheets API
- **開発環境**:
  - パッケージマネージャー: pnpm
  - テスト: Jest
  - コード品質: ESLint, Prettier

## 5. 機能要件

### 5.1 映像上UI

- アクションボタン

  - ユーザー定義可能な複数のアクションボタン
  - 押下でアクション開始／終了のタイムスタンプを記録
  - アクション進行中の視覚的フィードバック
  - 同時に複数のアクションを記録可能

- ラベルボタン

  - アクション中に関連ラベルを付与
  - カテゴリ別のグループ化
  - 1つのアクションに複数ラベル付与可能

- UIレイアウト
  - チーム単位でのボタングループ化
  - ドラッグ可能な表示位置
  - 表示/非表示の切り替え
  - モバイルフレンドリーなレスポンシブデザイン

### 5.2 データ記録

- アクションデータ構造

  - タイムスタンプ（start/end、ミリ秒単位）
  - アクション種別
  - 関連ラベル情報

- ラベル形式

  - シンプル形式: `string[]`
  - カテゴリ形式: `Record<string, string[]>`
  - 両形式の後方互換性サポート

- 保存タイミング
  - アクション終了時の自動保存
  - 定期的なバックアップ保存
  - エクスポート時の手動保存

### 5.3 出力形式

- タイムラインパネル表示

  - アクション一覧の表形式表示
  - カテゴリ化ラベルの`[カテゴリ] 値`形式表示
  - クリックで該当シーンへジャンプ

- CSVエクスポート

  - カテゴリ別の列出力
  - ヘッダー: `Team,Action,Start,End,[カテゴリ1],[カテゴリ2],...`
  - タイムスタンプ付きファイル名
  - カテゴリのアルファベット順ソート
  - 未使用カテゴリは空セルで出力

- Google Sheets連携
  - OAuth2.0認証
  - 1アクション1行形式
  - 自動同期オプション

### 5.4 設定管理

- ボタンセット管理

  - チームの追加/削除
  - アクション/ラベルの追加/編集/削除
  - JSONインポート/エクスポート
  - プリセットの提供（サッカー、バスケ、テニスなど）

- カテゴリ管理

  - カテゴリの追加/編集/削除
  - ラベルのカテゴリ割り当て
  - カテゴリ順序のカスタマイズ

- 設定の永続化
  - Chrome Storage APIによる保存
  - 設定変更の即時反映
  - 設定のバックアップ/リストア

## 6. 非機能要件

### 6.1 パフォーマンス

- YouTube再生への影響を最小限に抑制
- スムーズなUI操作感
- 大量データ処理時の応答性維持

### 6.2 信頼性

- データの自動バックアップ
- エラー発生時の適切なフィードバック
- 不正な操作の防止

### 6.3 セキュリティ

- 適切な権限管理
- 安全なデータ保存
- セキュアな通信

### 6.4 保守性

- モジュール化された構造
- 適切なドキュメント
- テストカバレッジの確保

## 7. 将来的な拡張

### 7.1 優先度高

- タイムライン再生機能
- ホットキーカスタマイズ
- データ分析ダッシュボード

### 7.2 検討中

- チーム間でのデータ共有
- AIによる自動タグ付け
- モバイルアプリ連携
