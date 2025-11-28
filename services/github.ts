import { BackupData } from '../types';

const GIST_FILENAME = 'nebula_nav_data.json';
const GIST_DESCRIPTION = 'Nebula Nav Data Storage';

export const GitHubService = {
  // Check if token is valid
  validateToken: async (token: string): Promise<boolean> => {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token}`,
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Create a new Gist
  createGist: async (token: string, data: BackupData): Promise<string> => {
    const res = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: GIST_DESCRIPTION,
        public: false, // Private Gist
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(data, null, 2),
          },
        },
      }),
    });

    if (!res.ok) throw new Error('Failed to create Gist');
    const json = await res.json();
    return json.id;
  },

  // Update existing Gist
  updateGist: async (token: string, gistId: string, data: BackupData) => {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          [GIST_FILENAME]: {
            content: JSON.stringify(data, null, 2),
          },
        },
      }),
    });

    if (!res.ok) throw new Error('Failed to update Gist');
  },

  // Get data from Gist
  getGist: async (token: string, gistId: string): Promise<BackupData | null> => {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        Authorization: `token ${token}`,
      },
    });

    if (!res.ok) return null;
    const json = await res.json();
    
    const file = json.files[GIST_FILENAME];
    if (!file || !file.content) return null;

    try {
      return JSON.parse(file.content);
    } catch {
      return null;
    }
  }
};