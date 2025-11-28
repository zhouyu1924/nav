export interface LinkItem {
  id: string;
  title: string;
  url: string;
  category: string;
  description?: string;
  icon?: string; // URL to icon or emoji
  createdAt: number;
}

export interface SiteConfig {
  title: string;
  logoUrl: string;
}

export interface SyncConfig {
  enabled: boolean;
  githubToken: string;
  gistId: string;
  lastSync: number;
}

export interface UserConfig {
  passwordHash: string | null;
  theme: 'dark' | 'light';
}

export interface BackupData {
  version: number;
  date: number;
  links: LinkItem[];
  siteConfig: SiteConfig;
  // We include password verification in backup to restore access on new devices
  authCheck?: string; 
}

export const DEFAULT_LINKS: LinkItem[] = [
  {
    id: '1',
    title: 'Google',
    url: 'https://google.com',
    category: 'Search',
    description: 'The world\'s most popular search engine.',
    createdAt: Date.now(),
  },
  {
    id: '2',
    title: 'GitHub',
    url: 'https://github.com',
    category: 'Dev',
    description: 'Where the world builds software.',
    createdAt: Date.now(),
  },
  {
    id: '3',
    title: 'YouTube',
    url: 'https://youtube.com',
    category: 'Media',
    description: 'Broadcast yourself.',
    createdAt: Date.now(),
  },
  {
    id: '4',
    title: 'ChatGPT',
    url: 'https://chat.openai.com',
    category: 'AI',
    description: 'AI conversation partner.',
    createdAt: Date.now(),
  }
];