import React from 'react';
import { Message } from '../../types';
import { User, Bot } from '../ui/Icons';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'} fade-in`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-teal-600' : 'bg-rose-400'}`}>
          {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
        </div>

        {/* Bubble */}
        <div 
          className={`px-4 py-3 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm
            ${isUser 
              ? 'bg-teal-600 text-white rounded-br-none' 
              : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
            }
          `}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
};