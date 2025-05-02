'use client';
import { Message, Contact } from '@/types/whatsapp.d';
import Button from '@/app/components/ui/Button';
import { Send, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Input from '../ui/Input';

interface WhatsAppChatProps {
  messages: Message[];
  selectedContact: Contact | undefined;
  onSendMessage: (text: string) => void;
  onLoadMore: () => void;
}

export default function WhatsAppChat({
  messages,
  selectedContact,
  onSendMessage,
  onLoadMore
}: WhatsAppChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleScroll = () => {
    if (chatContainerRef.current?.scrollTop === 0) {
      onLoadMore();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Encabezado del chat */}
      <div className="p-4 border-b bg-white flex items-center gap-3">
        <div className="bg-gray-200 rounded-full h-10 w-10 flex items-center justify-center">
          {selectedContact?.avatar ? (
            <img 
              src={selectedContact.avatar} 
              alt={selectedContact.name}
              className="rounded-full h-full w-full object-cover"
            />
          ) : (
            <span className="text-gray-500">
              {selectedContact?.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h3 className="font-medium">{selectedContact?.name}</h3>
          <p className="text-xs text-gray-500">
            {selectedContact?.lastMessage 
              ? `Últ. mensaje: ${selectedContact.lastMessage}` 
              : 'En línea'}
          </p>
        </div>
      </div>

      {/* Área de mensajes */}
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50"
      >
        {messages.map(msg => (
          <div 
            key={msg.id} 
            className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`p-3 rounded-lg max-w-xs md:max-w-md ${
              msg.direction === 'outbound' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white border'
            }`}>
              <p>{msg.text}</p>
              <p className={`text-xs mt-1 ${
                msg.direction === 'outbound' 
                  ? 'text-blue-100' 
                  : 'text-gray-500'
              }`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input para enviar mensajes */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe un mensaje..."
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}