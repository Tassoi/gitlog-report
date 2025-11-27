# M2 审查结果（第二次）

## 问题

- 高：commit diff 仍为占位实现，`get_commit_diff` 返回 “Diff for commit ... not yet implemented”，与修复文档不符，前端无法查看真实 diff（src-tauri/src/services/git_service.rs:104-109）。
- 中：时区参数未移除且未使用。`GitService` 仍保留 `tz_offset_minutes` 字段与入参，但过滤逻辑直接用 UTC commit 时间与前端时间段对比，跨时区仍可能漏/多取；修复文档声称已移除，与代码不一致（src-tauri/src/services/git_service.rs:8-109，src-tauri/src/commands/git.rs）。
- 中：权限文档与配置不一致。`M2_REVIEW_FIXES.md` 声称添加 fs 权限，实则 `src-tauri/capabilities/default.json` 仍只有 core/path/opener/dialog；文档结论“无须改动”与“已添加 fs 权限”自相矛盾，需统一说明。

## 建议

- 完成 git diff：使用 git2 生成父子树 diff（根提交用空树对比），以 patch 格式返回；前端可懒加载并截断长 diff。
- 明确时区策略：要么彻底移除 tz 参数并以 UTC 为准（文档同步），要么在过滤前应用偏移并让前端传入偏移。
- 统一权限与文档：若继续最小权限，删除 “已添加 fs 权限” 的表述；若要预置 fs 权限，实际更新 capabilities 或在 open_repo 时用 Scope API 动态授权。\*\*\*
