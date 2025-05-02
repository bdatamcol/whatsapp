'use client';
import { Paperclip, Smile, Send } from 'lucide-react';

interface WhatsAppInputProps {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
}

export default function WhatsAppInput({ value, onChange, onSend }: WhatsAppInputProps) {
  return (
    <div className="flex items-center gap-2 p-2 border-t bg-white">
      <button 
        aria-label="Abrir emojis"
        className="p-2 text-gray-500 hover:text-blue-500"
      >
        <Smile size={20} />
      </button>
      
      <button
        aria-label="Adjuntar archivo"
        className="p-2 text-gray-500 hover:text-blue-500"
      >
        <Paperclip size={20} />
      </button>
      
      <input
        type="text"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && onSend()}
        className="flex-1 border rounded-full py-2 px-4 focus:outline-none"
        placeholder="Escribe un mensaje..."
        aria-label="Escribe tu mensaje"
      />
      
      <button 
        onClick={onSend}
        disabled={!value.trim()}
        className="p-2 bg-blue-500 text-white rounded-full disabled:opacity-50"
        aria-label="Enviar mensaje"
      >
        <Send size={20} />
      </button>
    </div>
  );
}