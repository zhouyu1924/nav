import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Home } from './views/Home';
import { Admin } from './views/Admin';
import { StorageService } from './services/storage';
import { GitHubService } from './services/github';
import { LinkItem, SiteConfig } from './types';

function App() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({ title: 'Zhou Yu Nav', logoUrl: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      // 1. Load Local first (fastest)
      const localLinks = StorageService.getLinks();
      const localConfig = StorageService.getSiteConfig();
      setLinks(localLinks);
      setSiteConfig(localConfig);
      
      // 2. Check for Cloud Sync
      const syncConfig = StorageService.getSyncConfig();
      if (syncConfig && syncConfig.enabled && syncConfig.githubToken && syncConfig.gistId) {
        try {
          // Silent update from cloud
          const cloudData = await GitHubService.getGist(syncConfig.githubToken, syncConfig.gistId);
          if (cloudData) {
            setLinks(cloudData.links);
            setSiteConfig(cloudData.siteConfig);
            StorageService.saveLinks(cloudData.links);
            StorageService.saveSiteConfig(cloudData.siteConfig);
            // Sync auth if present in cloud backup
            if (cloudData.authCheck) {
               StorageService.setPassword(cloudData.authCheck);
            }
          }
        } catch (e) {
          console.error("Auto-sync failed", e);
        }
      }
      
      setLoading(false);
    };

    initializeData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
         <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home links={links} siteConfig={siteConfig} />} />
        <Route 
          path="/admin" 
          element={
            <Admin 
              links={links} 
              setLinks={setLinks} 
              siteConfig={siteConfig}
              setSiteConfig={setSiteConfig}
            />
          } 
        />
      </Routes>
    </HashRouter>
  );
}

export default App;