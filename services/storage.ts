import { LinkItem, DEFAULT_LINKS, SiteConfig } from '../types';

const LINKS_KEY = 'nebula_links';
const AUTH_KEY = 'nebula_auth';
const CONFIG_KEY = 'nebula_config';

const DEFAULT_CONFIG: SiteConfig = {
  title: 'Nebula Nav',
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

  // Security Note: For a static client-side app, we store the password in local storage.
  // In a real production app with a backend, this would be a session token.
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
  
  logout: () => {
     // For this simple app, we manage auth state in React context, 
     // but we could clear session tokens here if we had them.
  }
};