import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Home } from './views/Home';
import { Admin } from './views/Admin';
import { StorageService } from './services/storage';
import { LinkItem, SiteConfig } from './types';

function App() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({ title: 'Nebula Nav', logoUrl: '' });

  useEffect(() => {
    // Load links and config from storage on mount
    const loadedLinks = StorageService.getLinks();
    setLinks(loadedLinks);
    
    const loadedConfig = StorageService.getSiteConfig();
    setSiteConfig(loadedConfig);
  }, []);

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