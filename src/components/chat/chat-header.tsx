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
      <div className="h-[60px] sm:h-[68px] p-3 sm:p-4 border-b border-border bg-secondary flex items-center justify-between flex-shrink-0">
         {/* Placeholder or default content if no chat is selected */}
      </div>
    );
  }
  
  const FallbackName = chat.name.substring(0, 1).toUpperCase();

  return (
    <div className="h-[60px] sm:h-[68px] p-3 sm:p-4 border-b border-border bg-secondary flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0"> {/* min-w-0 for truncation */}
        <Avatar className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"> {/* flex-shrink-0 */}
          <AvatarImage src={chat.avatarUrl} alt={chat.name} data-ai-hint="profile avatar" />
          <AvatarFallback>{FallbackName}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0"> {/* flex-1 and min-w-0 for truncation */}
          <h2 className="font-semibold text-sm truncate">{chat.name}</h2>
          <p className="text-xs text-muted-foreground truncate">Online</p> 
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0"> {/* flex-shrink-0 */}
        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
          <Video className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="sr-only">Video call</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
          <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="sr-only">Audio call</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
          <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="sr-only">Search in chat</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
          <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="sr-only">More options</span>
        </Button>
      </div>
    </div>
  );
}
