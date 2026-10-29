'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface Message {
  text: string;
  isUser: boolean;
  buttons?: string[];
}

interface ChatState {
  state: 'menu' | 'waiting_name' | 'waiting_phone' | 'done';
  collectedName?: string;
}

const FAQs: Record<string, { keywords: string[]; response: string }> = {
  register: {
    keywords: ['রেজিস্ট্রেশন', 'register', 'signup', 'নিবন্ধন', 'অ্যাকাউন্ট'],
    response: '📝 **রেজিস্ট্রেশন করতে:**\n\n১. ইমেইল ও পাসওয়ার্ড দিয়ে নিবন্ধন করুন\n২. লগইন করুন\n৩. বায়োডাটা তৈরি করুন',
  },
  biodata: {
    keywords: ['বায়োডাটা', 'biodata', 'প্রোফাইল', 'আইডি'],
    response: '📋 **বায়োডাটা:** বিনামূল্যে তৈরি করুন, ২৪-৪৮ ঘণ্টায় অনুমোদন হবে।',
  },
  pricing: {
    keywords: ['খরচ', 'price', 'cost', 'credit', 'টাকা', 'ক্রেডিট'],
    response: '💰 **খরচ:** অ্যাকাউন্ট ও বায়োডাটা বিনামূল্যে। যোগাযোগের তথ্য দেখতে ক্রেডিট লাগে।',
  },
  privacy: {
    keywords: ['গোপনীয়তা', 'privacy', 'safe', 'নিরাপত্তা'],
    response: '🔒 **গোপনীয়তা:** আপনার তথ্য সুরক্ষিত, শুধু অনুমোদিত সংযোগে দেখা যায়।',
  },
};

const BUTTONS = ['📝 রেজিস্ট্রেশন', '📋 বায়োডাটা', '💰 খরচ', '🔒 গোপনীয়তা', '👨‍💼 সাপোর্ট'];

export default function ChatWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [chatState, setChatState] = useState<ChatState>({ state: 'menu' });
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch WhatsApp number on mount
  useEffect(() => {
    fetch('/api/settings?key=whatsapp_number')
      .then((res) => res.json())
      .then((data) => setWhatsappNumber(data.value))
      .catch(() => {});
  }, []);

  // Show welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          text: '👋 স্বাগতম! জীবনসাথী সাপোর্টে কিভাবে সাহায্য করতে পারি?',
          isUser: false,
          buttons: BUTTONS,
        },
      ]);
    }
  }, [isOpen, messages.length]);

  const openWhatsApp = (name: string, phone: string) => {
    if (!whatsappNumber) {
      setMessages((prev) => [
        ...prev,
        { text: '❌ দুঃখিত, সাপোর্ট নম্বর সেট করা নেই। অনুগ্রহ করে পরে চেষ্টা করুন।', isUser: false },
      ]);
      return;
    }

    const message = `🆘 সাপোর্ট রিকোয়েস্ট\n\n👤 নাম: ${name}\n📱 মোবাইল: ${phone}`;
    const encodedMessage = encodeURIComponent(message);
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;

    // Show confirmation
    setMessages((prev) => [
      ...prev,
      {
        text: '✅ ধন্যবাদ! WhatsApp এ চ্যাট শুরু করতে নিচের বাটনে ক্লিক করুন।',
        isUser: false,
        buttons: ['💬 WhatsApp এ চ্যাট করুন'],
      },
    ]);
    setChatState({ state: 'done' });

    // Store URL for button click
    sessionStorage.setItem('zs_whatsapp_url', url);
  };

  const handleMessage = (text: string) => {
    const lowerText = text.toLowerCase().trim();
    setMessages((prev) => [...prev, { text, isUser: true }]);

    // Handle WhatsApp button click
    if (text === '💬 WhatsApp এ চ্যাট করুন') {
      const url = sessionStorage.getItem('zs_whatsapp_url');
      if (url) {
        window.open(url, '_blank');
      }
      return;
    }

    // Handle state-based flow
    if (chatState.state === 'waiting_name') {
      setChatState({ state: 'waiting_phone', collectedName: text });
      setMessages((prev) => [
        ...prev,
        { text: '📱 আপনার মোবাইল নম্বর দিন:', isUser: false },
      ]);
      return;
    }

    if (chatState.state === 'waiting_phone') {
      openWhatsApp(chatState.collectedName || 'Unknown', text);
      return;
    }

    // Check for support request
    if (lowerText.includes('সাপোর্ট') || lowerText.includes('support') || lowerText.includes('help')) {
      if (session?.user?.name) {
        // Logged in - ask for phone only
        setChatState({ state: 'waiting_phone', collectedName: session.user.name });
        setMessages((prev) => [
          ...prev,
          { text: `👤 ${session.user.name}, আপনার মোবাইল নম্বর দিন:`, isUser: false },
        ]);
      } else {
        // Not logged in - ask for name first
        setChatState({ state: 'waiting_name' });
        setMessages((prev) => [
          ...prev,
          { text: '👤 আপনার নাম লিখুন:', isUser: false },
        ]);
      }
      return;
    }

    // Check FAQs
    for (const faq of Object.values(FAQs)) {
      if (faq.keywords.some((k) => lowerText.includes(k))) {
        setMessages((prev) => [
          ...prev,
          { text: faq.response, isUser: false, buttons: BUTTONS },
        ]);
        return;
      }
    }

    // Default response
    setMessages((prev) => [
      ...prev,
      { text: 'দুঃখিত, বুঝতে পারিনি। নিচের অপশন থেকে বেছে নিন:', isUser: false, buttons: BUTTONS },
    ]);
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setInput('');
    handleMessage(text);
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
                        className={`border py-2 px-3 rounded-full text-xs cursor-pointer transition-all ${
                          btn.includes('WhatsApp')
                            ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                            : 'bg-white border-rose-600 text-rose-600 hover:bg-rose-600 hover:text-white'
                        }`}
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 px-4 border-t border-gray-200 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder={
                chatState.state === 'waiting_name'
                  ? 'আপনার নাম লিখুন...'
                  : chatState.state === 'waiting_phone'
                  ? 'মোবাইল নম্বর লিখুন...'
                  : 'আপনার প্রশ্ন লিখুন...'
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
