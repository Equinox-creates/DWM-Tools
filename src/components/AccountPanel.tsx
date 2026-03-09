import React, { useState, useEffect } from 'react';
import { User, LogOut, Shield, Star, Lock, Mail, Loader2, ArrowLeft, Trash2, Send, History, Edit, Users } from 'lucide-react';
import { toast } from '../utils/toast';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { DiscordWebhookMessage } from '../types';
import { playButtonSound, playDeleteSound, playSendSound } from '../utils/sounds';

interface UserTemplate {
  id: string;
  name: string;
  downloads: number;
  message: DiscordWebhookMessage;
}

interface WebhookHistoryItem {
  id: string;
  date: string;
  url: string;
  message: DiscordWebhookMessage;
}

export const AccountPanel: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [stats, setStats] = useState({ templates: 0, downloads: 0 });
  
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [webhookHistory, setWebhookHistory] = useState<WebhookHistoryItem[]>([]);
  
  const [portNumber, setPortNumber] = useState('');
  const [activePort, setActivePort] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<{user: string, text: string}[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('username');
    if (storedUser) {
      setUsername(storedUser);
      setIsLoggedIn(true);
      // Mock data
      setUserTemplates([
        { id: '1', name: 'My Cool Embed', downloads: 142, message: { content: 'Test' } },
        { id: '2', name: 'Announcement', downloads: 89, message: { content: 'Announce' } }
      ]);
      setWebhookHistory([
        { id: '1', date: new Date().toLocaleDateString(), url: 'https://discord.com/api/webhooks/...', message: { content: 'Sent msg 1' } }
      ]);
      setStats({
        templates: 2,
        downloads: 231
      });
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    playButtonSound();
    
    if (mode === 'forgot') {
        if (!email) {
            toast.error("Please enter your email address.");
            return;
        }
        setIsLoading(true);
        try {
            if (auth) {
                await sendPasswordResetEmail(auth, email);
                toast.success("Password reset email sent! Check your inbox.");
                setMode('login');
            } else {
                await new Promise(resolve => setTimeout(resolve, 1500));
                toast.success("Simulation: Password reset email sent!");
                setMode('login');
            }
        } catch (error) {
            console.error("Reset password error:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            toast.error("Failed to send reset email: " + errorMessage);
        } finally {
            setIsLoading(false);
        }
        return;
    }

    if (!email || !password || (mode === 'signup' && !username)) {
        toast.error("Please fill in all fields");
        return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (mode === 'signup') {
        localStorage.setItem('username', username);
        localStorage.setItem('email', email);
        toast.success("Account created successfully!");
    } else {
        const storedName = localStorage.getItem('username') || email.split('@')[0];
        setUsername(storedName);
        toast.success("Welcome back!");
    }

    setIsLoggedIn(true);
    setIsLoading(false);
    setStats({ templates: 2, downloads: 231 });
  };

  const handleLogout = () => {
    playButtonSound();
    setIsLoggedIn(false);
    setUsername('');
    setEmail('');
    setPassword('');
    setActivePort(null);
    toast.success("Logged out successfully.");
  };

  const handleDeleteTemplate = (id: string) => {
    playButtonSound();
    setUserTemplates(prev => prev.filter(t => t.id !== id));
    toast.success("Template deleted.");
  };

  const handleCreatePort = () => {
    playButtonSound();
    const newPort = Math.floor(100000 + Math.random() * 900000).toString();
    setActivePort(newPort);
    toast.success(`Port created: ${newPort}`);
  };

  const handleJoinPort = () => {
    playButtonSound();
    if (portNumber.length === 6) {
      setActivePort(portNumber);
      toast.success(`Joined port: ${portNumber}`);
    } else {
      toast.error("Invalid port number.");
    }
  };

  const handleLeavePort = () => {
    playButtonSound();
    setActivePort(null);
    setChatMessages([]);
    toast.info("Left the port.");
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setChatMessages(prev => [...prev, { user: username, text: chatMessage }]);
    setChatMessage('');
  };

  if (!isLoggedIn) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-[#1e1e1e] rounded-xl border border-zinc-200 dark:border-zinc-800 text-center overflow-y-auto">
        <div className="w-full max-w-sm bg-white dark:bg-[#2b2d31] p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700">
            <div className="flex justify-center mb-6">
                <div className="w-12 h-12 bg-cyan-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-600/20">
                    <Shield className="w-6 h-6 text-white" />
                </div>
            </div>
            
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
                {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
            </h2>
            <p className="text-sm text-zinc-500 mb-8">
                {mode === 'forgot' ? 'Enter your email to receive instructions' : 'to continue to Webhook Manager'}
            </p>
            
            <form onSubmit={handleAuth} className="space-y-4 text-left">
                {mode === 'signup' && (
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="johndoe"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white transition-all"
                            />
                        </div>
                    </div>
                )}
                
                <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white transition-all"
                        />
                    </div>
                </div>

                {mode !== 'forgot' && (
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white transition-all"
                            />
                        </div>
                        {mode === 'login' && (
                            <div className="flex justify-end mt-1">
                                <button 
                                    type="button"
                                    onClick={() => { playButtonSound(); setMode('forgot'); }}
                                    className="text-xs text-cyan-600 hover:text-cyan-500 hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 mt-6"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link')}
                </button>
            </form>

            <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
                {mode === 'forgot' ? (
                    <button 
                        onClick={() => { playButtonSound(); setMode('login'); }}
                        className="flex items-center justify-center gap-2 w-full text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Login
                    </button>
                ) : (
                    <p className="text-xs text-zinc-500">
                        {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                        <button 
                            onClick={() => { playButtonSound(); setMode(mode === 'login' ? 'signup' : 'login'); }}
                            className="ml-1 text-cyan-600 hover:underline font-bold"
                        >
                            {mode === 'login' ? 'Sign up' : 'Log in'}
                        </button>
                    </p>
                )}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1e1e1e] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col items-center relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />
        <div className="w-20 h-20 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3 shadow-xl border-4 border-white dark:border-zinc-700 relative z-10">
          <span className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{username.charAt(0).toUpperCase()}</span>
          <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-zinc-800" title="Online" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white relative z-10">{username}</h2>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center hover:border-cyan-500/50 transition-colors">
            <div className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.templates}</div>
            <div className="text-xs text-zinc-500 uppercase font-bold mt-1">Templates</div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center hover:border-cyan-500/50 transition-colors">
            <div className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.downloads}</div>
            <div className="text-xs text-zinc-500 uppercase font-bold mt-1">Downloads</div>
          </div>
        </div>

        {/* Live Port */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" /> Live Collaboration Port
          </h3>
          {activePort ? (
            <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-cyan-600 dark:text-cyan-400 font-bold uppercase">Active Port</div>
                  <div className="text-2xl font-mono font-bold text-zinc-900 dark:text-white tracking-widest">{activePort}</div>
                </div>
                <button onClick={handleLeavePort} className="px-3 py-1.5 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg text-xs font-bold transition-colors">
                  Leave Port
                </button>
              </div>
              <div className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 h-40 flex flex-col">
                <div className="flex-1 p-2 overflow-y-auto custom-scrollbar space-y-2">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">{msg.user}: </span>
                      <span className="text-zinc-700 dark:text-zinc-300">{msg.text}</span>
                    </div>
                  ))}
                  {chatMessages.length === 0 && <div className="text-xs text-zinc-500 text-center mt-10">No messages yet. Say hi!</div>}
                </div>
                <form onSubmit={sendChatMessage} className="border-t border-zinc-200 dark:border-zinc-800 p-2 flex gap-2">
                  <input type="text" value={chatMessage} onChange={e => setChatMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-cyan-500" />
                  <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white p-1.5 rounded"><Send className="w-4 h-4" /></button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleCreatePort} className="flex-1 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-sm font-bold transition-colors">
                Create Port
              </button>
              <div className="flex-1 flex gap-1">
                <input type="text" value={portNumber} onChange={e => setPortNumber(e.target.value)} placeholder="123456" className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500" maxLength={6} />
                <button onClick={handleJoinPort} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-bold transition-colors">
                  Join
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sent Templates */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Star className="w-4 h-4" /> Your Templates
          </h3>
          <div className="space-y-2">
            {userTemplates.map(template => (
              <div key={template.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div>
                  <div className="text-sm font-bold dark:text-white">{template.name}</div>
                  <div className="text-xs text-zinc-500">{template.downloads} downloads</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { playSendSound(); toast.success("Template sent!"); }} className="p-1.5 text-zinc-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-md transition-colors" title="Send Template">
                    <Send className="w-4 h-4" />
                  </button>
                  <button onClick={() => { playDeleteSound(); handleDeleteTemplate(template.id); }} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="Delete Template">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {userTemplates.length === 0 && <div className="text-sm text-zinc-500 text-center py-4">No templates created yet.</div>}
          </div>
        </div>

        {/* Webhook History */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4" /> Webhook History
          </h3>
          <div className="space-y-2">
            {webhookHistory.map(history => (
              <div key={history.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="truncate pr-4">
                  <div className="text-sm font-bold dark:text-white truncate">{history.url}</div>
                  <div className="text-xs text-zinc-500">{history.date}</div>
                </div>
                <button onClick={() => { playButtonSound(); toast.success("Loaded message and webhook to editor."); }} className="p-1.5 shrink-0 text-zinc-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-md transition-colors" title="Load to Editor">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            ))}
            {webhookHistory.length === 0 && <div className="text-sm text-zinc-500 text-center py-4">No webhook history found.</div>}
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-sm font-bold border border-transparent hover:border-red-200 dark:hover:border-red-900/30"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
