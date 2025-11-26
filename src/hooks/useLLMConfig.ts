// Custom hook for LLM configuration

import { invoke } from '@tauri-apps/api/core';
import type { AppConfig } from '../types';

export const useLLMConfig = () => {
  const saveConfig = async (config: AppConfig): Promise<void> => {
    return await invoke<void>('save_config', { config });
  };

  const loadConfig = async (): Promise<AppConfig> => {
    return await invoke<AppConfig>('load_config');
  };

  const saveApiKey = async (key: string): Promise<void> => {
    return await invoke<void>('save_api_key', { key });
  };

  return {
    saveConfig,
    loadConfig,
    saveApiKey,
  };
};
