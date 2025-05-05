'use client';
import { useCallback, useMemo, useState, memo, ChangeEvent, useEffect } from 'react';
import WhatsAppChat from '@/app/components/whatsapp/WhatsAppChat';
import WhatsAppContactList from '@/app/components/whatsapp/WhatsAppContactList';
import Input from '@/app/components/ui/Input';
import { Loader2, Search, ArrowLeft, MoreVertical, Frown, Smile, RefreshCw, Settings } from 'lucide-react';
import { useWhatsApp } from '@/app/providers/WhatsAppProvider';
import { cn } from '@/lib/utils';
import Button from '@/app/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/app/components/ui/dropdown-menu';

interface MessagessProps {
  initialContact?: string;
}

export default function Messagess({ initialContact }: MessagessProps) {
  const {
    contacts,
    selectedContact,
    messages,
    loading,
    error,
    selectContact,
    sendMessage,
    refreshContacts,
  } = useWhatsApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  // Debug: Ver mensajes recibidos
  useEffect(() => {
    console.log("Mensajes actualizados:", messages);
  }, [messages]);

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [contacts, searchTerm]);

  const currentContact = useMemo(() => {
    return contacts.find(c => c.id === selectedContact);
  }, [contacts, selectedContact]);

  const handleSelectContact = useCallback(async (id: string) => {
    try {
      setLocalLoading(true);
      await selectContact(id);
      setIsMobileChatOpen(true);
    } finally {
      setLocalLoading(false);
    }
  }, [selectContact]);

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleLoadMoreMessages = useCallback(() => {
    console.log('Cargando más mensajes...');
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      setLocalLoading(true);
      await refreshContacts();
    } finally {
      setLocalLoading(false);
    }
  }, [refreshContacts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-red-500 p-4">
        <Frown className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium mb-2">Error al cargar conversaciones</p>
        <p className="text-sm mb-4">{error}</p>
        <Button variant="outline" onClick={handleRefresh}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50">
      {/* Panel de contactos */}
      <div className={cn(
        "w-full md:w-96 flex flex-col border-r bg-white transition-all duration-300",
        isMobileChatOpen ? "hidden md:flex" : "flex"
      )}>
        <div className="p-3 border-b sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold">Conversaciones</h2>
            <DropdownMenu onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={cn(
                  "rounded-full hover:bg-gray-100",
                  isMenuOpen && "bg-gray-100"
                )}>
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleRefresh} disabled={localLoading}>
                  {localLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  <span>Actualizar</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar contactos..."
              className="pl-9"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <WhatsAppContactList 
            contacts={filteredContacts}
            selectedContact={selectedContact}
            onSelectContact={handleSelectContact}
            
          />
        </div>
      </div>

      {/* Panel de chat */}
      <div className={cn(
        "flex-1 flex flex-col bg-gray-50",
        isMobileChatOpen ? "flex" : "hidden md:flex"
      )}>
        {selectedContact ? (
          <>
            <div className="p-3 border-b bg-white sticky top-0 z-10 flex items-center justify-between">
              <div className="flex items-center">
                <button 
                  onClick={() => setIsMobileChatOpen(false)}
                  className="md:hidden mr-2 p-1 rounded-full hover:bg-gray-100"
                  aria-label="Volver"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {currentContact?.avatar ? (
                        <img 
                          src={currentContact.avatar} 
                          alt={currentContact.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-medium">
                          {currentContact?.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {currentContact?.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{currentContact?.name}</h3>
                    <p className="text-xs text-gray-500">
                      {currentContact?.isOnline ? 'En línea' : `Últ. vez ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                </div>
              </div>
              <button className="p-1 rounded-full hover:bg-gray-100">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {localLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
                </div>
              ) : (
                <WhatsAppChat 
                  messages={messages}
                  onSendMessage={sendMessage}
                  onLoadMore={handleLoadMoreMessages}
                  selectedContact={currentContact}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="max-w-md">
              <Smile className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-500 mb-2">
                {isMobileChatOpen ? 'Volver a conversaciones' : 'Selecciona una conversación'}
              </h3>
              <p className="text-gray-400 mb-6">
                {isMobileChatOpen ? '' : 'Elige un contacto para comenzar a chatear'}
              </p>
              {messages.length === 0 && (
                <p className="text-sm text-gray-400 mb-4">
                  No hay mensajes disponibles
                </p>
              )}
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={handleRefresh}
                disabled={localLoading}
              >
                {localLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Actualizar lista
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}