# Commitly

<div align="center">

<img src="public/logo_round.png" alt="Commitly" width="120" />

**Transform your Git commits into professional reports with AI**

A lightweight desktop application that automatically generates weekly/monthly reports from your Git repositories using LLM technology.

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tauri](https://img.shields.io/badge/Tauri-1.5-FFC131?style=flat&logo=tauri&logoColor=white)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-1.70+-000000?style=flat&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

English | [简体中文](README.zh-CN.md)

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Tech Stack](#tech-stack) • [Development](#development) • [License](#license)

</div>

---

## ✨ Features

### 🚀 Core Capabilities

- **Multi-Repository Support**: Manage multiple Git repositories simultaneously with automatic session restoration
- **AI-Powered Reports**: Generate weekly/monthly reports using OpenAI, Claude, Gemini, or local LLM models
- **Smart Commit Analysis**: Filter commits by author, date range, and repository
- **Customizable Templates**: Create and manage report templates with Handlebars syntax
- **Real-time Streaming**: Watch your reports being generated in real-time
- **Multiple Export Formats**: Export reports as Markdown, HTML, or PDF

### 🎨 User Experience

- **Modern UI**: Built with shadcn/ui and Tailwind CSS for a clean, responsive interface
- **Dark/Light Mode**: Full theme support with system preference detection
- **Internationalization**: Support for English and Chinese (easily extensible)
- **Global Repository Access**: Manage repositories from anywhere via the top bar
- **Persistent State**: Automatically restores your last session on startup

### 🔒 Security & Privacy

- **Local-First**: All data stored locally on your machine
- **Secure API Keys**: Credentials stored in system keyring (planned)
- **No Telemetry**: Your data never leaves your computer unless you explicitly use cloud LLM services

---

## 📦 Installation

### Prerequisites

- **Node.js** 18+ and npm
- **Rust** 1.70+ (for building from source)
- **Git** installed on your system

### Quick Start

1. **Clone the repository**

```bash
git clone https://github.com/Tassoi/Commitly.git
cd Commitly
```

2. **Install dependencies**

```bash
npm install
```

3. **Run in development mode**

```bash
npm run tauri dev
```

### Build for Production

```bash
# Build the application
npm run tauri build

# Output will be in src-tauri/target/release/bundle/
# - Windows: .msi / .exe
# - macOS: .dmg / .app
# - Linux: .deb / .AppImage
```

---

## 🎯 Usage

### Getting Started

1. **Open a Repository**
   - Click the "Repository Management" button in the top bar
   - Select "Open Repository" and choose your Git repository folder
   - The app will load the last 30 days of commits

2. **Select Commits**
   - Navigate to the "Commits" page
   - Use filters to narrow down commits by author, date, or repository
   - Select the commits you want to include in your report

3. **Generate Report**
   - Click "Generate Report" button
   - Choose report type (Weekly/Monthly)
   - Select a template
   - Watch as AI generates your report in real-time

4. **Export & Share**
   - View your generated report in the "Reports" page
   - Export as Markdown, HTML, or PDF(TODO)
   - Share with your team or manager(TODO)

### Configuration

#### LLM Settings

Configure your preferred LLM provider in Settings:

- **OpenAI**: GPT-4, GPT-3.5-turbo
- **Anthropic**: Claude 3 Opus, Sonnet, Haiku
- **Google**: Gemini Pro
- **Local Models**: Ollama or llama.cpp server

#### Custom Templates

Create custom report templates:

1. Go to Templates page
2. Click "Create Template"
3. Use Handlebars syntax with available variables:

- Repositories involved: {{total_repos}}
- Total commits: {{total_commits}}
- Date range: {{date_range}}
- Number of authors: {{unique_authors}}

---

## 🛠 Tech Stack

### Frontend

- **Framework**: React 18 + TypeScript
- **State Management**: Zustand with persistence
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Internationalization**: i18next + react-i18next
- **Charts**: Recharts
- **Date Handling**: date-fns

### Backend

- **Framework**: Tauri 1.5+
- **Language**: Rust 1.70+
- **Git Integration**: git2-rs
- **HTTP Client**: reqwest
- **Template Engine**: Handlebars
- **Async Runtime**: tokio
- **Serialization**: serde

### Build Tools

- **Frontend**: Vite
- **Backend**: Cargo
- **Linting**: Prettier
- **Type Checking**: TypeScript

---

## 🔧 Development

### Project Structure

```
Commitly/
├── src/                          # Frontend source
│   ├── components/              # React components
│   │   ├── CommitList/         # Commit list with filters
│   │   ├── navigation/         # TopBar, SideNav
│   │   └── ui/                 # shadcn/ui components
│   ├── pages/                   # Page components
│   │   ├── Dashboard/          # Overview & statistics
│   │   ├── Commits/            # Commit management
│   │   ├── Reports/            # Report viewer
│   │   ├── Templates/          # Template editor
│   │   └── Settings/           # App configuration
│   ├── store/                   # Zustand stores
│   │   ├── repoStore.ts        # Repository state
│   │   ├── reportStore.ts      # Report state
│   │   └── uiStore.ts          # UI preferences
│   ├── hooks/                   # Custom React hooks
│   ├── i18n/                    # Internationalization
│   │   └── locales/            # Translation files
│   └── types/                   # TypeScript definitions
│
├── src-tauri/                   # Rust backend
│   ├── src/
│   │   ├── commands/           # Tauri command handlers
│   │   │   ├── git.rs          # Git operations
│   │   │   ├── llm.rs          # LLM integration
│   │   │   ├── report.rs       # Report generation
│   │   │   └── template.rs     # Template management
│   │   ├── services/           # Business logic
│   │   │   ├── git_service.rs  # Git repository handling
│   │   │   ├── llm_service.rs  # LLM API calls
│   │   │   └── template_service.rs
│   │   ├── models/             # Data structures
│   │   └── main.rs             # Application entry
│   └── templates/              # Built-in report templates
│
├── public/                      # Static assets
├── CLAUDE.md                    # Project guidelines for AI
└── README.md                    # This file
```

### Available Scripts

```bash
# Development
npm run dev              # Start Vite dev server only
npm run tauri dev        # Start full Tauri app with hot reload

# Building
npm run build            # Build frontend for production
npm run tauri build      # Build complete desktop application

# Code Quality
npm run format           # Format code with Prettier
npm run type-check       # Run TypeScript compiler check

# Rust
cd src-tauri
cargo check              # Check Rust code
cargo test               # Run Rust tests
cargo clippy             # Run Rust linter
```

### Adding New Features

1. **Frontend Components**: Add to `src/components/` or `src/pages/`
2. **Backend Commands**: Add to `src-tauri/src/commands/`
3. **Translations**: Update `src/i18n/locales/zh.ts` and `en.ts`
4. **Types**: Define in `src/types/index.ts`

### Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📸 Screenshots

### Dashboard

![Dashboard](build/image.png)
_Overview of repository statistics and recent activity_

### Report Generation

![Report Generation](build/image1.png)
_Real-time AI-powered report generation with streaming_

### Template Management

![Templates](build/image2.png)
_Create and customize report templates_

### Settings

![Settings](build/image3.png)
_Configure LLM providers and application preferences_

---

## 🗺 Roadmap

- [ ] **Security Enhancements**
  - [ ] System keyring integration for API keys
  - [ ] Encrypted configuration storage
  - [ ] Secure file permissions

- [ ] **Advanced Features**
  - [ ] Commit diff analysis in reports
  - [ ] Team collaboration features
  - [ ] Report scheduling and automation
  - [ ] Custom chart types in reports

- [ ] **Integrations**
  - [ ] GitHub/GitLab API integration
  - [ ] Slack/Discord notifications
  - [ ] Email report delivery

- [ ] **Performance**
  - [ ] Incremental Git parsing for large repos
  - [ ] LLM response caching
  - [ ] Virtual scrolling optimization

---

## 🐛 Known Issues

- PDF export requires wkhtmltopdf to be installed separately
- Large repositories (10k+ commits) may take time to load initially
- Some LLM providers may have rate limits

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) - For the amazing desktop framework
- [shadcn/ui](https://ui.shadcn.com/) - For beautiful UI components
- [git2-rs](https://github.com/rust-lang/git2-rs) - For Git integration
- All the open-source contributors who made this possible

---

## 📧 Contact

- **Issues**: [GitHub Issues](https://github.com/Tassoi/Commitly/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Tassoi/Commitly/discussions)

---

<div align="center">

**Made with ❤️ by developers, for developers**

⭐ Star this repo if you find it helpful!

</div>
