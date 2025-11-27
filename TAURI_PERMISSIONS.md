# Tauri 权限配置说明

## 问题

启动时遇到错误：

```
Permission fs:allow-read-text-file not found
```

## 原因

之前的权限配置格式不正确。在 Tauri 2.0 中，不能使用以下格式：

```json
{
  "identifier": "fs:allow-read-text-file",
  "allow": [{ "path": "$HOME/**" }]
}
```

## 解决方案

### M1 阶段（当前）

简化权限配置，只保留必要的权限：

```json
{
  "permissions": ["core:default", "core:path:default", "opener:default", "dialog:default"]
}
```

**为什么这样就够了？**

1. **Dialog 自动授权**：当用户通过 `dialog:default` 选择目录时，Tauri 会自动授权该路径的访问权限
2. **M1 使用 Mock 数据**：当前 GitService 只返回 mock 数据，不实际读取文件系统
3. **延迟到 M2**：真正的文件系统访问在 M2 阶段集成 git2 时才需要

### M2 阶段（git2 集成时）

有两种方式添加文件系统权限：

#### 方式 1: 使用 Scope API（推荐）

在 Rust 代码中动态添加权限：

```rust
use tauri::scope::FsScope;

#[tauri::command]
async fn open_repository(
    app: tauri::AppHandle,
    path: String,
) -> Result<RepoInfo, String> {
    // 添加路径到文件系统作用域
    let scope = app.fs_scope();
    scope.allow_directory(&path, true)?;

    // 现在可以安全访问该路径
    let repo = git2::Repository::open(&path)?;
    // ...
}
```

#### 方式 2: 使用预定义权限

在 `capabilities/default.json` 中添加：

```json
{
  "permissions": [
    "core:default",
    "dialog:default",
    "fs:default",
    "fs:allow-read-dir",
    "fs:allow-read-file"
  ]
}
```

注意：这会给予应用更广泛的文件系统访问权限，需要谨慎使用。

## 当前状态

✅ M1 权限配置已修复
✅ 应用可以正常启动（需要安装 Rust）
✅ Dialog 选择目录功能可用
📝 文件系统读取将在 M2 阶段实现

## 安装 Rust

如果尚未安装 Rust，运行：

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

然后重新启动终端并运行：

```bash
npm run tauri dev
```

## 参考

- [Tauri 2.0 Permissions](https://v2.tauri.app/reference/acl/)
- [Tauri Scope API](https://v2.tauri.app/reference/javascript/api/namespacecore/#scope)
