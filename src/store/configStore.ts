import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import type { AppConfig, LLMProvider } from '../types';
import { DEFAULT_LLM_PROVIDERS } from '../types';

interface ConfigStore {
  // State
  config: AppConfig;
  isLoading: boolean;
  isTesting: boolean;
  error: string | null;

  // Actions
  loadConfig: () => Promise<void>;
  saveConfig: (config: AppConfig) => Promise<void>;
  updateProvider: (provider: LLMProvider) => void;
  updateExportFormat: (format: 'markdown' | 'html' | 'pdf') => void;
  updateTimezone: (timezone: string) => void;
  testConnection: (provider: LLMProvider) => Promise<boolean>;
  clearError: () => void;
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set, get) => ({
      // Default state
      config: {
        llm_provider: DEFAULT_LLM_PROVIDERS.openai,
        exportFormat: 'markdown',
        timezone: 'UTC',
      },
      isLoading: false,
      isTesting: false,
      error: null,

      // Load configuration from backend
      loadConfig: async () => {
        set({ isLoading: true, error: null });
        try {
          const config = await invoke<AppConfig>('load_config');
          set({ config, isLoading: false });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          set({ error: errorMsg, isLoading: false });
          console.error('Failed to load config:', error);
        }
      },

      // Save configuration to backend
      saveConfig: async (config: AppConfig) => {
        set({ isLoading: true, error: null });
        try {
          await invoke('save_config', { config });
          set({ config, isLoading: false });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          set({ error: errorMsg, isLoading: false });
          throw error; // Re-throw for UI handling
        }
      },

      // Update LLM provider configuration
      updateProvider: (provider: LLMProvider) => {
        const { config } = get();
        set({
          config: {
            ...config,
            llm_provider: provider,
          },
        });
      },

      // Update export format
      updateExportFormat: (format: 'markdown' | 'html' | 'pdf') => {
        const { config } = get();
        set({
          config: {
            ...config,
            exportFormat: format,
          },
        });
      },

      // Update timezone
      updateTimezone: (timezone: string) => {
        const { config } = get();
        set({
          config: {
            ...config,
            timezone,
          },
        });
      },

      // Test LLM connection
      testConnection: async (provider: LLMProvider) => {
        set({ isTesting: true, error: null });
        try {
          const result = await invoke<boolean>('test_llm_connection', {
            provider,
          });
          set({ isTesting: false });
          return result;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          set({ error: errorMsg, isTesting: false });
          throw error; // Re-throw for UI handling
        }
      },

      // Clear error message
      clearError: () => set({ error: null }),
    }),
    {
      name: 'app-config-v2', // Changed from 'app-config' to force cache refresh
      // Only persist the config, not loading/testing states
      partialize: (state) => ({ config: state.config }),
    }
  )
);
