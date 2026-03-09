import React, { useState, useEffect } from 'react';
import { WebhookEditor } from './components/WebhookEditor';
import { MessagePreview } from './components/MessagePreview';
import { CodeEditor } from './components/CodeEditor';
import { NodeEditor } from './components/NodeEditor';
import { BlockEditor } from './components/BlockEditor';
import { LogPanel, LogEntry } from './components/LogPanel';
import { TemplatesPanel } from './components/TemplatesPanel';
import { AccountPanel } from './components/AccountPanel';
import { DiscordWebhookMessage, DEFAULT_MESSAGE } from './types';
import { Moon, Sun, Trash2, FileJson, Copy, Check, Layout, Code, Box, GitGraph, Plus, Settings, Terminal, FileText, User, Eye, EyeOff, X, Type, Webhook, Volume2, VolumeX, Menu, Layers, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/utils';
import { Toaster } from 'sonner';
import { toast } from '@/utils/toast';
import { getMuted, setMuted, playButtonSound, playSendSound, playDeleteSound } from '@/utils/sounds';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [messages, setMessages] = useState<DiscordWebhookMessage[]>([DEFAULT_MESSAGE]);
  const [activeMessageIndex, setActiveMessageIndex] = useState(0);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showJson, setShowJson] = useState(false);
  const [showWebhookManager, setShowWebhookManager] = useState(false);
  const [showMessageManager, setShowMessageManager] = useState(false);
  const [messageManagerTab, setMessageManagerTab] = useState<'stack' | 'edit'>('stack');
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearRemoveWebhook, setClearRemoveWebhook] = useState(false);
  const [clearHardReset, setClearHardReset] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [showTextOptionsModal, setShowTextOptionsModal] = useState(false);
  const [stackSelectMode, setStackSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<number[]>([]);
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(false);
  const [translateTo, setTranslateTo] = useState('en');
  const [isMutedState, setIsMutedState] = useState(getMuted());
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'code' | 'block' | 'node' | 'logs' | 'templates' | 'account'>('editor');
  const [savedWebhooks, setSavedWebhooks] = useState<{ name: string, url: string }[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoCorrectEnabled, setAutoCorrectEnabled] = useState(false);
  const [channelName, setChannelName] = useState("general");

  // Undo/Redo History
  const [history, setHistory] = useState<DiscordWebhookMessage[]>([DEFAULT_MESSAGE]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Logging helper
  const addLog = (message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    setLogs(prev => [...prev, {
      id: uuidv4(),
      timestamp: new Date(),
      level,
      message
    }]);
  };

  const [webhookData, setWebhookData] = useState<{ name?: string, avatar?: string } | null>(null);

  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      setShowMobileWarning(true);
    }
  }, []);

  // Fetch webhook details when URL changes
  useEffect(() => {
    const fetchWebhookDetails = async () => {
      if (!webhookUrl || !webhookUrl.startsWith('http')) {
        setWebhookData(null);
        return;
      }

      try {
        const response = await fetch(webhookUrl);
        if (response.ok) {
          const data = await response.json();
          setWebhookData({
            name: data.name,
            avatar: data.avatar 
              ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png` 
              : undefined
          });
          
          // Set channel name to webhook name as a fallback since we can't get actual channel name
          if (data.name) {
            setChannelName(data.name.toLowerCase().replace(/\s+/g, '-'));
          }
          
          // Clear overrides when a new valid webhook is loaded
          setMessage({ ...message, username: '', avatar_url: '' });
          
          addLog(`Fetched webhook details: ${data.name}`, 'success');
        }
      } catch (error) {
        console.error("Failed to fetch webhook details", error);
        // Don't log error here to avoid spamming logs while typing
      }
    };

    const timeoutId = setTimeout(fetchWebhookDetails, 1000);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webhookUrl]);

  // Listen for custom event to open account settings
  useEffect(() => {
    const handleOpenAccount = () => setActiveTab('account');
    document.addEventListener('OPEN_ACCOUNT_SETTINGS', handleOpenAccount);
    return () => document.removeEventListener('OPEN_ACCOUNT_SETTINGS', handleOpenAccount);
  }, []);

  // Current message helper
  const message = messages[activeMessageIndex];
  
  const setMessage = (newMessage: DiscordWebhookMessage) => {
    const newMessages = [...messages];
    newMessages[activeMessageIndex] = newMessage;
    setMessages(newMessages);

    // Add to history if different
    const currentHistory = history.slice(0, historyIndex + 1);
    const lastState = currentHistory[currentHistory.length - 1];
    
    // Simple JSON comparison to avoid duplicates
    if (JSON.stringify(lastState) !== JSON.stringify(newMessage)) {
        const newHistory = [...currentHistory, newMessage];
        // Limit history size to 50
        if (newHistory.length > 50) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        const prevMsg = history[newIndex];
        setHistoryIndex(newIndex);
        
        const newMessages = [...messages];
        newMessages[activeMessageIndex] = prevMsg;
        setMessages(newMessages);
        toast.success("Undone");
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        const nextMsg = history[newIndex];
        setHistoryIndex(newIndex);
        
        const newMessages = [...messages];
        newMessages[activeMessageIndex] = nextMsg;
        setMessages(newMessages);
        toast.success("Redone");
    }
  };

  const handleClear = () => {
    playButtonSound();
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
    playDeleteSound();
    const emptyMessage = { content: '', embeds: [] };
    
    if (clearHardReset) {
      setMessages([emptyMessage]);
      setActiveMessageIndex(0);
      setHistory([emptyMessage]);
      setHistoryIndex(0);
    } else {
      const newMessages = [...messages];
      newMessages[activeMessageIndex] = { ...newMessages[activeMessageIndex], content: '', embeds: [], files: [] };
      setMessages(newMessages);
    }
    
    if (clearRemoveWebhook) {
      setWebhookUrl('');
    }
    
    setShowClearConfirm(false);
    toast.success("Cleared successfully.");
    addLog("Cleared messages", 'warn');
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(message, null, 2));
    setCopied(true);
    toast.success("JSON copied to clipboard");
    addLog("Copied JSON to clipboard", 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const addNewMessage = () => {
    setMessages([...messages, { ...DEFAULT_MESSAGE, content: "New Message" }]);
    setActiveMessageIndex(messages.length);
    toast.success("New message added to stack");
    addLog("Added new message to stack", 'info');
  };

  const removeMessage = (index: number) => {
    if (messages.length <= 1) return;
    const newMessages = messages.filter((_, i) => i !== index);
    setMessages(newMessages);
    if (activeMessageIndex >= index && activeMessageIndex > 0) {
      setActiveMessageIndex(activeMessageIndex - 1);
    }
    addLog(`Removed message #${index + 1}`, 'warn');
  };

  const tabs = [
    { id: 'editor', label: 'Editor', icon: Layout },
    { id: 'code', label: 'Code', icon: Code },
    { id: 'block', label: 'Block', icon: Box },
    { id: 'node', label: 'Node', icon: GitGraph },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'logs', label: 'Logs', icon: Terminal },
    { id: 'account', label: 'Account', icon: User },
  ] as const;

  const [editMessageUrl, setEditMessageUrl] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const handleLoadMessage = async () => {
    if (!webhookUrl) {
        toast.error("Please ensure a Webhook URL is set first.");
        return;
    }

    // Extract Message ID from URL
    const match = editMessageUrl.match(/channels\/\d+\/\d+\/(\d+)/);
    if (!match) {
        toast.error("Invalid Discord Message URL format.");
        return;
    }
    const messageId = match[1];

    const toastId = toast.loading("Fetching message...");

    try {
        const fetchUrl = `${webhookUrl}/messages/${messageId}`;
        const response = await fetch(fetchUrl);

        if (response.ok) {
            const data = await response.json();
            
            // Transform Discord Message Object to our DiscordWebhookMessage format
            const loadedMessage: DiscordWebhookMessage = {
                content: data.content,
                username: data.author?.username,
                avatar_url: data.author?.avatar ? `https://cdn.discordapp.com/avatars/${data.author.id}/${data.author.avatar}.png` : undefined,
                embeds: data.embeds,
                components: data.components,
                // Attachments are not easily editable via webhook without re-uploading, ignoring for now or could handle as links
            };

            setMessage(loadedMessage);
            setEditingMessageId(messageId);
            setEditMessageUrl('');
            toast.success("Message loaded for editing!", { id: toastId });
            addLog(`Loaded message ${messageId} for editing`, 'success');
        } else {
            const text = await response.text();
            toast.error(`Failed to fetch: ${response.status}`, { description: text, id: toastId });
            addLog(`Failed to fetch message: ${text}`, 'error');
        }
    } catch (error) {
        toast.error(`Error fetching message: ${error}`, { id: toastId });
        addLog(`Error fetching message: ${error}`, 'error');
    }
  };

  const handleSend = async (msgToSend?: DiscordWebhookMessage) => {
    const targetMessage = msgToSend || message;
    if (!webhookUrl) {
      toast.error("Please enter a Webhook URL first.");
      addLog("Attempted to send without Webhook URL", 'error');
      return;
    }

    // Validation: Must have content, embeds, or files
    if (!targetMessage.content && (!targetMessage.embeds || targetMessage.embeds.length === 0) && (!targetMessage.files || targetMessage.files.length === 0)) {
      toast.error("Message cannot be empty. Add content, an embed, or a file.");
      addLog("Attempted to send empty message", 'warn');
      return;
    }

    setIsSending(true);
    playSendSound();
    const action = editingMessageId ? "Updating" : "Sending";
    addLog(`${action} message...`, 'info');
    
    const toastId = toast.loading(`${action} message...`);

    // Sanitize message payload
    const payload = { ...targetMessage };
    if (!payload.username) delete payload.username;
    if (!payload.avatar_url) delete payload.avatar_url;
    
    // Remove internal fields
    const botToken = payload.bot_token;
    const autoReactions = payload.auto_reactions;
    delete payload.bot_token;
    delete payload.auto_reactions;
    delete payload.use_bot_token;

    try {
      let body: string | FormData;
      const headers: Record<string, string> = {};

      if (payload.files && payload.files.length > 0) {
        const formData = new FormData();
        formData.append('payload_json', JSON.stringify(payload));
        payload.files.forEach((f, i) => {
           if (f.file) {
             formData.append(`files[${i}]`, f.file);
           }
        });
        body = formData;
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(payload);
      }

      let sendUrl = webhookUrl;
      let method = 'POST';

      if (editingMessageId) {
          sendUrl = `${webhookUrl}/messages/${editingMessageId}`;
          method = 'PATCH';
      } else {
          // Append wait=true if we need to add reactions (to get the message ID)
          const shouldWait = autoReactions && autoReactions.length > 0 && botToken;
          if (shouldWait) sendUrl = `${webhookUrl}?wait=true`;
      }

      const response = await fetch(sendUrl, {
        method,
        headers,
        body,
      });

      if (response.ok) {
        toast.success(`Message ${editingMessageId ? "updated" : "sent"} successfully!`, { id: toastId });
        addLog(`Message ${editingMessageId ? "updated" : "sent"} successfully`, 'success');
        
        if (editingMessageId) {
            setEditingMessageId(null); // Exit edit mode
        }

        // Handle Auto Reactions (Only for new messages or if we want to add to existing?)
        // Usually auto-reactions are for new messages. Adding to existing might duplicate.
        // Let's only do it for new messages for now, or if specifically requested.
        // The user didn't specify, but "like sending a new message" implies full functionality.
        // However, we don't get the ID back from a PATCH usually unless we ask?
        // PATCH returns the message object.
        
        if (!editingMessageId) {
            const shouldWait = autoReactions && autoReactions.length > 0 && botToken;
            if (shouldWait) {
                try {
                    const responseData = await response.json();
                    const messageId = responseData.id;
                    const channelId = responseData.channel_id;
                    
                    if (messageId && channelId && botToken) {
                        addLog(`Adding ${autoReactions!.length} reactions...`, 'info');
                        for (const emoji of autoReactions!) {
                            const encodedEmoji = encodeURIComponent(emoji);
                            const reactionUrl = `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}/@me`;
                            
                            await fetch(reactionUrl, {
                                method: 'PUT',
                                headers: {
                                    'Authorization': `Bot ${botToken}`,
                                    'Content-Type': 'application/json'
                                }
                            });
                            await new Promise(r => setTimeout(r, 500));
                        }
                        addLog("Reactions added successfully", 'success');
                        toast.success("Reactions added!");
                    }
                } catch (reactionError) {
                    console.error("Failed to add reactions", reactionError);
                }
            }
        }

      } else {
        const text = await response.text();
        let errorMsg = text;
        try {
            const jsonError = JSON.parse(text);
            if (jsonError.message) errorMsg = jsonError.message;
        } catch {
            // Ignore JSON parse error
        }
        
        toast.error(`Failed to ${editingMessageId ? "update" : "send"}: ${response.status}`, { description: errorMsg, id: toastId });
        addLog(`Failed to ${editingMessageId ? "update" : "send"}: ${response.status} - ${errorMsg}`, 'error');
      }
    } catch (error) {
      toast.error(`Error: ${error}`, { id: toastId });
      addLog(`Network error: ${error}`, 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-[#111214] text-zinc-900 dark:text-zinc-100 transition-colors duration-200 flex flex-col">
      <Toaster position="top-center" theme="dark" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#1e1f22]/80 backdrop-blur-md border-b border-zinc-200 dark:border-[#111214]">
        <div className="w-full px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-600/20">
              <Webhook className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight hidden sm:block">DisCord WebHook Manager [EQN]</h1>
            <h1 className="font-bold text-xl tracking-tight sm:hidden">DWM [EQN]</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newMuted = !isMutedState;
                setIsMutedState(newMuted);
                setMuted(newMuted);
                if (!newMuted) playButtonSound();
              }}
              className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title={isMutedState ? "Unmute Sounds" : "Mute Sounds"}
            >
              {isMutedState ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-1" />
            <button
              onClick={() => { playButtonSound(); setShowMobilePreview(!showMobilePreview); }}
              className="xl:hidden p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title={showMobilePreview ? "Hide Preview" : "Show Preview"}
            >
              {showMobilePreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-1 xl:hidden" />
            
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => { playSendSound(); handleSend(); }}
                disabled={isSending || !webhookUrl}
                className="px-3 py-1.5 text-xs font-medium bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" /> <span>Send</span>
              </button>
              <button
                onClick={() => { playButtonSound(); setShowWebhookManager(true); }}
                className="px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" /> <span>Webhook Settings</span>
              </button>
              <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-1" />
              <button
                onClick={() => { playButtonSound(); setShowTextOptionsModal(true); }}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  autoCorrectEnabled || spellCheckEnabled ? "text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
                title="Text Options"
              >
                <Type className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-1" />
              <button
                onClick={() => { playButtonSound(); setShowJson(!showJson); }}
                className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="JSON Editor"
              >
                <FileJson className="w-5 h-5" />
              </button>
              <button
                onClick={handleClear}
                className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Clear All"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex pb-16 sm:pb-0">
        
        {/* Left Sidebar Menu (Desktop) */}
        <div className="hidden sm:flex w-20 bg-white dark:bg-[#1e1f22] border-r border-zinc-200 dark:border-[#111214] flex-col items-center py-4 gap-2 z-40">
           {tabs.map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={cn(
                 "w-full py-3 transition-all duration-200 flex flex-col items-center gap-1 group relative rounded-xl hover:shadow-md",
                 activeTab === tab.id 
                   ? "text-cyan-500 bg-cyan-50/50 dark:bg-cyan-900/20 shadow-sm" 
                   : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
               )}
               title={tab.label}
             >
               {activeTab === tab.id && (
                 <motion.div 
                   layoutId="activeTabBackground"
                   className="absolute inset-0 bg-cyan-500/10 rounded-xl"
                 />
               )}
               <tab.icon className="w-6 h-6 relative z-10" />
               <span className="text-[10px] font-medium relative z-10">{tab.label}</span>
               {activeTab === tab.id && (
                 <motion.div 
                   layoutId="activeTabIndicator"
                   className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-cyan-500 rounded-l-full shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                 />
               )}
             </button>
           ))}
           
           {/* Message Stack Manager Button */}
           <div className="flex flex-col gap-2 w-full px-2 items-center mt-auto mb-4">
             <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800 my-1" />
             <button
               onClick={() => { playButtonSound(); setShowMessageManager(true); }}
               className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
               title="Message Manager"
             >
               <Layers className="w-5 h-5" />
             </button>
           </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Editor Area */}
          <div className="flex-1 h-full overflow-hidden relative">
            <div className="absolute inset-0 p-4 lg:p-6 overflow-y-auto custom-scrollbar">
              {activeTab === 'editor' && (
                <WebhookEditor
                  message={message}
                  onChange={setMessage}
                  webhookUrl={webhookUrl}
                  setWebhookUrl={setWebhookUrl}
                  onSend={handleSend}
                  isSending={isSending}
                  addLog={addLog}
                  webhookData={webhookData}
                  editingMessageId={editingMessageId}
                  onCancelEdit={() => setEditingMessageId(null)}
                  autoCorrectEnabled={autoCorrectEnabled}
                  spellCheckEnabled={spellCheckEnabled}
                />
              )}
              {activeTab === 'code' && (
                <CodeEditor 
                    message={message} 
                    onChange={setMessage} 
                    onUndo={undo} 
                    onRedo={redo}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < history.length - 1}
                />
              )}
              {activeTab === 'block' && (
                <BlockEditor 
                    message={message} 
                    onChange={setMessage}
                    onUndo={undo} 
                    onRedo={redo}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < history.length - 1}
                />
              )}
              {activeTab === 'node' && (
                <NodeEditor message={message} onChange={setMessage} />
              )}
              {activeTab === 'logs' && (
                <LogPanel logs={logs} onClear={() => setLogs([])} />
              )}
              {activeTab === 'templates' && (
                <TemplatesPanel 
                  currentMessage={message} 
                  onApply={(msg) => {
                    setMessage(msg);
                    addLog("Applied template", 'info');
                  }} 
                />
              )}
              {activeTab === 'account' && (
                <AccountPanel />
              )}
            </div>
          </div>

          {/* Preview Column (Responsive) */}
          <div className={cn(
            "fixed inset-0 z-[60] bg-white dark:bg-[#111214] xl:static xl:block xl:w-[400px] border-l border-zinc-200 dark:border-[#111214] transition-transform duration-300 ease-in-out overflow-x-hidden overflow-y-auto",
            showMobilePreview ? "translate-x-0" : "translate-x-full xl:translate-x-0"
          )}>
             <div className="h-full p-4 flex flex-col bg-zinc-50 dark:bg-[#111214]">
                <div className="flex items-center justify-between mb-4 xl:mb-4">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Live Preview</h3>
                    <div className="flex items-center gap-2">
                        <button
                          onClick={() => { playButtonSound(); setDarkMode(!darkMode); }}
                          className="p-1.5 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                        <button 
                            onClick={() => { playButtonSound(); setShowMobilePreview(false); }} 
                            className="xl:hidden p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className={`${darkMode ? 'bg-[#313338] border-[#1e1f22]' : 'bg-[#ffffff] border-[#e3e5e8]'} rounded-xl shadow-2xl overflow-hidden flex-1 border`}>
                  <div className={`h-10 ${darkMode ? 'bg-[#1e1f22] border-[#111214]' : 'bg-[#f2f3f5] border-[#e3e5e8]'} flex items-center px-4 gap-2 border-b`}>
                    <div className={`${darkMode ? 'text-[#949BA4]' : 'text-[#5c5e66]'} font-bold text-sm`}># {channelName}</div>
                  </div>
                  <div className="p-0 h-[calc(100%-2.5rem)] overflow-y-auto overflow-x-hidden custom-scrollbar">
                    <MessagePreview message={message} webhookData={webhookData} darkMode={darkMode} />
                  </div>
                </div>
             </div>
          </div>

        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1e1f22] border-t border-zinc-200 dark:border-[#111214] flex justify-around items-center h-16 z-50">
        <button
          onClick={() => setActiveTab('editor')}
          className={cn("flex flex-col items-center justify-center w-full h-full", activeTab === 'editor' ? "text-cyan-500" : "text-zinc-500")}
        >
          <Layout className="w-6 h-6" />
          <span className="text-[10px] font-medium mt-1">Editor</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={cn("flex flex-col items-center justify-center w-full h-full", activeTab === 'logs' ? "text-cyan-500" : "text-zinc-500")}
        >
          <Terminal className="w-6 h-6" />
          <span className="text-[10px] font-medium mt-1">Logs</span>
        </button>
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className={cn("flex flex-col items-center justify-center w-full h-full", showMobileMenu ? "text-cyan-500" : "text-zinc-500")}
        >
          <Menu className="w-6 h-6" />
          <span className="text-[10px] font-medium mt-1">Menu</span>
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <div className="sm:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}>
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-16 left-0 right-0 bg-white dark:bg-[#1e1f22] rounded-t-2xl p-4 shadow-xl border-t border-zinc-200 dark:border-[#111214]"
            onClick={e => e.stopPropagation()}
          >
            <div className="grid grid-cols-4 gap-4">
              {tabs.filter(t => t.id !== 'editor' && t.id !== 'logs').map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setShowMobileMenu(false); }}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl transition-colors",
                    activeTab === tab.id ? "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-500" : "bg-zinc-50 dark:bg-zinc-900 text-zinc-500"
                  )}
                >
                  <tab.icon className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </button>
              ))}
              <button
                onClick={() => { playButtonSound(); setShowMessageManager(true); setShowMobileMenu(false); }}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-500 transition-colors"
              >
                <Layers className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">Manager</span>
              </button>
              <button
                onClick={() => { playButtonSound(); setShowWebhookManager(true); setShowMobileMenu(false); }}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-500 transition-colors"
              >
                <Settings className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">Webhooks</span>
              </button>
              <button
                onClick={() => { playButtonSound(); setShowTextOptionsModal(true); setShowMobileMenu(false); }}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-500 transition-colors"
              >
                <Type className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">Text Opts</span>
              </button>
              <button
                onClick={() => { playButtonSound(); setShowJson(true); setShowMobileMenu(false); }}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-500 transition-colors"
              >
                <FileJson className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">JSON</span>
              </button>
              <button
                onClick={() => { playButtonSound(); handleClear(); setShowMobileMenu(false); }}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-red-500 transition-colors"
              >
                <Trash2 className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">Clear All</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Message Manager Modal */}
      {showMessageManager && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-lg">Message Manager</h3>
              <button onClick={() => { playButtonSound(); setShowMessageManager(false); }} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md">
                <span className="sr-only">Close</span>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex items-center gap-4 px-4 pt-4 border-b border-zinc-200 dark:border-zinc-800">
                <button 
                    onClick={() => { playButtonSound(); setMessageManagerTab('stack'); }}
                    className={cn(
                        "pb-2 text-sm font-medium transition-colors border-b-2",
                        messageManagerTab === 'stack' ? "border-cyan-500 text-cyan-500" : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    )}
                >
                    Message Stack
                </button>
                <button 
                    onClick={() => { playButtonSound(); setMessageManagerTab('edit'); }}
                    className={cn(
                        "pb-2 text-sm font-medium transition-colors border-b-2",
                        messageManagerTab === 'edit' ? "border-cyan-500 text-cyan-500" : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    )}
                >
                    Edit Sent Message
                </button>
            </div>

            <div className="p-4 space-y-4">
                {messageManagerTab === 'stack' && (
                    <>
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-zinc-500">
                                Manage multiple messages in your stack.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        playButtonSound();
                                        setStackSelectMode(!stackSelectMode);
                                        setSelectedMessages([]);
                                    }}
                                    className={cn(
                                        "text-xs flex items-center gap-1 font-medium px-2 py-1 rounded transition-colors",
                                        stackSelectMode ? "bg-cyan-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                    )}
                                >
                                    Select
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {messages.map((msg, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => {
                                        playButtonSound();
                                        if (stackSelectMode) {
                                            if (selectedMessages.includes(idx)) {
                                                setSelectedMessages(selectedMessages.filter(i => i !== idx));
                                            } else {
                                                setSelectedMessages([...selectedMessages, idx]);
                                            }
                                        } else {
                                            setActiveMessageIndex(idx);
                                        }
                                    }}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                                        stackSelectMode && selectedMessages.includes(idx)
                                            ? "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-500 ring-1 ring-cyan-500"
                                            : activeMessageIndex === idx && !stackSelectMode
                                                ? "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-500 ring-1 ring-cyan-500" 
                                                : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        {stackSelectMode ? (
                                            <div className={cn(
                                                "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                                selectedMessages.includes(idx) ? "bg-cyan-500 border-cyan-500 text-white" : "border-zinc-300 dark:border-zinc-600"
                                            )}>
                                                {selectedMessages.includes(idx) && <Check className="w-3 h-3" />}
                                            </div>
                                        ) : (
                                            <div className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                                activeMessageIndex === idx ? "bg-cyan-500 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                                            )}>
                                                {idx + 1}
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium truncate max-w-[150px]">
                                                {msg.content || (msg.embeds?.[0]?.title) || "Empty Message"}
                                            </span>
                                            <span className="text-[10px] text-zinc-500">
                                                {msg.embeds?.length || 0} embeds • {msg.files?.length || 0} files
                                            </span>
                                        </div>
                                    </div>
                                    {messages.length > 1 && !stackSelectMode && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); playDeleteSound(); removeMessage(idx); }}
                                            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {!stackSelectMode && (
                            <button
                                onClick={() => { playButtonSound(); addNewMessage(); }}
                                className="w-full py-2 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-500 hover:text-cyan-500 hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/10 transition-all flex items-center justify-center gap-2 font-medium text-sm"
                            >
                                <Plus className="w-4 h-4" /> Add New Message
                            </button>
                        )}
                    </>
                )}

                {messageManagerTab === 'edit' && (
                    <div className="space-y-4">
                        <p className="text-sm text-zinc-500">
                            Paste the URL of the message you want to edit. This will load the message content into the editor.
                            <br/>
                            <span className="text-xs text-amber-500">Note: You can only edit messages sent by the current Webhook.</span>
                        </p>
                        <input 
                            value={editMessageUrl}
                            onChange={(e) => setEditMessageUrl(e.target.value)}
                            placeholder="https://discord.com/channels/..."
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-white"
                        />
                        <div className="flex justify-end gap-2">
                            <button 
                                onClick={handleLoadMessage}
                                disabled={isSending || !editMessageUrl}
                                className="px-4 py-2 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSending ? 'Loading...' : 'Load Message'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {messageManagerTab === 'stack' && (
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 rounded-b-xl flex gap-2">
                    <button 
                        onClick={async () => {
                            playSendSound();
                            setShowMessageManager(false);
                            const msgsToSend = stackSelectMode && selectedMessages.length > 0 
                                ? selectedMessages.map(i => messages[i]) 
                                : messages;
                            
                            for (let i = 0; i < msgsToSend.length; i++) {
                                const actualIndex = messages.indexOf(msgsToSend[i]);
                                setActiveMessageIndex(actualIndex);
                                await new Promise(r => setTimeout(r, 100)); // small delay to update state
                                await handleSend(msgsToSend[i]);
                                await new Promise(r => setTimeout(r, 1000)); // delay between sends
                            }
                        }}
                        className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold text-sm transition-opacity"
                    >
                        {stackSelectMode && selectedMessages.length > 0 ? `Send Selected (${selectedMessages.length})` : "Send All"}
                    </button>
                    <button 
                        onClick={() => { playButtonSound(); setShowMessageManager(false); }}
                        className="flex-1 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
                    >
                        Done
                    </button>
                </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Text Options Modal */}
      {showTextOptionsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-lg flex items-center gap-2"><Type className="w-5 h-5" /> Text Options</h3>
              <button onClick={() => { playButtonSound(); setShowTextOptionsModal(false); }} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md">
                <span className="sr-only">Close</span>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-6">
              {/* Spell Check */}
              <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium text-zinc-900 dark:text-white">Spell Check</h4>
                    <p className="text-xs text-zinc-500">Highlight spelling errors in the editor.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={spellCheckEnabled} onChange={() => { playButtonSound(); setSpellCheckEnabled(!spellCheckEnabled); }} />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 dark:bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-cyan-600"></div>
                </label>
              </div>

              {/* Translate To */}
              <div className="space-y-2">
                <div>
                    <h4 className="font-medium text-zinc-900 dark:text-white">Translate To</h4>
                    <p className="text-xs text-zinc-500">Select a language to translate your message to.</p>
                </div>
                <select 
                    value={translateTo}
                    onChange={(e) => setTranslateTo(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="ru">Russian</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                    <option value="zh">Chinese (Simplified)</option>
                    <option value="hi">Hindi</option>
                    <option value="ar">Arabic</option>
                </select>
              </div>

              {/* Auto Correct */}
              <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium text-zinc-900 dark:text-white">Auto Correct</h4>
                    <p className="text-xs text-zinc-500">Automatically correct grammar and spelling.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={autoCorrectEnabled} onChange={() => { playButtonSound(); setAutoCorrectEnabled(!autoCorrectEnabled); }} />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 dark:bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-cyan-600"></div>
                </label>
              </div>
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2 bg-zinc-50 dark:bg-zinc-950/50 rounded-b-xl">
               <button 
                onClick={() => { playButtonSound(); setShowTextOptionsModal(false); }}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
               >
                 Close
               </button>
               <button 
                onClick={() => { playButtonSound(); toast.success("Text options applied!"); setShowTextOptionsModal(false); }}
                className="px-4 py-2 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
               >
                 Apply & Save
               </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* JSON Modal */}
      {showJson && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-lg">JSON Editor</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyJson}
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md text-sm font-medium transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button onClick={() => setShowJson(false)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md">
                  <span className="sr-only">Close</span>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden p-0 relative">
              <textarea
                className="w-full h-full p-4 bg-zinc-50 dark:bg-[#0d0d0d] font-mono text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 resize-none focus:outline-none"
                defaultValue={JSON.stringify(message, null, 2)}
                spellCheck={false}
                id="json-editor-textarea"
              />
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
               <button 
                onClick={() => setShowJson(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
               >
                 Cancel
               </button>
               <button 
                onClick={() => {
                  const textarea = document.getElementById('json-editor-textarea') as HTMLTextAreaElement;
                  try {
                    const parsed = JSON.parse(textarea.value);
                    setMessage(parsed);
                    setShowJson(false);
                    toast.success("JSON applied successfully");
                    addLog("Applied JSON from editor", 'info');
                  } catch (err) {
                    toast.error("Invalid JSON: " + err);
                    addLog(`JSON Parse Error: ${err}`, 'error');
                  }
                }}
                className="px-4 py-2 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
               >
                 Apply Changes
               </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Webhook Manager Modal */}
      {showWebhookManager && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-lg flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-lg">Webhook Manager</h3>
              <button onClick={() => setShowWebhookManager(false)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md">
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-zinc-500">
                Paste your Discord Webhook URL below. This allows you to send messages to a specific channel.
              </p>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-500">Current Webhook URL</label>
                <input 
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-sm dark:text-white"
                  placeholder="https://discord.com/api/webhooks/..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-500">Channel Name (for Preview)</label>
                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2">
                    <span className="text-zinc-400 text-sm">#</span>
                    <input 
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      className="flex-1 bg-transparent text-sm dark:text-white focus:outline-none"
                      placeholder="general"
                    />
                </div>
              </div>
              
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                <h4 className="text-sm font-bold mb-2">Saved Webhooks</h4>
                {savedWebhooks.length === 0 && (
                  <p className="text-xs text-zinc-500 italic">No saved webhooks yet.</p>
                )}
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {savedWebhooks.map((wh, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 p-2 rounded border border-zinc-200 dark:border-zinc-800">
                      <span className="text-sm font-medium truncate max-w-[200px]">{wh.name}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setWebhookUrl(wh.url); setShowWebhookManager(false); toast.success(`Loaded webhook: ${wh.name}`); addLog(`Loaded webhook: ${wh.name}`, 'info'); }}
                          className="text-xs bg-cyan-500/10 text-cyan-500 px-2 py-1 rounded hover:bg-cyan-500/20"
                        >
                          Load
                        </button>
                        <button 
                          onClick={() => { playDeleteSound(); setSavedWebhooks(savedWebhooks.filter((_, i) => i !== idx)); }}
                          className="text-zinc-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <input id="new-wh-name" placeholder="Name (e.g. General)" className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-md px-2 py-1 text-sm" />
                  <button 
                    onClick={() => {
                      const nameInput = document.getElementById('new-wh-name') as HTMLInputElement;
                      if (nameInput.value && webhookUrl) {
                        setSavedWebhooks([...savedWebhooks, { name: nameInput.value, url: webhookUrl }]);
                        nameInput.value = '';
                        toast.success("Webhook saved!");
                        addLog("Saved new webhook", 'success');
                      } else {
                        toast.error("Enter a name and ensure URL is set.");
                      }
                    }}
                    className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 text-xs font-bold rounded hover:bg-zinc-300 dark:hover:bg-zinc-700"
                  >
                    Save Current
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Clear Confirm Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-[#2b2d31] w-full max-w-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Clear Message?</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                Are you sure you want to clear the current message? This will delete text fields and embeds.
              </p>

              <div className="space-y-3 mb-6">
                <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 cursor-pointer">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Remove the WebHook URL</span>
                  <div className={cn("w-10 h-5 rounded-full transition-colors relative", clearRemoveWebhook ? "bg-cyan-500" : "bg-zinc-300 dark:bg-zinc-700")}>
                    <div className={cn("absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform", clearRemoveWebhook ? "translate-x-5" : "")} />
                  </div>
                  <input type="checkbox" className="hidden" checked={clearRemoveWebhook} onChange={() => { playButtonSound(); setClearRemoveWebhook(!clearRemoveWebhook); }} />
                </label>
                
                <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 cursor-pointer">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Hard reset (Delete all message stacks)</span>
                  <div className={cn("w-10 h-5 rounded-full transition-colors relative", clearHardReset ? "bg-red-500" : "bg-zinc-300 dark:bg-zinc-700")}>
                    <div className={cn("absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform", clearHardReset ? "translate-x-5" : "")} />
                  </div>
                  <input type="checkbox" className="hidden" checked={clearHardReset} onChange={() => { playButtonSound(); setClearHardReset(!clearHardReset); }} />
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { playButtonSound(); setShowClearConfirm(false); }}
                  className="px-4 py-2 rounded-lg font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClear}
                  className="px-4 py-2 rounded-lg font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
                >
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Mobile Warning Modal */}
      {showMobileWarning && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden"
          >
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-2">
                <Layout className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-bold text-xl">Mobile Experience</h3>
              <p className="text-sm text-zinc-500">
                This Tool is Not Quite Comfortable with mobile. Do you really want to use it in mobile?
              </p>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
              <button 
                onClick={() => { playButtonSound(); setShowMobileWarning(false); }}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold transition-colors"
              >
                Yes
              </button>
              <button 
                onClick={() => { 
                  playButtonSound(); 
                  const viewport = document.querySelector("meta[name=viewport]");
                  if (viewport) {
                    viewport.setAttribute("content", "width=1024");
                  }
                  setShowMobileWarning(false);
                  toast.info("Attempted to force desktop mode. You may need to use your browser's 'Request Desktop Site' feature.");
                }}
                className="w-full py-3 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold transition-colors"
              >
                Go to desktop mode
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #2b2d31; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1a1b1e; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #111214; 
        }
      `}</style>
    </div>
  );
}

export default App;
