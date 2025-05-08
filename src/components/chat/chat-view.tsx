"use client";

import type { Chat, Message } from '@/types/chat';
import { ChatHeader } from './chat-header';
import { MessageArea } from './message-area';
import { ChatInput } from './chat-input';
import { currentUser } from '@/lib/dummy-data';

interface ChatViewProps {
  chat: Chat | null;
  onSendMessage: (chatId: string, text: string) => void;
  onEditMessage: (chatId: string, messageId: string, newText: string) => void;
  onDeleteMessage: (chatId: string, messageId: string) => void;
}

export function ChatView({ chat, onSendMessage, onEditMessage, onDeleteMessage }: ChatViewProps) {
  const handleSendMessage = (text: string) => {
    if (chat) {
      onSendMessage(chat.id, text);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <ChatHeader chat={chat} />
      <MessageArea 
        chat={chat} 
        onEditMessage={onEditMessage}
        onDeleteMessage={onDeleteMessage}
      />
      <ChatInput onSendMessage={handleSendMessage} disabled={!chat} />
    </div>
  );
}
