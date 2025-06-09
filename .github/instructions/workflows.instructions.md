---
applyTo: ".github/workflows/**"
---

- GitHub Actionsのワークフローは、`.github/workflows/` ディレクトリに配置してください。
- ワークフローのファイル名は、機能や目的を明確に示す名前にしてください。
- ワークフローのnameは、英語で簡潔に何をするかを表現してください。
- ワークフローのdescriptionは、何をするかを具体的に記述してください。
- Git Flowに基づいて、アクションのトリガーは以下のように設定してください：
  - `push` イベントは、`main`、`develop`、および `feature/*` ブランチに対してトリガーされるように設定してください。
  - `pull_request` イベントは、`main`、`release`、`hotfix`および `develop` ブランチに対してトリガーされるように設定してください。
