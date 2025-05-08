"use client";

import { useState, useEffect, useCallback } from 'react';
import { ChatView } from '@/components/chat/chat-view';
import { ChatManagementSidebar } from '@/components/sidebar/chat-management-sidebar';
import type { Chat, Message, User } from '@/types/chat';
import { generateDummyChats, currentUser } from '@/lib/dummy-data';
import { useToast } from '@/hooks/use-toast';

export default function MonochromeChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [availableContacts, setAvailableContacts] = useState<User[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    const initialChats = generateDummyChats(5);
    setChats(initialChats);
    // Initialize available contacts (excluding current user and those already in chats)
    const chatParticipantIds = new Set(initialChats.flatMap(c => c.participants.map(p => p.id)));
    const initialContacts = generateDummyChats(10).flatMap(c => c.participants).filter(p => p.id !== currentUser.id && !chatParticipantIds.has(p.id));
    // Deduplicate contacts
    const uniqueContacts = Array.from(new Map(initialContacts.map(c => [c.id, c])).values());
    setAvailableContacts(uniqueContacts);

    if (initialChats.length > 0) {
      setSelectedChatId(initialChats[0].id);
    }
  }, []);

  const handleSelectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
    // Mark messages as read (simplified)
    setChats(prevChats => prevChats.map(c => 
      c.id === chatId ? { ...c, unreadCount: 0 } : c
    ));
  }, []);

  const handleSendMessage = useCallback((chatId: string, text: string) => {
    setChats(prevChats => {
      return prevChats.map(chat => {
        if (chat.id === chatId) {
          const newMessage: Message = {
            id: crypto.randomUUID(),
            text,
            timestamp: Date.now(),
            senderId: currentUser.id, // Current user sends the message
            status: 'sent',
          };
          const updatedMessages = [...chat.messages, newMessage];
          return { 
            ...chat, 
            messages: updatedMessages,
            lastMessagePreview: text.substring(0,30) + (text.length > 30 ? '...' : ''),
            lastMessageTimestamp: newMessage.timestamp,
          };
        }
        return chat;
      }).sort((a,b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
    });
  }, []);

  const handleEditMessage = useCallback((chatId: string, messageId: string, newText: string) => {
    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: chat.messages.map(msg => 
            msg.id === messageId ? { ...msg, text: newText, edited: true, timestamp: Date.now() } : msg
          )
        };
      }
      return chat;
    }));
    toast({ title: "Message Edited", description: "Your message has been updated." });
  }, [toast]);

  const handleDeleteMessage = useCallback((chatId: string, messageId: string) => {
    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === chatId) {
        const updatedMessages = chat.messages.filter(msg => msg.id !== messageId);
        const lastMessage = updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1] : null;
        return {
          ...chat,
          messages: updatedMessages,
          lastMessagePreview: lastMessage ? lastMessage.text.substring(0,30) + (lastMessage.text.length > 30 ? '...' : '') : "Chat cleared",
          lastMessageTimestamp: lastMessage ? lastMessage.timestamp : Date.now(),
        };
      }
      return chat;
    }));
    toast({ title: "Message Deleted", description: "Your message has been removed." });
  }, [toast]);
  
  const handleAddChat = useCallback((contact: User) => {
    // Check if chat with this contact already exists
    const existingChat = chats.find(c => c.participants.some(p => p.id === contact.id) && !c.isGroup);
    if (existingChat) {
      setSelectedChatId(existingChat.id);
      toast({ title: "Chat Exists", description: `You already have a chat with ${contact.name}.`});
      return;
    }

    const newChat: Chat = {
      id: crypto.randomUUID(),
      participants: [currentUser, contact],
      messages: [],
      name: contact.name,
      avatarUrl: contact.avatarUrl,
      lastMessagePreview: 'Chat started',
      lastMessageTimestamp: Date.now(),
      unreadCount: 0,
      isGroup: false,
    };
    setChats(prevChats => [newChat, ...prevChats].sort((a,b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0)));
    setSelectedChatId(newChat.id);
    // Remove contact from available contacts if they are now in a chat
    setAvailableContacts(prev => prev.filter(c => c.id !== contact.id));
  }, [chats, toast]);

  const handleDeleteChat = useCallback((chatId: string) => {
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    if (selectedChatId === chatId) {
      setSelectedChatId(chats.length > 1 ? chats.filter(c => c.id !== chatId)[0].id : null);
    }
    toast({ title: "Chat Deleted", description: "The chat has been removed." });
  }, [selectedChatId, chats, toast]);

  const handleAddContact = useCallback((name: string, avatarSeed?: string) => {
    const newContact: User = {
      id: crypto.randomUUID(),
      name,
      avatarUrl: avatarSeed ? `https://picsum.photos/seed/${avatarSeed}/100/100` : `https://picsum.photos/seed/${name.replace(/\s+/g, '_')}/100/100`
    };
    setAvailableContacts(prevContacts => [newContact, ...prevContacts]);
  }, []);

  const selectedChat = chats.find(chat => chat.id === selectedChatId) || null;

  return (
    <div className="flex h-screen antialiased text-foreground bg-background overflow-hidden">
      <main className="flex-1 flex flex-col min-w-0"> {/* Ensure main content area can shrink and is a column */}
        <ChatView 
          chat={selectedChat} 
          onSendMessage={handleSendMessage}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
        />
      </main>
      <ChatManagementSidebar
        className="w-full md:w-96 flex-shrink-0 border-l border-border" // Responsive width and prevent shrinking
        chats={chats} 
        selectedChatId={selectedChatId} 
        onSelectChat={handleSelectChat}
        onAddChat={handleAddChat}
        onDeleteChat={handleDeleteChat}
        onAddContact={handleAddContact}
        availableContacts={availableContacts}
      />
    </div>
  );
}
