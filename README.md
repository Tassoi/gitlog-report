# <img src="public/logo_round.png" alt="Commitly Logo" width="120" />

# Commitly

> 用 LLM 玩转你的 Git 提交，自动把碎碎念写成周报月报。轻量、调皮、够实用。

## 这玩意儿能干啥

- 一键扫仓库：自动拉取最近提交，支持多仓同开，随时切换。
- 智能写报告：周报、月报随你选，模板可自定义，流式生成。
- 导出随心：Markdown/HTML/PDF，一键保存给老板。
- 轻量桌面端：Tauri + React，跑得快还省内存。

## 快速上手

1. 安装依赖

```bash
npm install
```

2. 开发模式启动（会同时起前端和 Tauri）

```bash
npm run tauri dev
```

3. 选择仓库，点「生成报告」，看 AI 给你写总结。

## 常用脚本

- `npm run dev`：单跑前端
- `npm run build`：打包前端
- `npm run tauri build`：构建桌面应用
- `npm run format`：Prettier 走一遍

## 技术栈偷瞄

- 前端：React + TypeScript + Zustand + Tailwind (shadcn/ui)
- 后端：Rust + Tauri，串 OpenAI/Claude/Gemini 等兼容接口
- 模板：Handlebars，自由改写周报/月报骨架

## 目录速查

```
src/                # 前端组件、hooks、store
src-tauri/          # Rust 命令、服务、模板
public/logo_round.png  # 本 README 提到的调皮 logo
build/image.png        # 仪表盘截图（示例）
build/image1.png       # 更多界面截图
build/image2.png
build/image3.png
```

## 界面长这样

![Dashboard - GitLog AI](build/image.png)

![Report - GitLog AI](build/image1.png)

![Templates - GitLog AI](build/image2.png)

![Settings - GitLog AI](build/image3.png)

## 小贴士

- 想切语言？右上角地球图标点一下。
- 模板不合胃口？设置里复制一份再改。
- LLM 卡住？检查代理和 API Key，或换个模型。

## 许可证

Mit License （等老板拍板之前先别拿去卖哦）
