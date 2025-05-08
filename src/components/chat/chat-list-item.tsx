"use client";

import type { Chat } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNowStrict } from 'date-fns';

interface ChatListItemProps {
  chat: Chat;
  isSelected: boolean;
  onSelectChat: (chatId: string) => void;
}

export function ChatListItem({ chat, isSelected, onSelectChat }: ChatListItemProps) {
  const otherParticipant = chat.participants.find(p => p.id !== 'user_me'); // Assuming 'user_me' is current user
  const FallbackName = chat.name.substring(0, 1).toUpperCase();

  return (
    <button
      onClick={() => onSelectChat(chat.id)}
      className={cn(
        "flex items-center w-full p-3 hover:bg-secondary transition-colors duration-150",
        isSelected ? "bg-accent" : "bg-transparent"
      )}
      aria-current={isSelected ? "page" : undefined}
    >
      <Avatar className="h-12 w-12 mr-3">
        <AvatarImage src={chat.avatarUrl || otherParticipant?.avatarUrl} alt={chat.name} data-ai-hint="profile avatar" />
        <AvatarFallback>{FallbackName}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm truncate">{chat.name}</h3>
          {chat.lastMessageTimestamp && (
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNowStrict(new Date(chat.lastMessageTimestamp), { addSuffix: true })}
            </p>
          )}
        </div>
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-muted-foreground truncate">{chat.lastMessagePreview}</p>
          {chat.unreadCount && chat.unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
