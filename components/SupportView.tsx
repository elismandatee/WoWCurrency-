
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import PhoneIcon from './icons/PhoneIcon';
import BoltIcon from './icons/BoltIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

const SupportView: React.FC = () => {
  const [view, setView] = useState<'options' | 'chat'>('options');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const WHATSAPP_NUMBER = "08166232081";
  const SUPPORT_MSG = "Hello WoWCurrency Support, I am an active user and I need assistance with my account/transaction.";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const openWhatsApp = () => {
    const formattedNumber = "2348166232081";
    const url = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(SUPPORT_MSG)}`;
    window.open(url, '_blank');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: 'You are a WoWCurrency Support Specialist. You help users with crypto-to-fiat conversions, specifically Pi to Naira/Dollars. WoWCurrency is a secure ecosystem led by Ogbonna Elijah Elem. Settlement takes 2-15 minutes. Pi rates are based on current IOU market value ($50-$60). Be professional, concise, and helpful.',
        },
      });

      const result = await chat.sendMessageStream({ message: inputValue });
      
      let assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: '',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);

      for await (const chunk of result) {
        const chunkText = chunk.text;
        assistantMsg.text += chunkText;
        setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...assistantMsg } : m));
      }
    } catch (error) {
      console.error('Support Chat Error:', error);
      setMessages(prev => [...prev, {
        id: 'error',
        role: 'model',
        text: 'I am experiencing a connection lag. Please try again or use WhatsApp support.',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (view === 'chat') {
    return (
      <div className="flex flex-col h-[500px] bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-gray-50 p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('options')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">AI Support Assistant</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Always Active</span>
              </div>
            </div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {messages.length === 0 && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <BoltIcon className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-xs font-bold text-gray-400 px-8">Hello! Ask me anything about your conversions or account status.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium ${
                msg.role === 'user' 
                ? 'bg-[#2A74B1] text-white rounded-tr-none' 
                : 'bg-gray-100 text-gray-800 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="p-4 bg-gray-50 border-t flex gap-2">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe your issue..."
            className="flex-1 bg-white border border-gray-200 px-4 py-3 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
          <button 
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="bg-[#2A74B1] text-white p-3 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-blue-500/20"
          >
            <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-[2rem] relative">
          <div className="absolute inset-0 bg-blue-500/10 rounded-[2rem] animate-ping" />
          <BoltIcon className="w-10 h-10 text-[#2A74B1] relative z-10" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Support Hub</h2>
          <p className="text-sm text-gray-500 font-medium max-w-[220px] mx-auto">
            Get instant answers from our AI or speak with a human agent.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button 
            onClick={() => setView('chat')}
            className="w-full bg-[#2A74B1] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-500/20 hover:bg-[#1e5a8d] transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <ArrowPathIcon className="w-5 h-5" />
            <span>Launch Live AI Chat</span>
          </button>

          <button 
            onClick={openWhatsApp}
            className="w-full bg-[#25D366] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-green-500/20 hover:bg-[#128C7E] transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.539 2.016 2.112-.54c.957.573 1.832.887 2.977.887l.001.001c3.181 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.766-5.77-5.766zm3.376 8.232c-.128.366-.733.668-1.012.712-.248.039-.571.064-1.42-.296-1.121-.474-2.226-1.727-2.617-2.355l-.106-.171c-.08-.13-.131-.214-.131-.214s-.041-.067-.061-.101c-.131-.213-.231-.386-.231-.386l-.1-.167c-.126-.201-.444-.707-.444-1.325 0-.619.324-.925.441-1.049.117-.123.256-.153.339-.153s.167.004.239.008c.075.004.175-.029.274.208.1.237.339.825.369.887s.05.133.017.2-.05.1-.1.158c-.05.058-.106.13-.151.173-.053.053-.109.111-.06.196.049.085.217.358.465.578.319.284.587.373.672.415.085.043.136.035.186-.023s.213-.247.269-.333c.057-.087.114-.073.192-.043s.498.235.584.278c.085.043.142.064.163.1.021.035.021.205-.107.571z" />
            </svg>
            <span>Priority Human Help</span>
          </button>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 space-y-4">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Contact Details</h3>
        <div className="space-y-3">
           <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Support</span>
              <span className="text-xs font-bold text-gray-800">{WHATSAPP_NUMBER}</span>
           </div>
           <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg Response</span>
              <span className="text-xs font-bold text-green-600">Under 2m</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SupportView;
