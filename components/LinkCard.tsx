import React from 'react';
import { LinkItem } from '../types';
import { ExternalLink, Globe } from './Icons';

interface LinkCardProps {
  link: LinkItem;
}

export const LinkCard: React.FC<LinkCardProps> = ({ link }) => {
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return '';
    }
  };

  const imageSrc = link.icon && link.icon.trim() !== '' ? link.icon : getFaviconUrl(link.url);

  return (
    <a 
      href={link.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="group block relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-blue-500/50 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 h-full"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 w-full">
          <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center overflow-hidden shrink-0 border border-slate-600/50">
             <img 
               src={imageSrc} 
               alt="" 
               className="w-full h-full object-cover"
               onError={(e) => {
                 (e.target as HTMLImageElement).style.display = 'none';
                 (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
               }}
             />
             <Globe size={18} className="text-slate-400 hidden" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-slate-100 truncate pr-2">{link.title}</h3>
            <p className="text-xs text-slate-400 truncate opacity-80">{new URL(link.url).hostname}</p>
          </div>
        </div>
        <ExternalLink size={14} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4" />
      </div>
      {link.description && (
        <p className="mt-3 text-sm text-slate-400 line-clamp-2 leading-relaxed">
          {link.description}
        </p>
      )}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-600 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700">
          {link.category}
        </span>
      </div>
    </a>
  );
};