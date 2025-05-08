"use client";

import type { Chat } from '@/types/chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatListItem } from './chat-list-item';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState, useMemo } from 'react';

interface ChatListProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

export function ChatList({ chats, selectedChatId, onSelectChat }: ChatListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChats = useMemo(() => {
    if (!searchTerm) return chats;
    return chats.filter(chat => 
      chat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [chats, searchTerm]);

  return (
    <div className="flex flex-col h-full border-r border-border bg-background">
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search chats..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isSelected={selectedChatId === chat.id}
              onSelectChat={onSelectChat}
            />
          ))
        ) : (
          <p className="p-4 text-center text-sm text-muted-foreground">No chats found.</p>
        )}
      </ScrollArea>
    </div>
  );
}
