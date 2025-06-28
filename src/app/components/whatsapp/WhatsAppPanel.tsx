'use client';

import { useState } from 'react';
import ConversationList from './ConversationList';
import ChatView from './ChatView'; // el mismo de antes

export default function WhatsAppPanel() {
    const [selectedContact, setSelectedContact] = useState<string | null>(null);

    return (
        <div className="flex h-full">
            {/* Lista de chats */}
            <aside className="w-[40%] border-r bg-white overflow-y-auto">
                <ConversationList onSelectAction={setSelectedContact} />
            </aside>

            {/* Vista del chat */}
            <main className="flex-1 bg-gray-50 overflow-y-auto">
                {selectedContact ? (
                    <ChatView contactId={selectedContact} />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        Selecciona un chat para empezar
                    </div>
                )}
            </main>
        </div>
    );
}

