import React, { useState, useEffect, useRef } from 'react';
import { LinkItem, SiteConfig, SyncConfig } from '../types';
import { StorageService } from '../services/storage';
import { GitHubService } from '../services/github';
import { Modal } from '../components/Modal';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  LogOut, 
  LayoutDashboard, 
  Lock,
  Globe,
  Settings,
  Download,
  Upload,
  AlertTriangle,
  Check,
  Cloud,
  RefreshCw,
  ExternalLink
} from '../components/Icons';
import { Link } from 'react-router-dom';

interface AdminProps {
  links: LinkItem[];
  setLinks: (links: LinkItem[]) => void;
  siteConfig: SiteConfig;
  setSiteConfig: (config: SiteConfig) => void;
}

type SettingsTab = 'general' | 'security' | 'sync' | 'data';

export const Admin: React.FC<AdminProps> = ({ links, setLinks, siteConfig, setSiteConfig }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isFirstRun, setIsFirstRun] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CRUD State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  
  // Link Form
  const [formData, setFormData] = useState<Partial<LinkItem>>({
    title: '',
    url: '',
    category: 'General',
    description: '',
    icon: ''
  });

  // Settings Forms
  const [settingsData, setSettingsData] = useState<SiteConfig>({
    title: '',
    logoUrl: ''
  });

  // Sync Form
  const [syncConfig, setSyncConfig] = useState<Partial<SyncConfig>>({
    githubToken: '',
    gistId: ''
  });
  const [syncStatus, setSyncStatus] = useState({ loading: false, message: '', type: '' });

  // Password Change State
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passMessage, setPassMessage] = useState({ type: '', text: '' });

  // Check auth status on mount
  useEffect(() => {
    const hasPass = StorageService.hasPasswordSet();
    setIsFirstRun(!hasPass);
    
    const storedSync = StorageService.getSyncConfig();
    if (storedSync) {
      setSyncConfig(storedSync);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFirstRun) {
      if (password.length < 4) {
        alert("Password is too short");
        return;
      }
      StorageService.setPassword(password);
      setIsAuthenticated(true);
      setIsFirstRun(false);
    } else {
      if (StorageService.checkPassword(password)) {
        setIsAuthenticated(true);
      } else {
        alert('Incorrect password');
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
  };

  // --- CRUD Operations ---
  const handleOpenModal = (link?: LinkItem) => {
    if (link) {
      setEditingLink(link);
      setFormData({ ...link });
    } else {
      setEditingLink(null);
      setFormData({
        title: '',
        url: '',
        category: 'General',
        description: '',
        icon: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url) return;

    let newLinks = [...links];

    if (editingLink) {
      // Edit
      newLinks = newLinks.map(l => l.id === editingLink.id ? { ...l, ...formData } as LinkItem : l);
    } else {
      // Add
      const newLink: LinkItem = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        title: formData.title!,
        url: formData.url!.startsWith('http') ? formData.url! : `https://${formData.url}`,
        category: formData.category || 'General',
        description: formData.description,
        icon: formData.icon
      };
      newLinks.push(newLink);
    }

    setLinks(newLinks);
    StorageService.saveLinks(newLinks);
    setIsModalOpen(false);
    
    // Auto sync if enabled
    if (syncConfig.enabled && syncConfig.githubToken && syncConfig.gistId) {
      // We don't await this to keep UI snappy, but in prod we might show a spinner
      handlePerformSync(syncConfig.githubToken, syncConfig.gistId, newLinks, siteConfig);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this link?')) {
      const newLinks = links.filter(l => l.id !== id);
      setLinks(newLinks);
      StorageService.saveLinks(newLinks);
      
      if (syncConfig.enabled && syncConfig.githubToken && syncConfig.gistId) {
        handlePerformSync(syncConfig.githubToken, syncConfig.gistId, newLinks, siteConfig);
      }
    }
  };

  // --- Settings Operations ---
  const handleOpenSettings = () => {
    setSettingsData({ ...siteConfig });
    setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPassMessage({ type: '', text: '' });
    
    const storedSync = StorageService.getSyncConfig();
    if (storedSync) setSyncConfig(storedSync);
    
    setActiveTab('general');
    setIsSettingsModalOpen(true);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSiteConfig(settingsData);
    StorageService.saveSiteConfig(settingsData);
    
    if (syncConfig.enabled && syncConfig.githubToken && syncConfig.gistId) {
      handlePerformSync(syncConfig.githubToken, syncConfig.gistId, links, settingsData);
    }
    
    setIsSettingsModalOpen(false);
  };

  // --- Sync Logic ---
  const handlePerformSync = async (token: string, gistId: string, currentLinks: LinkItem[], currentConfig: SiteConfig) => {
    try {
      const backupStr = StorageService.createBackup(currentLinks, currentConfig);
      const backupData = JSON.parse(backupStr);
      await GitHubService.updateGist(token, gistId, backupData);
      
      const newSyncConfig = {
        enabled: true,
        githubToken: token,
        gistId: gistId,
        lastSync: Date.now()
      };
      setSyncConfig(newSyncConfig);
      StorageService.saveSyncConfig(newSyncConfig);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleSetupSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncConfig.githubToken) return;

    setSyncStatus({ loading: true, message: 'Validating token...', type: 'info' });

    const isValid = await GitHubService.validateToken(syncConfig.githubToken);
    if (!isValid) {
      setSyncStatus({ loading: false, message: 'Invalid GitHub Token.', type: 'error' });
      return;
    }

    try {
      let gistId = syncConfig.gistId;
      const backupStr = StorageService.createBackup(links, siteConfig);
      const backupData = JSON.parse(backupStr);

      if (!gistId) {
        setSyncStatus({ loading: true, message: 'Creating new private Gist...', type: 'info' });
        gistId = await GitHubService.createGist(syncConfig.githubToken, backupData);
      } else {
        setSyncStatus({ loading: true, message: 'Updating existing Gist...', type: 'info' });
        await GitHubService.updateGist(syncConfig.githubToken, gistId, backupData);
      }

      const newConfig: SyncConfig = {
        enabled: true,
        githubToken: syncConfig.githubToken,
        gistId: gistId,
        lastSync: Date.now()
      };

      StorageService.saveSyncConfig(newConfig);
      setSyncConfig(newConfig);
      setSyncStatus({ loading: false, message: 'Sync enabled successfully! Data is now safe in Cloud.', type: 'success' });
    } catch (e) {
      setSyncStatus({ loading: false, message: 'Failed to sync. Check network or permissions.', type: 'error' });
    }
  };

  const handlePullFromCloud = async () => {
     if (!syncConfig.githubToken || !syncConfig.gistId) return;
     
     if (!window.confirm("This will overwrite your local data with data from the Cloud. Continue?")) return;

     setSyncStatus({ loading: true, message: 'Downloading data...', type: 'info' });
     try {
       const data = await GitHubService.getGist(syncConfig.githubToken, syncConfig.gistId);
       if (data) {
         setLinks(data.links);
         setSiteConfig(data.siteConfig);
         StorageService.saveLinks(data.links);
         StorageService.saveSiteConfig(data.siteConfig);
         
         // If password exists in backup, restore it
         if (data.authCheck) {
            StorageService.setPassword(data.authCheck);
         }

         setSyncStatus({ loading: false, message: 'Data restored from Cloud!', type: 'success' });
       } else {
         throw new Error("Empty data");
       }
     } catch (e) {
       setSyncStatus({ loading: false, message: 'Failed to download data.', type: 'error' });
     }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassMessage({ type: '', text: '' });

    // Verify current
    if (!StorageService.checkPassword(passForm.currentPassword)) {
      setPassMessage({ type: 'error', text: 'Current password is incorrect.' });
      return;
    }

    if (passForm.newPassword.length < 4) {
      setPassMessage({ type: 'error', text: 'New password must be at least 4 characters.' });
      return;
    }

    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    StorageService.setPassword(passForm.newPassword);
    setPassMessage({ type: 'success', text: 'Password updated successfully! Don\'t forget to Sync.' });
    setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    
    // Trigger sync to save new password to cloud
    if (syncConfig.enabled && syncConfig.githubToken && syncConfig.gistId) {
       handlePerformSync(syncConfig.githubToken, syncConfig.gistId, links, siteConfig);
    }
  };

  const handleExportData = () => {
    const dataStr = StorageService.createBackup(links, siteConfig);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zhou-yu-nav-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const result = StorageService.processBackup(event.target.result as string);
        if (result) {
          if (window.confirm(`Found backup with ${result.links.length} links. This will overwrite your current data. Continue?`)) {
            setLinks(result.links);
            setSiteConfig(result.siteConfig);
            StorageService.saveLinks(result.links);
            StorageService.saveSiteConfig(result.siteConfig);
            if (result.authCheck) StorageService.setPassword(result.authCheck);
            
            alert('Import successful!');
            setIsSettingsModalOpen(false);
          }
        } else {
          alert('Invalid backup file.');
        }
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Auth View ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4 text-blue-500 shadow-lg shadow-blue-500/10">
              <Lock size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white">
              {isFirstRun ? 'Setup Admin Access' : 'Admin Login'}
            </h1>
            <p className="text-slate-400 mt-2">
              {isFirstRun 
                ? 'Create a secure password for your dashboard.' 
                : 'Enter your password to manage links.'}
            </p>
            {isFirstRun && (
              <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300 text-left flex gap-2">
                 <AlertTriangle size={16} className="shrink-0" />
                 <span>Important: After logging in, go to Settings &gt; Cloud Sync to enable permanent storage.</span>
              </div>
            )}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={isFirstRun ? "Create new password" : "Enter password"}
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-blue-500/20"
            >
              {isFirstRun ? 'Set Password & Login' : 'Login'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
             <Link to="/" className="text-sm text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1">
               <Globe size={14} /> Back to Site
             </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Dashboard View ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <LayoutDashboard className="text-blue-500" size={20} />
            </div>
            <span className="font-bold text-lg text-white">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
             <button 
               onClick={handleOpenSettings}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium border ${
                 syncConfig.enabled ? 'border-green-500/20 bg-green-500/10 text-green-400' : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800'
               }`}
               title="Global Settings"
             >
               {syncConfig.enabled ? <Check size={16} /> : <Settings size={18} />}
               <span className="hidden sm:inline">{syncConfig.enabled ? 'Synced' : 'Settings'}</span>
             </button>
            <div className="h-4 w-px bg-slate-700 mx-1"></div>
            <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2 px-2">
              <Globe size={16} />
              <span className="hidden sm:inline">View Site</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-sm font-medium ml-2"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Manage Links</h2>
            <p className="text-slate-400">Add, edit, or remove your navigation items.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus size={20} />
            Add New Link
          </button>
        </div>

        {/* Links Table/List */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4 hidden sm:table-cell">URL</th>
                  <th className="px-6 py-4 hidden md:table-cell">Category</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {links.map(link => (
                  <tr key={link.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                       <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                          {link.icon ? (
                            <img src={link.icon} alt="" className="w-full h-full object-cover" />
                          ) : (
                             <Globe size={16} />
                          )}
                       </div>
                       <div className="min-w-0">
                         <div className="truncate">{link.title}</div>
                         <div className="text-xs text-slate-500 sm:hidden truncate max-w-[150px]">{link.url}</div>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm font-mono truncate max-w-[200px] hidden sm:table-cell">
                      {link.url}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {link.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenModal(link)}
                          className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(link.id)}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {links.length === 0 && (
                   <tr>
                     <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                       No links added yet. Click "Add New Link" to get started.
                     </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Admin Settings"
      >
        <div className="flex border-b border-slate-700 mb-6">
          <button 
            className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'general' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
           <button 
            className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'sync' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            onClick={() => setActiveTab('sync')}
          >
            Cloud Sync
          </button>
          <button 
            className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'security' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
          <button 
            className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'data' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            onClick={() => setActiveTab('data')}
          >
            Data
          </button>
        </div>

        {activeTab === 'general' && (
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Site Name</label>
              <input 
                required
                type="text"
                value={settingsData.title}
                onChange={(e) => setSettingsData({...settingsData, title: e.target.value})}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="e.g. Nebula Nav"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Site Logo URL</label>
              <input 
                type="text"
                value={settingsData.logoUrl}
                onChange={(e) => setSettingsData({...settingsData, logoUrl: e.target.value})}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="https://..."
              />
            </div>
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all"
              >
                Save General Settings
              </button>
            </div>
          </form>
        )}
        
        {activeTab === 'sync' && (
          <form onSubmit={handleSetupSync} className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
               <div className="flex items-start gap-3">
                 <Cloud className="text-blue-400 shrink-0 mt-1" size={20} />
                 <div>
                   <h3 className="text-sm font-semibold text-blue-300">Cross-Browser Persistence</h3>
                   <p className="text-xs text-blue-200/70 mt-1 leading-relaxed">
                     Connect to GitHub Gist to save your links and settings permanently. 
                     Access your dashboard from any device by entering the same credentials.
                   </p>
                 </div>
               </div>
            </div>

            {syncStatus.message && (
               <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${syncStatus.type === 'error' ? 'bg-red-500/10 text-red-400' : syncStatus.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-slate-800 text-slate-300'}`}>
                 {syncStatus.type === 'error' ? <AlertTriangle size={16} /> : <Check size={16} />}
                 {syncStatus.message}
               </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                GitHub Personal Access Token (Classic)
                <a href="https://github.com/settings/tokens/new?scopes=gist&description=NebulaNav" target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-400 hover:text-blue-300 text-xs inline-flex items-center gap-1">
                  Get Token <ExternalLink size={10} />
                </a>
              </label>
              <input 
                required
                type="password"
                value={syncConfig.githubToken}
                onChange={(e) => setSyncConfig({...syncConfig, githubToken: e.target.value})}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono text-sm"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              />
              <p className="text-xs text-slate-500 mt-1">Token must have 'gist' scope permission.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Gist ID (Optional)</label>
              <input 
                type="text"
                value={syncConfig.gistId}
                onChange={(e) => setSyncConfig({...syncConfig, gistId: e.target.value})}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono text-sm"
                placeholder="Leave empty to create new"
              />
              <p className="text-xs text-slate-500 mt-1">If you have data on another device, paste its Gist ID here.</p>
            </div>

            <div className="pt-4 flex justify-between gap-3">
               <button
                type="button"
                onClick={handlePullFromCloud}
                disabled={!syncConfig.gistId || !syncConfig.githubToken}
                className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-sm flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={16} /> Restore from Cloud
              </button>
              <button
                type="submit"
                disabled={syncStatus.loading}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {syncStatus.loading ? 'Processing...' : 'Save & Enable Sync'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passMessage.text && (
              <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${passMessage.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                {passMessage.type === 'error' ? <AlertTriangle size={16} className="mt-0.5"/> : <Check size={16} className="mt-0.5"/>}
                {passMessage.text}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Current Password</label>
              <input 
                required
                type="password"
                value={passForm.currentPassword}
                onChange={(e) => setPassForm({...passForm, currentPassword: e.target.value})}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="pt-2 border-t border-slate-800"></div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">New Password</label>
              <input 
                required
                type="password"
                value={passForm.newPassword}
                onChange={(e) => setPassForm({...passForm, newPassword: e.target.value})}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Confirm New Password</label>
              <input 
                required
                type="password"
                value={passForm.confirmPassword}
                onChange={(e) => setPassForm({...passForm, confirmPassword: e.target.value})}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all"
              >
                Update Password
              </button>
            </div>
          </form>
        )}

        {activeTab === 'data' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleExportData}
                className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all group"
              >
                <div className="p-3 bg-blue-500/10 rounded-full text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Download size={24} />
                </div>
                <div className="text-center">
                  <span className="block font-medium text-slate-200">Export Backup</span>
                  <span className="text-xs text-slate-500">Save local file</span>
                </div>
              </button>

              <button
                onClick={handleImportClick}
                className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all group"
              >
                <div className="p-3 bg-purple-500/10 rounded-full text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <Upload size={24} />
                </div>
                <div className="text-center">
                  <span className="block font-medium text-slate-200">Import Backup</span>
                  <span className="text-xs text-slate-500">Restore local file</span>
                </div>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Edit/Add Link Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLink ? 'Edit Link' : 'Add New Link'}
      >
        <form onSubmit={handleSaveLink} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
            <input 
              required
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="e.g. My Awesome Site"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">URL</label>
            <input 
              required
              type="text"
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="e.g. https://example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
              <input 
                type="text"
                list="categories"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Category"
              />
              <datalist id="categories">
                {Array.from(new Set(links.map(l => l.category))).map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Icon URL (Optional)</label>
              <input 
                type="text"
                value={formData.icon || ''}
                onChange={(e) => setFormData({...formData, icon: e.target.value})}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Image URL"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Description (Optional)</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none h-20 resize-none"
              placeholder="Short description..."
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
             <button
               type="button"
               onClick={() => setIsModalOpen(false)}
               className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
             >
               Cancel
             </button>
             <button
               type="submit"
               className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/20 transition-all"
             >
               Save Link
             </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};