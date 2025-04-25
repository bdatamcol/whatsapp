import React, { useState } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';

const messagesData = [
    { id: 1, sender: 'John', text: 'Hola, ¿cómo estás?', time: '10:30 AM' },
    { id: 2, sender: 'Me', text: '¡Hola! Todo bien, ¿y tú?', time: '10:32 AM' },
    { id: 3, sender: 'John', text: 'Bien también, gracias.', time: '10:34 AM' }
];

const Messages = () => {
    const [messages, setMessages] = useState(messagesData);
    const [input, setInput] = useState('');

    const sendMessage = () => {
        if (input.trim() === '') return;
        const newMessage = { id: messages.length + 1, sender: 'Me', text: input, time: 'Ahora' };
        setMessages([...messages, newMessage]);
        setInput('');
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Lista de conversaciones */}
            <div className="w-1/3 bg-white border-r p-4">
                <h2 className="text-lg font-bold mb-4">Mensajes</h2>
                <ul>
                    <li className="p-3 bg-gray-200 rounded-lg cursor-pointer">John Doe</li>
                </ul>
            </div>

            {/* Chat principal */}
            <div className="flex-1 flex flex-col">
                {/* Encabezado del chat */}
                <div className="p-4 bg-white border-b font-bold">John Doe</div>

                {/* Mensajes */}
                <div className="flex-1 p-4 overflow-y-auto space-y-2">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'Me' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-lg ${msg.sender === 'Me' ? 'bg-blue-500 text-white' : 'bg-gray-300'} max-w-xs`}>{msg.text}</div>
                        </div>
                    ))}
                </div>

                {/* Entrada de mensaje */}
                <div className="p-4 bg-white border-t flex items-center gap-2">
                    <button className="p-2 text-gray-500 hover:text-gray-700"><Smile size={20} /></button>
                    <button className="p-2 text-gray-500 hover:text-gray-700"><Paperclip size={20} /></button>
                    <input 
                        type="text" 
                        className="flex-1 border p-2 rounded-lg" 
                        placeholder="Escribe un mensaje..." 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button onClick={sendMessage} className="p-2 bg-blue-500 text-white rounded-lg"><Send size={20} /></button>
                </div>
            </div>
        </div>
    );
};

export default Messages;
