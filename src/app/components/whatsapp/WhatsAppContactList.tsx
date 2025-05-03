'use client';
import { Contact } from '@/types/whatsapp.d';

interface WhatsAppContactListProps {
  contacts: Contact[];
  selectedContact: string | null;
  onSelectContact: (id: string) => void;
}

export default function WhatsAppContactList({
  contacts,
  selectedContact,
  onSelectContact
}: WhatsAppContactListProps) {
  return (
    <div className="overflow-y-auto h-[calc(100vh-180px)]">
      {contacts.map(contact => (
        <div
          key={contact.id}
          onClick={() => onSelectContact(contact.id)}
          className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
            selectedContact === contact.id ? 'bg-blue-50' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="bg-gray-200 rounded-full h-10 w-10 flex items-center justify-center">
              {contact.avatar ? (
                <img 
                  src={contact.avatar} 
                  alt={contact.name}
                  className="rounded-full h-full w-full object-cover"
                />
              ) : (
                <span className="text-gray-500">
                  {contact.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{contact.name}</h3>
              <p className="text-sm text-gray-500 truncate">
                {contact.lastMessage || 'Nuevo contacto'}
              </p>
            </div>
            {contact.unread && (
              <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {contact.unread}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}