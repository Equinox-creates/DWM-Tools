import React, { useState } from 'react';
import { DiscordWebhookMessage, DiscordEmbed } from '@/types';
import { Plus, Trash2, Undo, Redo, ChevronDown, ChevronRight } from 'lucide-react';
import { playButtonSound, playDeleteSound } from '@/utils/sounds';
import { intToHex, hexToInt } from '@/utils';

interface BlockEditorProps {
  message: DiscordWebhookMessage;
  onChange: (message: DiscordWebhookMessage) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

interface BlockInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
}

const BlockInput = ({ value, onChange, placeholder, type = "text", multiline = false }: BlockInputProps) => {
  const baseClass = "w-full bg-black/20 text-white placeholder-white/50 border border-black/20 rounded-full px-3 py-1.5 text-xs focus:outline-none focus:bg-black/30 transition-colors";
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${baseClass} rounded-xl resize-y min-h-[60px]`}
        rows={2}
      />
    );
  }
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={baseClass}
    />
  );
};

interface ScratchBlockProps {
  color: string;
  title: string;
  children?: React.ReactNode;
  onRemove?: () => void;
  isCBlock?: boolean;
}

const ScratchBlock = ({ color, title, children, onRemove, isCBlock = false }: ScratchBlockProps) => {
  return (
    <div className={`${color} rounded-lg mb-1 shadow-sm border-b-4 border-black/20 overflow-hidden`}>
      <div className="flex justify-between items-center p-2">
        <span className="text-white font-bold text-sm drop-shadow-sm flex items-center gap-2">
          {title}
        </span>
        {onRemove && (
          <button onClick={onRemove} className="text-white/70 hover:text-white p-1 hover:bg-black/20 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {children && (
        <div className={`p-2 pt-0 ${isCBlock ? 'ml-4 border-l-4 border-black/20' : ''}`}>
          <div className="space-y-1.5">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

const EmbedBlock = ({ embed, index, message, onChange }: { embed: DiscordEmbed, index: number, message: DiscordWebhookMessage, onChange: (updates: Partial<DiscordWebhookMessage>) => void }) => {
  const [expanded, setExpanded] = useState(true);

  const updateEmbed = (updates: Partial<DiscordEmbed>) => {
    const newEmbeds = [...(message.embeds || [])];
    newEmbeds[index] = { ...newEmbeds[index], ...updates };
    onChange({ embeds: newEmbeds });
  };

  const removeEmbed = () => {
    playDeleteSound();
    const newEmbeds = [...(message.embeds || [])];
    newEmbeds.splice(index, 1);
    onChange({ embeds: newEmbeds });
  };

  return (
    <div className="bg-[#9966FF] rounded-lg mb-1 shadow-sm border-b-4 border-black/20 overflow-hidden">
      <div className="flex justify-between items-center p-2 cursor-pointer hover:bg-black/10" onClick={() => setExpanded(!expanded)}>
        <span className="text-white font-bold text-sm drop-shadow-sm flex items-center gap-1">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          Embed #{index + 1}
        </span>
        <button onClick={(e) => { e.stopPropagation(); removeEmbed(); }} className="text-white/70 hover:text-white p-1 hover:bg-black/20 rounded">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      {expanded && (
        <div className="p-2 pt-0 ml-4 border-l-4 border-black/20 space-y-1.5">
          <div className="flex items-center gap-2 bg-black/10 p-1.5 rounded-full">
            <span className="text-white text-xs font-bold ml-2">Color:</span>
            <input 
              type="color" 
              value={intToHex(embed.color || 0)} 
              onChange={(e) => updateEmbed({ color: hexToInt(e.target.value) || 0 })}
              className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
            />
          </div>
          <BlockInput value={embed.title || ''} onChange={(e) => updateEmbed({ title: e.target.value })} placeholder="Title" />
          <BlockInput value={embed.url || ''} onChange={(e) => updateEmbed({ url: e.target.value })} placeholder="URL" />
          <BlockInput value={embed.description || ''} onChange={(e) => updateEmbed({ description: e.target.value })} placeholder="Description" multiline />
          
          <ScratchBlock color="bg-[#FFBF00]" title="Author" isCBlock>
            <BlockInput value={embed.author?.name || ''} onChange={(e) => updateEmbed({ author: { ...embed.author, name: e.target.value } })} placeholder="Author Name" />
            <BlockInput value={embed.author?.url || ''} onChange={(e) => updateEmbed({ author: { ...embed.author, name: embed.author?.name || '', url: e.target.value } })} placeholder="Author URL" />
            <BlockInput value={embed.author?.icon_url || ''} onChange={(e) => updateEmbed({ author: { ...embed.author, name: embed.author?.name || '', icon_url: e.target.value } })} placeholder="Author Icon URL" />
          </ScratchBlock>

          <ScratchBlock color="bg-[#FF6680]" title="Images" isCBlock>
            <BlockInput value={embed.image?.url || ''} onChange={(e) => updateEmbed({ image: { url: e.target.value } })} placeholder="Image URL" />
            <BlockInput value={embed.thumbnail?.url || ''} onChange={(e) => updateEmbed({ thumbnail: { url: e.target.value } })} placeholder="Thumbnail URL" />
          </ScratchBlock>

          <ScratchBlock color="bg-[#FF8C1A]" title="Footer & Timestamp" isCBlock>
            <BlockInput value={embed.footer?.text || ''} onChange={(e) => updateEmbed({ footer: { ...embed.footer, text: e.target.value } })} placeholder="Footer Text" />
            <BlockInput value={embed.footer?.icon_url || ''} onChange={(e) => updateEmbed({ footer: { ...embed.footer, text: embed.footer?.text || '', icon_url: e.target.value } })} placeholder="Footer Icon URL" />
            <BlockInput value={embed.timestamp || ''} onChange={(e) => updateEmbed({ timestamp: e.target.value })} placeholder="Timestamp (ISO 8601)" />
          </ScratchBlock>

          <div className="mt-2">
            {embed.fields?.map((field, fIndex) => (
              <ScratchBlock 
                key={fIndex} 
                color="bg-[#4CBF56]" 
                title={`Field ${fIndex + 1}`} 
                onRemove={() => {
                  playDeleteSound();
                  const newFields = [...(embed.fields || [])];
                  newFields.splice(fIndex, 1);
                  updateEmbed({ fields: newFields });
                }}
                isCBlock
              >
                <BlockInput value={field.name} onChange={(e) => {
                  const newFields = [...(embed.fields || [])];
                  newFields[fIndex] = { ...field, name: e.target.value };
                  updateEmbed({ fields: newFields });
                }} placeholder="Field Name" />
                <BlockInput value={field.value} onChange={(e) => {
                  const newFields = [...(embed.fields || [])];
                  newFields[fIndex] = { ...field, value: e.target.value };
                  updateEmbed({ fields: newFields });
                }} placeholder="Field Value" multiline />
                <label className="flex items-center gap-2 text-white text-xs font-bold ml-2">
                  <input 
                    type="checkbox" 
                    checked={field.inline}
                    onChange={(e) => {
                      const newFields = [...(embed.fields || [])];
                      newFields[fIndex] = { ...field, inline: e.target.checked };
                      updateEmbed({ fields: newFields });
                    }}
                    className="accent-white w-4 h-4"
                  />
                  Inline
                </label>
              </ScratchBlock>
            ))}
            <button
                onClick={() => { playButtonSound(); updateEmbed({ fields: [...(embed.fields || []), { name: 'New Field', value: 'Value', inline: true }] }); }}
                className="w-full py-1.5 mt-1 bg-[#4CBF56] hover:bg-[#3da846] text-white text-xs font-bold rounded-full shadow-sm border-b-4 border-black/20 transition-colors flex items-center justify-center gap-1"
            >
                <Plus className="w-3 h-3" /> Add Field
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const BlockEditor: React.FC<BlockEditorProps> = ({ message, onChange, onUndo, onRedo, canUndo, canRedo }) => {
  
  const updateMessage = (updates: Partial<DiscordWebhookMessage>) => {
    onChange({ ...message, ...updates });
  };

  return (
    <div className="h-full bg-[#f9f9f9] dark:bg-[#1e1e1e] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col">
      <div className="bg-white dark:bg-[#252526] px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
        <span className="text-zinc-500 dark:text-zinc-400 text-sm font-bold uppercase tracking-widest">Scratch Blocks</span>
        <div className="flex items-center gap-2">
           {onUndo && (
             <button onClick={() => { playButtonSound(); onUndo(); }} disabled={!canUndo} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30">
               <Undo className="w-4 h-4" />
             </button>
           )}
           {onRedo && (
             <button onClick={() => { playButtonSound(); onRedo(); }} disabled={!canRedo} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30">
               <Redo className="w-4 h-4" />
             </button>
           )}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-[#e9eef2] dark:bg-[#121212]">
        <div className="max-w-3xl mx-auto">
            
            <div className="bg-[#FFBF00] rounded-t-xl px-4 py-2 border-b-4 border-black/20 inline-block mb-[-4px] relative z-10">
              <span className="text-white font-bold drop-shadow-sm flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white/50" /> When webhook executes
              </span>
            </div>

            <div className="space-y-1">
              <ScratchBlock color="bg-[#4C97FF]" title="Message Content">
                <BlockInput 
                  value={message.content || ''} 
                  onChange={(e) => updateMessage({ content: e.target.value })} 
                  placeholder="Type message..." 
                  multiline 
                />
              </ScratchBlock>

              {message.embeds?.map((embed, index) => (
                  <EmbedBlock key={index} embed={embed} index={index} message={message} onChange={updateMessage} />
              ))}

              <button
                  onClick={() => { playButtonSound(); updateMessage({ embeds: [...(message.embeds || []), { title: 'New Embed', description: '', color: 0 }] }); }}
                  className="w-full py-2 bg-[#9966FF] hover:bg-[#855cd6] text-white font-bold rounded-lg shadow-sm border-b-4 border-black/20 transition-colors flex items-center justify-center gap-2"
              >
                  <Plus className="w-4 h-4" /> Add Embed
              </button>
            </div>
            
        </div>
      </div>
    </div>
  );
};
