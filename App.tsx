
import React, { useState, useEffect, useRef } from 'react';
import { initializeChat, sendMessageToGemini, analyzeMoodFromHistory } from './services/geminiService';
import { Message, AppView, MoodEntry, DailyStats, UserSettings } from './types';
import { CRISIS_KEYWORDS } from './constants';
import { ChatBubble } from './components/Chat/ChatBubble';
import { MoodChart } from './components/Dashboard/MoodChart';
import { ResourcesView } from './components/Views/ResourcesView';
import { 
  MessageCircle, 
  BarChart2, 
  BookOpen, 
  Send, 
  Mic, 
  AlertTriangle, 
  X,
  Menu,
  Clock,
  MessageCircle as MsgIcon,
  Bell
} from './components/ui/Icons';

// Helper to get today's date string YYYY-MM-DD
const getTodayString = () => new Date().toISOString().split('T')[0];

function App() {
  // --- State ---
  // Load initial state from localStorage or defaults
  const [currentView, setCurrentView] = useState<AppView>(() => {
    const saved = localStorage.getItem('mindpal_settings');
    return saved && JSON.parse(saved).hasCompletedOnboarding ? AppView.CHAT : AppView.ONBOARDING;
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('mindpal_messages');
    // Need to convert string timestamps back to Date objects
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((m: any) => ({...m, timestamp: new Date(m.timestamp)}));
    }
    return [];
  });

  const [moodData, setMoodData] = useState<MoodEntry[]>(() => {
    const saved = localStorage.getItem('mindpal_moods');
    return saved ? JSON.parse(saved) : [];
  });

  const [stats, setStats] = useState<DailyStats>(() => {
    const saved = localStorage.getItem('mindpal_stats');
    const today = getTodayString();
    if (saved) {
      const parsed: DailyStats = JSON.parse(saved);
      // Reset if it's a new day
      if (parsed.date === today) return parsed;
    }
    return { date: today, messageCount: 0, durationSeconds: 0 };
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('mindpal_settings');
    return saved ? JSON.parse(saved) : { reminderEnabled: false, reminderTime: '20:00', hasCompletedOnboarding: false };
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  // --- Effects ---

  // Initialize Chat
  useEffect(() => {
    initializeChat();
  }, []);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('mindpal_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('mindpal_moods', JSON.stringify(moodData));
  }, [moodData]);

  useEffect(() => {
    localStorage.setItem('mindpal_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('mindpal_settings', JSON.stringify(settings));
  }, [settings]);

  // Timer for Duration Tracking
  useEffect(() => {
    // Only track time when in CHAT view and window is focused (simple approximation)
    if (currentView === AppView.CHAT) {
      timerRef.current = window.setInterval(() => {
        setStats(prev => {
          const today = getTodayString();
          // Check for day rollover
          if (prev.date !== today) {
            return { date: today, messageCount: 0, durationSeconds: 1 };
          }
          return { ...prev, durationSeconds: prev.durationSeconds + 1 };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentView]);

  // Reminder Logic Check (Runs every minute)
  useEffect(() => {
    if (!settings.reminderEnabled) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      if (currentHM === settings.reminderTime && now.getSeconds() < 2) {
         // Simple browser notification check
         if (Notification.permission === 'granted') {
           new Notification("MindPal 每日提醒", { body: "今天过得怎么样？来聊聊吧！🌿" });
         } else if (Notification.permission !== 'denied') {
           Notification.requestPermission();
         }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.reminderEnabled, settings.reminderTime]);

  // Auto-scroll chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentView]);

  // --- Handlers ---

  const handleStartApp = () => {
    setSettings(prev => ({ ...prev, hasCompletedOnboarding: true }));
    setCurrentView(AppView.CHAT);
    if (messages.length === 0) {
      setMessages([
        {
          id: 'init-1',
          role: 'model',
          text: '你好！我是心语 (MindPal)。我在这里随时倾听你的心声。今天感觉怎么样？🌿',
          timestamp: new Date()
        }
      ]);
    }
    // Request notification permission early
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userText = inputText.trim();
    setInputText('');
    setIsLoading(true);

    // Update stats: message count
    setStats(prev => {
       const today = getTodayString();
       if (prev.date !== today) return { date: today, messageCount: 1, durationSeconds: 0 };
       return { ...prev, messageCount: prev.messageCount + 1 };
    });

    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    // 2. Check for Crisis
    const isCrisis = CRISIS_KEYWORDS.some(k => userText.toLowerCase().includes(k));
    if (isCrisis) {
      setShowCrisisModal(true);
    }

    // 3. Get AI Response
    try {
      const responseText = await sendMessageToGemini(userText);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);

      // 4. Background Mood Analysis (every 3rd message)
      if (messages.length > 0 && messages.length % 3 === 0) {
        performMoodAnalysis([...messages, userMsg, aiMsg]);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const performMoodAnalysis = async (history: Message[]) => {
    const recentHistory = history.slice(-6).map(m => `${m.role}: ${m.text}`).join('\n');
    const entry = await analyzeMoodFromHistory(recentHistory);
    if (entry) {
      setMoodData(prev => [...prev, { ...entry, date: new Date().toLocaleDateString('zh-CN', {month:'2-digit', day:'2-digit'}) }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("您的浏览器不支持语音输入。");
      return;
    }
    alert("语音模式：请点击输入框旁的麦克风图标并开始说话（模拟）。");
    setInputText("我感觉有点累，工作压力太大了...");
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}小时 ${mins}分钟`;
    return `${mins}分钟`;
  };

  const requestNotification = () => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification("通知已开启", { body: "MindPal 将会按时提醒你。" });
        }
      });
    }
  };

  // --- Render Components ---

  // 1. Onboarding View
  if (currentView === AppView.ONBOARDING) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center p-6">
        <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <span className="text-4xl">🤖</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">MindPal 心语</h1>
          <p className="text-slate-600 leading-relaxed">
            你的全天候情绪伴侣。安全倾诉，记录点滴。
          </p>
          
          <div className="bg-slate-50 p-4 rounded-xl text-left text-xs text-slate-500 border border-slate-100 space-y-2">
            <p className="font-bold text-slate-700">⚠️ 免责声明</p>
            <p>1. MindPal 不是医生，不提供医疗诊断。</p>
            <p>2. 对话数据仅保存在本地。</p>
            <p>3. 紧急情况请拨打 120 或 110。</p>
          </div>

          <button 
            onClick={handleStartApp}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-teal-200 transform hover:scale-[1.02]"
          >
            开始旅程
          </button>
        </div>
      </div>
    );
  }

  // Main Layout
  return (
    <div className="flex flex-col h-screen bg-slate-50 relative">
      
      {/* Top Navigation */}
      <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
          <span className="font-bold text-slate-700">MindPal</span>
        </div>
        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors" onClick={() => setIsSidebarOpen(true)}>
          <Menu size={24} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col max-w-2xl mx-auto w-full bg-white md:border-x md:border-slate-100 shadow-sm">
        
        {/* View: Chat */}
        {currentView === AppView.CHAT && (
          <>
            <div 
              className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50" 
              ref={chatContainerRef}
            >
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4 fade-in">
                  <div className="flex flex-row items-end gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-400 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    </div>
                    <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-slate-100 text-sm text-slate-400">
                      正在思考...
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-slate-100">
              <div className="flex items-center gap-2 bg-slate-100 rounded-full px-2 py-2">
                 <button 
                  onClick={handleVoiceInput}
                  className="p-2 text-slate-400 hover:text-teal-600 transition-colors"
                >
                  <Mic size={20} />
                </button>
                <input 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 text-sm md:text-base outline-none"
                  placeholder="在这里写下你的想法..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className={`p-2 rounded-full transition-all ${
                    inputText.trim() && !isLoading ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* View: Dashboard */}
        {currentView === AppView.DASHBOARD && (
          <div className="p-4 overflow-y-auto fade-in h-full bg-slate-50/50">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">今日概览</h2>
            
            {/* Daily Stats Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-28">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <Clock size={16} />
                  <span className="text-xs font-bold uppercase">陪伴时长</span>
                </div>
                <div className="text-2xl font-bold text-teal-600">
                  {formatDuration(stats.durationSeconds)}
                </div>
                <div className="text-xs text-slate-400">今日累计</div>
              </div>
              
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-28">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <MsgIcon size={16} />
                  <span className="text-xs font-bold uppercase">对话次数</span>
                </div>
                <div className="text-2xl font-bold text-indigo-600">
                  {stats.messageCount} <span className="text-sm text-slate-400 font-normal">条</span>
                </div>
                <div className="text-xs text-slate-400">互动记录</div>
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-800 mb-4">情绪趋势</h2>
            <MoodChart data={moodData} />
            
            <div className="mt-8 space-y-4">
              <h3 className="text-sm font-semibold text-slate-600">历史分析记录</h3>
              {moodData.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">暂无记录，快去和心语聊聊吧</div>
              ) : (
                moodData.slice().reverse().map((entry, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-400">{entry.date}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          entry.score >= 7 ? 'bg-emerald-100 text-emerald-700' :
                          entry.score <= 4 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {entry.emotion}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{entry.notes}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                         entry.score >= 7 ? 'bg-emerald-50 text-emerald-600' :
                         entry.score <= 4 ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {entry.score}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* View: Resources */}
        {currentView === AppView.RESOURCES && <ResourcesView />}

      </main>

      {/* Bottom Navigation */}
      <nav className="h-16 bg-white border-t border-slate-200 flex items-center justify-around pb-safe shrink-0">
        <button 
          onClick={() => setCurrentView(AppView.CHAT)}
          className={`flex flex-col items-center gap-1 p-2 w-16 transition-colors ${currentView === AppView.CHAT ? 'text-teal-600' : 'text-slate-400'}`}
        >
          <MessageCircle size={24} />
          <span className="text-[10px] font-medium">聊天</span>
        </button>
        <button 
          onClick={() => setCurrentView(AppView.DASHBOARD)}
          className={`flex flex-col items-center gap-1 p-2 w-16 transition-colors ${currentView === AppView.DASHBOARD ? 'text-teal-600' : 'text-slate-400'}`}
        >
          <BarChart2 size={24} />
          <span className="text-[10px] font-medium">追踪</span>
        </button>
        <button 
          onClick={() => setCurrentView(AppView.RESOURCES)}
          className={`flex flex-col items-center gap-1 p-2 w-16 transition-colors ${currentView === AppView.RESOURCES ? 'text-teal-600' : 'text-slate-400'}`}
        >
          <BookOpen size={24} />
          <span className="text-[10px] font-medium">资源</span>
        </button>
      </nav>

      {/* Crisis Modal */}
      {showCrisisModal && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center border-t-4 border-red-500">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">我们很关心你的安全</h3>
            <p className="text-slate-600 mb-6 text-sm">
              检测到你可能处于情绪低谷。如果你感到无法承受，请立即寻求专业帮助。
            </p>
            <div className="space-y-3">
              <a href="tel:400-161-9995" className="block w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors">
                拨打危机干预热线
              </a>
              <button 
                onClick={() => setShowCrisisModal(false)}
                className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-colors"
              >
                我没事，继续聊天
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings/Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="absolute inset-0 z-40 flex">
          <div className="w-72 bg-white h-full shadow-2xl p-6 flex flex-col animate-in slide-in-from-left duration-300">
             <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
               <span className="font-bold text-xl text-slate-800">设置与功能</span>
               <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100"
              >
                 <X size={24} className="text-slate-400" />
               </button>
             </div>
             
             <div className="space-y-6 flex-1">
               
               {/* Reminder Settings */}
               <div className="space-y-3">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">每日提醒</h4>
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Bell size={18} />
                        <span className="text-sm font-medium">开启提醒</span>
                      </div>
                      <button 
                        onClick={() => {
                          setSettings(s => ({...s, reminderEnabled: !s.reminderEnabled}));
                          if (!settings.reminderEnabled) requestNotification();
                        }}
                        className={`w-11 h-6 rounded-full transition-colors relative ${settings.reminderEnabled ? 'bg-teal-600' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.reminderEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    
                    {settings.reminderEnabled && (
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                        <span className="text-sm text-slate-500">提醒时间</span>
                        <input 
                          type="time" 
                          value={settings.reminderTime}
                          onChange={(e) => setSettings(s => ({...s, reminderTime: e.target.value}))}
                          className="bg-white border border-slate-200 rounded px-2 py-1 text-sm text-slate-700 focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    )}
                 </div>
               </div>

               {/* Data Management */}
               <div className="space-y-3">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">数据管理</h4>
                 <button 
                  onClick={() => {
                    if(confirm("确定要清除所有聊天记录和数据吗？此操作无法撤销。")) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="w-full p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-colors text-left flex items-center gap-2"
                 >
                   <AlertTriangle size={16} />
                   重置所有数据
                 </button>
               </div>
             </div>

             <div className="text-xs text-slate-300 text-center mt-6">
               MindPal v1.2.0 <br/>
               本地数据存储模式
             </div>
          </div>
          <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
        </div>
      )}
    </div>
  );
}

export default App;
