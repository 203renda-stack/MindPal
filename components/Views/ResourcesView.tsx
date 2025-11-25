
import React from 'react';
import { RESOURCES } from '../../constants';
import { Phone, Heart, BookOpen, ExternalLink } from '../ui/Icons';

export const ResourcesView: React.FC = () => {
  return (
    <div className="p-4 space-y-6 overflow-y-auto pb-24 fade-in h-full bg-slate-50">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-slate-800">心理资源库</h2>
        <p className="text-slate-500 text-sm">为你精选的放松与支持工具</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {RESOURCES.map((res) => (
          <div 
            key={res.id} 
            className="group bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-4 transition-all hover:shadow-md hover:border-teal-100"
          >
            <div className={`p-3 rounded-2xl shrink-0 transition-colors
              ${res.category === 'hotline' ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-100' : 
                res.category === 'meditation' ? 'bg-teal-50 text-teal-600 group-hover:bg-teal-100' : 'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100'}`}>
              {res.category === 'hotline' && <Phone size={24} />}
              {res.category === 'meditation' && <Heart size={24} />}
              {res.category === 'article' && <BookOpen size={24} />}
            </div>
            
            <div className="flex-1 flex flex-col h-full justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{res.title}</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{res.description}</p>
              </div>
              
              {res.link ? (
                <a 
                  href={res.link} 
                  target={res.link.startsWith('tel') ? '_self' : '_blank'}
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 mt-4 text-sm font-bold uppercase tracking-wide transition-colors
                    ${res.category === 'hotline' ? 'text-rose-500 hover:text-rose-600' : 'text-teal-600 hover:text-teal-700'}`}
                >
                  {res.category === 'hotline' ? '立即拨打' : '查看详情'}
                  <ExternalLink size={14} />
                </a>
              ) : (
                <span className="mt-4 text-xs text-slate-400 font-medium bg-slate-100 self-start px-2 py-1 rounded">
                  APP 内置功能
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
