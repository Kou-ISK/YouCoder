---
applyTo: "/**/*.tsx"
---

- クラスコンポーネントではなく、関数コンポーネントとフックを使ってください。
- props は TypeScript の interface または で定義してください。
- スタイリングにはtailwind CSSを使用してください。
- JSX 内ではロジックを複雑にしすぎず、必要であれば関数に切り出してください。
- コンポーネントは小さく保ち、再利用可能な部品として設計してください。
- コンポーネントの命名は PascalCase を使用してください。
- コンポーネントのファイル名はコンポーネント名と同じにしてください。
- typeはまとめて `types/` ディレクトリに定義してください。
