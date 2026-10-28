'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, MessageSquare } from 'lucide-react';

interface Thread {
  id: string;
  otherUser: { name: string | null; id: string };
  lastMessage?: string;
}

interface Message {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
}

export default function MessagesPage() {
  const t = useTranslations('messages');
  const tc = useTranslations('common');
  const { data: session } = useSession();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load accepted connections as threads
    const loadThreads = async () => {
      const res = await fetch('/api/connections/accepted');
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads ?? []);
      }
      setIsLoading(false);
    };
    loadThreads();
  }, []);

  useEffect(() => {
    if (selectedThread) {
      const loadMessages = async () => {
        const res = await fetch(`/api/messages/${selectedThread}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages ?? []);
        }
      };
      loadMessages();
    }
  }, [selectedThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;
    const body = newMessage.trim();
    setNewMessage('');
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId: selectedThread, body }),
    });
    if (res.ok) {
      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><p className="text-gray-500">{tc('loading')}</p></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('title')}</h1>

      {threads.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{t('noConnections')}</p>
          <p className="text-gray-400 text-sm mt-1">{t('noConnectionsHint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
          {/* Thread list */}
          <div className="md:col-span-1 border border-gray-200 rounded-lg overflow-y-auto">
            {threads.map(thread => (
              <button
                key={thread.id}
                onClick={() => setSelectedThread(thread.id)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 border-b border-gray-100 text-left transition-colors ${selectedThread === thread.id ? 'bg-green-50' : ''}`}
              >
                <Avatar>
                  <AvatarFallback>{(thread.otherUser.name ?? '?').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{thread.otherUser.name ?? tc('unknown')}</p>
                  {thread.lastMessage && <p className="text-sm text-gray-500 truncate">{thread.lastMessage}</p>}
                </div>
              </button>
            ))}
          </div>

          {/* Messages area */}
          <div className="md:col-span-2 border border-gray-200 rounded-lg flex flex-col">
            {!selectedThread ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">{t('selectThread')}</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderId === session?.user?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${msg.senderId === session?.user?.id ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
                        {msg.body}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      placeholder={t('placeholder')}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
