import React, { useState, useMemo } from 'react';
import { LinkItem, SiteConfig } from '../types';
import { LinkCard } from '../components/LinkCard';
import { Search, Settings } from '../components/Icons';
import { Link } from 'react-router-dom';

interface HomeProps {
  links: LinkItem[];
  siteConfig: SiteConfig;
}

export const Home: React.FC<HomeProps> = ({ links, siteConfig }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const cats = new Set(links.map(l => l.category));
    return ['All', ...Array.from(cats).sort()];
  }, [links]);

  const filteredLinks = useMemo(() => {
    return links.filter(link => {
      const matchesSearch = 
        link.title.toLowerCase().includes(search.toLowerCase()) || 
        link.url.toLowerCase().includes(search.toLowerCase()) ||
        link.description?.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || link.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [links, search, selectedCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 flex flex-col">
      
      {/* Header / Nav */}
      <nav className="sticky top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 shrink-0">
            {siteConfig.logoUrl ? (
              <img 
                src={siteConfig.logoUrl} 
                alt="Logo" 
                className="w-8 h-8 rounded-lg object-contain bg-slate-800"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="font-bold text-white text-lg">
                  {siteConfig.title.charAt(0) || 'N'}
                </span>
              </div>
            )}
            <span className="font-bold text-lg tracking-tight text-white hidden sm:block">
              {siteConfig.title}
            </span>
          </div>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-full leading-5 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all shadow-sm"
                placeholder="Search your links..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Link to="/admin" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0" title="Admin Settings">
            <Settings size={20} />
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === cat 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Links Grid */}
        {filteredLinks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredLinks.map(link => (
              <LinkCard key={link.id} link={link} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
              <Search size={32} className="text-slate-600" />
            </div>
            <h3 className="text-xl font-medium text-slate-300">No links found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your search or category filter.</p>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 mt-auto bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Zhou Yu. Deployed on Cloudflare Pages.</p>
        </div>
      </footer>
    </div>
  );
};