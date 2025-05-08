
"use client";

import type { Chat, Message } from '@/types/chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageItem } from './message-item';
import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { AnimatePresence } from 'framer-motion';
import { Loader2, MessagesSquareIcon } from 'lucide-react';

interface MessageAreaProps {
  chat: Chat | null;
  onEditMessage: (chatId: string, messageId: string, newText: string) => void;
  onDeleteMessage: (chatId: string, messageId: string) => void;
  isLoadingMessages: boolean;
}

export function MessageArea({ chat, onEditMessage, onDeleteMessage, isLoadingMessages }: MessageAreaProps) {
  const { currentUser } = useAuth();
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      // Scroll to bottom with a small delay to ensure all messages are rendered
      setTimeout(() => {
         if (viewportRef.current) {
            viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
         }
      }, 100);
    }
  }, [chat?.messages, chat?.id]); // Depend on chat.id to re-trigger scroll on chat change

  if (isLoadingMessages && !chat) {
     return (
      <div className="flex-1 flex items-center justify-center bg-secondary text-muted-foreground p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-secondary text-muted-foreground p-4 text-center">
        <MessagesSquareIcon className="h-16 w-16 mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold">Select a chat to start messaging</h3>
        <p className="text-sm">Or, start a new conversation from the sidebar.</p>
      </div>
    );
  }
  
  if (isLoadingMessages && chat.messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-secondary text-muted-foreground p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Loading messages...</p>
      </div>
    );
  }
  
  if (chat.messages.length === 0 && !isLoadingMessages) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-secondary text-muted-foreground p-4 text-center">
        <MessagesSquareIcon className="h-16 w-16 mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold">No messages yet</h3>
        <p className="text-sm">Be the first to send a message to {chat.name}!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 bg-background" viewportRef={viewportRef}>
      <div className="p-2 sm:p-4 space-y-1 sm:space-y-2">
        <AnimatePresence initial={false}>
          {chat.messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              isCurrentUser={msg.senderId === currentUser?.email}
              onEditMessage={(messageId, newText) => onEditMessage(chat.id, messageId, newText)}
              onDeleteMessage={(messageId) => onDeleteMessage(chat.id, messageId)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}
