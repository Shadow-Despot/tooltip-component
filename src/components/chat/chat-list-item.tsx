
"use client";

import type { Chat, User } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNowStrict, isValid } from 'date-fns';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/auth-provider';

interface ChatListItemProps {
  chat: Chat;
  isSelected: boolean;
  onSelectChat: (chatId: string) => void;
}

export function ChatListItem({ chat, isSelected, onSelectChat }: ChatListItemProps) {
  const { currentUser } = useAuth();
  
  // Determine the other participant for 1:1 chats
  const otherParticipant = chat.isGroup ? null : chat.participants.find(p => p.email !== currentUser?.email);
  
  const displayName = chat.isGroup ? chat.name : otherParticipant?.name || chat.name;
  const displayAvatarUrl = chat.isGroup ? chat.avatarUrl : otherParticipant?.avatarUrl || chat.avatarUrl;
  const FallbackName = displayName.substring(0, 1).toUpperCase();

  const unreadMessagesCount = currentUser && chat.unreadCount && chat.unreadCount[currentUser.id] > 0 
    ? chat.unreadCount[currentUser.id] 
    : 0;

  const lastMessageTime = chat.lastMessageTimestamp && isValid(new Date(chat.lastMessageTimestamp))
    ? formatDistanceToNowStrict(new Date(chat.lastMessageTimestamp), { addSuffix: true })
    : '';


  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelectChat(chat.id)}
      className={cn(
        "flex items-center w-full p-3 hover:bg-secondary transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
        isSelected ? "bg-accent" : "bg-transparent"
      )}
      aria-current={isSelected ? "page" : undefined}
    >
      <Avatar className="h-12 w-12 mr-3 flex-shrink-0">
        <AvatarImage src={displayAvatarUrl} alt={displayName} data-ai-hint="profile avatar" />
        <AvatarFallback>{FallbackName}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm truncate">{displayName}</h3>
          {lastMessageTime && (
            <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">
              {lastMessageTime}
            </p>
          )}
        </div>
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-muted-foreground truncate">{chat.lastMessagePreview}</p>
          {unreadMessagesCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 ml-2">
              {unreadMessagesCount}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
