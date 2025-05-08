
"use client";

import type { Chat } from '@/types/chat';
import { ChatHeader } from './chat-header';
import { MessageArea } from './message-area';
import { ChatInput } from './chat-input';

interface ChatViewProps {
  chat: Chat | null;
  onSendMessage: (chatId: string, text: string) => void;
  onEditMessage: (chatId: string, messageId: string, newText: string) => void;
  onDeleteMessage: (chatId: string, messageId: string) => void;
  onDeleteChat?: (chatId: string) => void; // For deleting entire chat from header
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
}

export function ChatView({ 
  chat, 
  onSendMessage, 
  onEditMessage, 
  onDeleteMessage,
  onDeleteChat,
  isLoadingMessages,
  isSendingMessage
}: ChatViewProps) {
  const handleSendMessage = (text: string) => {
    if (chat) {
      onSendMessage(chat.id, text);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <ChatHeader chat={chat} onDeleteChat={onDeleteChat} isLoading={isLoadingMessages && !chat}/>
      <MessageArea 
        chat={chat} 
        onEditMessage={onEditMessage}
        onDeleteMessage={onDeleteMessage}
        isLoadingMessages={isLoadingMessages}
      />
      <ChatInput 
        onSendMessage={handleSendMessage} 
        disabled={!chat || isSendingMessage || isLoadingMessages} 
        isSending={isSendingMessage}
      />
    </div>
  );
}
