import { LinkItem, DEFAULT_LINKS, SiteConfig, BackupData, SyncConfig } from '../types';

const LINKS_KEY = 'nebula_links';
const AUTH_KEY = 'nebula_auth'; // Stores password
const CONFIG_KEY = 'nebula_config';
const SYNC_KEY = 'nebula_sync';

const DEFAULT_CONFIG: SiteConfig = {
  title: 'Zhou Yu Nav',
  logoUrl: ''
};

export const StorageService = {
  getLinks: (): LinkItem[] => {
    try {
      const stored = localStorage.getItem(LINKS_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_LINKS;
    } catch (e) {
      console.error("Failed to load links", e);
      return DEFAULT_LINKS;
    }
  },

  saveLinks: (links: LinkItem[]) => {
    try {
      localStorage.setItem(LINKS_KEY, JSON.stringify(links));
    } catch (e) {
      console.error("Failed to save links", e);
    }
  },

  getSiteConfig: (): SiteConfig => {
    try {
      const stored = localStorage.getItem(CONFIG_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  },

  saveSiteConfig: (config: SiteConfig) => {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
      console.error("Failed to save config", e);
    }
  },

  // --- Auth Methods ---
  setPassword: (password: string) => {
    localStorage.setItem(AUTH_KEY, password);
  },

  checkPassword: (input: string): boolean => {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored === input;
  },

  getPassword: (): string | null => {
    return localStorage.getItem(AUTH_KEY);
  },

  hasPasswordSet: (): boolean => {
    return !!localStorage.getItem(AUTH_KEY);
  },
  
  // --- Sync Config ---
  getSyncConfig: (): SyncConfig | null => {
    try {
      const stored = localStorage.getItem(SYNC_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  saveSyncConfig: (config: SyncConfig) => {
    localStorage.setItem(SYNC_KEY, JSON.stringify(config));
  },

  // --- Data Management ---
  createBackup: (links: LinkItem[], config: SiteConfig): string => {
    const password = localStorage.getItem(AUTH_KEY) || '';
    const backup: BackupData = {
      version: 1,
      date: Date.now(),
      links,
      siteConfig: config,
      authCheck: password // Include auth in backup so we can restore password on new devices
    };
    return JSON.stringify(backup, null, 2);
  },

  processBackup: (jsonContent: string): BackupData | null => {
    try {
      const data = JSON.parse(jsonContent);
      // Basic validation
      if (!Array.isArray(data.links) || !data.siteConfig) {
        throw new Error("Invalid backup format");
      }
      return data as BackupData;
    } catch (e) {
      console.error("Failed to parse backup", e);
      return null;
    }
  },

  logout: () => {
    // Client-side only
  }
};