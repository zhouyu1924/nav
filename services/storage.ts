import { LinkItem, DEFAULT_LINKS, SiteConfig, BackupData } from '../types';

const LINKS_KEY = 'nebula_links';
const AUTH_KEY = 'nebula_auth';
const CONFIG_KEY = 'nebula_config';

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

  // Auth Methods
  setPassword: (password: string) => {
    localStorage.setItem(AUTH_KEY, password);
  },

  checkPassword: (input: string): boolean => {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored === input;
  },

  hasPasswordSet: (): boolean => {
    return !!localStorage.getItem(AUTH_KEY);
  },
  
  // Data Management
  createBackup: (links: LinkItem[], config: SiteConfig): string => {
    const backup: BackupData = {
      version: 1,
      date: Date.now(),
      links,
      siteConfig: config
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
    // Session is handled in React state, nothing to clear from localstorage usually
    // unless we were using tokens.
  }
};