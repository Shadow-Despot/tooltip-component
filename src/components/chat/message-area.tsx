"use client";

import type { Chat, Message, User } from '@/types/chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageItem } from './message-item';
import { currentUser } from '@/lib/dummy-data';
import React, { useEffect, useRef } from 'react';

interface MessageAreaProps {
  chat: Chat | null;
  onEditMessage: (chatId: string, messageId: string, newText: string) => void;
  onDeleteMessage: (chatId: string, messageId: string) => void;
}

export function MessageArea({ chat, onEditMessage, onDeleteMessage }: MessageAreaProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [chat?.messages]);


  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-secondary text-muted-foreground">
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

  const findSender = (senderId: string): User | undefined => {
    if (senderId === currentUser.id) return currentUser;
    return chat.participants.find(p => p.id === senderId);
  };

  return (
    <ScrollArea className="flex-1 bg-background p-4" ref={scrollAreaRef} viewportRef={viewportRef}>
      <div className="space-y-2">
        {chat.messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            sender={findSender(msg.senderId)}
            isCurrentUser={msg.senderId === currentUser.id}
            onEditMessage={(messageId, newText) => onEditMessage(chat.id, messageId, newText)}
            onDeleteMessage={(messageId) => onDeleteMessage(chat.id, messageId)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
