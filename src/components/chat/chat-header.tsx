"use client";

import type { Chat } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreVertical, Phone, Search, Video } from 'lucide-react';

interface ChatHeaderProps {
  chat: Chat | null;
}

export function ChatHeader({ chat }: ChatHeaderProps) {
  if (!chat) {
    return (
      <div className="h-[68px] p-4 border-b border-border bg-secondary flex items-center justify-between">
         {/* Placeholder or default content if no chat is selected */}
      </div>
    );
  }
  
  const FallbackName = chat.name.substring(0, 1).toUpperCase();

  return (
    <div className="h-[68px] p-4 border-b border-border bg-secondary flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={chat.avatarUrl} alt={chat.name} data-ai-hint="profile avatar" />
          <AvatarFallback>{FallbackName}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-sm">{chat.name}</h2>
          {/* Could add online status or last seen here */}
          <p className="text-xs text-muted-foreground">Online</p> 
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Video className="h-5 w-5" />
          <span className="sr-only">Video call</span>
        </Button>
        <Button variant="ghost" size="icon">
          <Phone className="h-5 w-5" />
          <span className="sr-only">Audio call</span>
        </Button>
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
          <span className="sr-only">Search in chat</span>
        </Button>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
          <span className="sr-only">More options</span>
        </Button>
      </div>
    </div>
  );
}
