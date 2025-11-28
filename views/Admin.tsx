import React, { useState, useEffect } from 'react';
import { LinkItem, SiteConfig } from '../types';
import { StorageService } from '../services/storage';
import { Modal } from '../components/Modal';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  LogOut, 
  LayoutDashboard, 
  Lock,
  Grid,
  List,
  Check,
  Globe,
  Settings
} from '../components/Icons';
import { Link, useNavigate } from 'react-router-dom';

interface AdminProps {
  links: LinkItem[];
  setLinks: (links: LinkItem[]) => void;
  siteConfig: SiteConfig;
  setSiteConfig: (config: SiteConfig) => void;
}

export const Admin: React.FC<AdminProps> = ({ links, setLinks, siteConfig, setSiteConfig }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isFirstRun, setIsFirstRun] = useState(false);
  const navigate = useNavigate();

  // CRUD State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  
  // Link Form
  const [formData, setFormData] = useState<Partial<LinkItem>>({
    title: '',
    url: '',
    category: 'General',
    description: '',
    icon: ''
  });

  // Settings Form
  const [settingsData, setSettingsData] = useState<SiteConfig>({
    title: '',
    logoUrl: ''
  });

  // Check auth status on mount
  useEffect(() => {
    const hasPass = StorageService.hasPasswordSet();
    setIsFirstRun(!hasPass);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFirstRun) {
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
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this link?')) {
      const newLinks = links.filter(l => l.id !== id);
      setLinks(newLinks);
      StorageService.saveLinks(newLinks);
    }
  };

  // --- Settings Operations ---
  const handleOpenSettings = () => {
    setSettingsData({ ...siteConfig });
    setIsSettingsModalOpen(true);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSiteConfig(settingsData);
    StorageService.saveSiteConfig(settingsData);
    setIsSettingsModalOpen(false);
  };

  // --- Auth View ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4 text-blue-500">
              <Lock size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white">
              {isFirstRun ? 'Setup Admin Access' : 'Admin Login'}
            </h1>
            <p className="text-slate-400 mt-2">
              {isFirstRun 
                ? 'Create a password to secure your dashboard.' 
                : 'Enter your password to manage links.'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Enter password..."
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-blue-500/20"
            >
              {isFirstRun ? 'Set Password' : 'Login'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
             <Link to="/" className="text-sm text-slate-500 hover:text-slate-300">
               &larr; Back to Home
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
            <LayoutDashboard className="text-blue-500" />
            <span className="font-bold text-lg text-white">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={handleOpenSettings}
               className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
               title="Global Settings"
             >
               <Settings size={18} />
               <span className="hidden sm:inline">Settings</span>
             </button>
            <div className="h-4 w-px bg-slate-700 mx-1"></div>
            <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors">View Site</Link>
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
        title="Global Site Settings"
      >
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
            <label className="block text-sm font-medium text-slate-400 mb-1">Site Logo URL (Optional)</label>
            <input 
              type="text"
              value={settingsData.logoUrl}
              onChange={(e) => setSettingsData({...settingsData, logoUrl: e.target.value})}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="e.g. https://example.com/logo.png"
            />
            <p className="text-xs text-slate-500 mt-1">Leave empty to use the default letter icon.</p>
          </div>
          <div className="pt-4 flex justify-end gap-3">
             <button
               type="button"
               onClick={() => setIsSettingsModalOpen(false)}
               className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
             >
               Cancel
             </button>
             <button
               type="submit"
               className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/20 transition-all"
             >
               Save Settings
             </button>
          </div>
        </form>
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