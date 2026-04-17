## 打包项目并提供下载

### Context
用户需要完整项目包（含 .git），以便本地操作 git push/tag。

### Steps
1. `tar -czf /tmp/daomind-full.tar.gz -C /workspace --exclude=thread/node_modules --exclude=thread/dist --exclude=thread/.enter thread/`
2. `cp /tmp/daomind-full.tar.gz /workspace/thread/public/daomind-full.tar.gz`
3. 告知用户从预览 URL 下载：`https://<project-url>/daomind-full.tar.gz`

### Notes
- node_modules (275MB) 和 dist 排除，用户本地 `pnpm install` 即可还原
- .enter/plans 也排除（无关内容）
- 预计压缩后 ~10MB
