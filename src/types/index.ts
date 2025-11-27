// Core domain types for GitLog AI Reporter

export interface Commit {
  hash: string;
  author: string;
  email: string;
  timestamp: number;
  message: string;
  diff?: string;
}

export interface RepoInfo {
  path: string;
  name: string;
  branch: string;
  totalCommits: number;
}

export interface Report {
  id: string;
  name: string; // User-editable report name
  type: 'weekly' | 'monthly' | 'custom';
  generatedAt: number;
  lastModified: number; // Timestamp when report was last edited
  content: string;
  commits: Commit[];
  repoIds: string[]; // References to repositories involved in this report
  metadata?: {
    commitRange?: { from: number; to: number };
    generationParams?: Record<string, unknown>;
  };
}

// LLM Provider types matching Rust backend (M3)
export type LLMProvider =
  | {
      type: 'openai';
      base_url: string;
      api_key: string;
      model: string;
    }
  | {
      type: 'claude';
      base_url: string;
      api_key: string;
      model: string;
    }
  | {
      type: 'gemini';
      base_url: string;
      api_key: string;
      model: string;
    };

// Default configurations for each provider
export const DEFAULT_LLM_PROVIDERS = {
  openai: {
    type: 'openai' as const,
    base_url: 'https://api.openai.com/v1',
    api_key: '',
    model: 'gpt-4o',
  },
  claude: {
    type: 'claude' as const,
    base_url: 'https://api.anthropic.com',
    api_key: '',
    model: 'claude-3-5-sonnet-20241022',
  },
  gemini: {
    type: 'gemini' as const,
    base_url: 'https://generativelanguage.googleapis.com/v1beta',
    api_key: '',
    model: 'gemini-2.0-flash-exp',
  },
};

export interface AppConfig {
  llm_provider: LLMProvider;
  exportFormat: 'markdown' | 'html' | 'pdf';
  timezone: string;
}

export interface RepoStats {
  totalCommits: number;
  authors: number;
  filesChanged: number;
  insertions: number;
  deletions: number;
}

// Repository history item for sidebar display
export interface RepoHistoryItem {
  id: string; // Unique identifier
  path: string;
  name: string;
  branch: string;
  totalCommits: number;
  lastAccessed: number; // Unix timestamp for sorting
  addedAt: number; // When first added to history
}

// UI preferences for sidebar state and theme
export interface UIPreferences {
  sidebarCollapsed: boolean;
  sidebarWidth: number; // For future resizable implementation
  theme: 'light' | 'dark' | 'system';
  lastOpenRepoId?: string; // Remember last opened repo
  lastOpenReportId?: string;
}

// Report template types (M4.3)
export type TemplateType = 'weekly' | 'monthly' | 'custom';

export interface ReportTemplate {
  id: string;
  name: string;
  type: TemplateType;
  content: string; // Handlebars template content
  isBuiltin: boolean; // Built-in templates cannot be deleted
  createdAt: number;
  updatedAt: number;
}
