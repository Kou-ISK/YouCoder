# YouCoder - YouTubeスポーツ映像タグ付けツール

YouCoderは、YouTubeでスポーツ映像を視聴しながらリアルタイムでアクションにタグ付けができるChrome拡張機能です。  
スポーツコーチ、アナリスト、指導者向けに設計され、効率的な映像分析とデータ収集を可能にします。

## 主な特徴

- **リアルタイムタグ付け**: YouTube再生中にワンクリックでアクションとラベルを記録
- **カスタマイズ可能なボタンセット**: スポーツやチームに応じてボタンをカスタマイズ
- **カテゴリ化されたラベル機能**: ラベルをカテゴリ別に整理して詳細な分析が可能
- **高度なCSV出力**: カテゴリごとに列を分けたExcel解析に適した形式で出力
- **タイムラインナビゲーション**: 記録したアクションをクリックして動画の該当箇所にジャンプ
- **JSON設定共有**: ボタンセット設定を他のユーザーと簡単に共有
- **Plasmo + React**: モダンな技術スタックによる高速で安定した動作
- **Chrome Manifest V3完全対応**: 最新のブラウザセキュリティ基準に準拠

## デモ

🚧 デモは準備中です！  
_(UIが完成次第、スクリーンショットやアニメーションGIFを追加予定です。)_

## インストール

プロジェクトをローカルでセットアップするには：

```bash
git clone https://github.com/Kou-ISK/YouCoder.git
cd YouCoder
pnpm install
```

## 開発

開発サーバーを起動するには：

```bash
pnpm dev
# または
npm run dev
```

Chrome で開発版をロードするには：

```text
1. Chrome を開き、chrome://extensions にアクセス
2. 開発者モードを有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. build/chrome-mv3-dev ディレクトリを選択
```

## プロジェクト構成

```text
YouCoder/
├── public/                # 静的ファイル（アイコンなど）
├── popup.tsx             # ツールバーアイコン押下で表示されるUI
├── options.tsx           # オプション設定ページ
├── background.ts         # 拡張のバックグラウンド処理
├── content/
│   ├── content.tsx      # YouTubeページに挿入されるタグ付けUI
│   ├── lib/            # 共通ロジック、ユーティリティなど
│   └── styles/         # スタイルファイル
├── components/          # 再利用可能なReactコンポーネント
│   ├── ActionButton/
│   ├── LabelButton/
│   ├── Modal/
│   ├── Popup/
│   ├── TaggingPanel/
│   └── TimelinePanel/
├── lib/                 # ユーティリティ関数とサービス
├── styles/             # グローバルスタイル
├── types/              # TypeScript型定義
├── docs/               # プロジェクトドキュメント
├── .plasmo/           # Plasmo設定
├── tsconfig.json      # TypeScript設定
└── package.json       # プロジェクトメタデータと依存関係
```

## 使用技術

- [Plasmo](https://docs.plasmo.com/)
- React
- TypeScript
- pnpm
- Chrome Extension (Manifest V3)
