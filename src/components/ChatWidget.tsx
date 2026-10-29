'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';

const WEBHOOK_URL = 'https://n8n.codeblend.co/webhook/zibonsathi-chat';

interface Message {
  text: string;
  isUser: boolean;
  buttons?: string[];
}

interface ChatState {
  state: string;
  collectedName?: string;
  collectedPhone?: string;
}

export default function ChatWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [chatState, setChatState] = useState<ChatState>({ state: 'menu' });
  const messagesRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef('zs_' + Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && !initialized) {
      setInitialized(true);
      sendMessage('start');
    }
  }, [isOpen, initialized]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    if (text !== 'start') {
      setMessages(prev => [...prev, { text, isUser: true }]);
    }
    setInput('');
    setIsTyping(true);

    try {
      const payload: Record<string, unknown> = {
        message: text,
        sessionId: sessionId.current,
        state: chatState.state,
        collectedName: chatState.collectedName,
        collectedPhone: chatState.collectedPhone,
      };

      // If user is logged in, pass their info
      if (session?.user) {
        payload.isLoggedIn = true;
        payload.userName = session.user.name || null;
        payload.userEmail = session.user.email || null;
        // Phone will be asked via chatbot if needed
        payload.userPhone = null;
      }

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      setIsTyping(false);

      // Update chat state from response
      if (data.state) {
        setChatState({
          state: data.state,
          collectedName: data.collectedName,
          collectedPhone: data.collectedPhone,
        });
      }

      if (data.message) {
        setMessages(prev => [...prev, {
          text: data.message,
          isUser: false,
          buttons: data.buttons || []
        }]);
      }
    } catch {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        text: 'দুঃখিত, সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
        isUser: false
      }]);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* Chat Box */}
      {isOpen && (
        <div className="absolute bottom-[70px] right-0 w-[360px] max-w-[calc(100vw-40px)] h-[500px] max-h-[calc(100vh-100px)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-rose-600 text-white p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-2xl">
              💬
            </div>
            <div>
              <h3 className="font-semibold text-base m-0">জীবনসাথী সাপোর্ট</h3>
              <p className="text-xs opacity-90 m-0">আমরা সাহায্য করতে প্রস্তুত</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="ml-auto bg-transparent border-none text-white text-2xl cursor-pointer p-0 leading-none hover:opacity-80"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[85%] p-3 px-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.isUser
                    ? 'bg-rose-600 text-white self-end rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 self-start rounded-bl-sm'
                }`}
              >
                {msg.text}
                {msg.buttons && msg.buttons.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {msg.buttons.map((btn, j) => (
                      <button
                        key={j}
                        onClick={() => sendMessage(btn)}
                        className="bg-white border border-rose-600 text-rose-600 py-2 px-3 rounded-full text-xs cursor-pointer transition-all hover:bg-rose-600 hover:text-white"
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-1 p-3 px-4 bg-gray-100 rounded-2xl self-start w-fit">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 px-4 border-t border-gray-200 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder={
                chatState.state === 'waiting_name' ? 'আপনার নাম লিখুন...' :
                chatState.state === 'waiting_phone' ? 'মোবাইল নম্বর লিখুন...' :
                'আপনার প্রশ্ন লিখুন...'
              }
              className="flex-1 border border-gray-300 rounded-full py-2 px-4 text-sm outline-none focus:border-rose-600 transition-colors"
            />
            <button
              onClick={() => sendMessage(input)}
              className="w-10 h-10 rounded-full bg-rose-600 border-none cursor-pointer flex items-center justify-center hover:bg-rose-700 transition-colors"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-rose-600 border-none cursor-pointer shadow-lg flex items-center justify-center transition-transform hover:scale-105 hover:bg-rose-700"
      >
        <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
        </svg>
      </button>
    </div>
  );
}
