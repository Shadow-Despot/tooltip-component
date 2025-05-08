"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, SendHorizonal, Smile } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

// Basic Emoji list for demonstration
const emojis = ['😀', '😂', '😍', '🤔', '😢', '🎉', '👍', '🙏', '❤️', '💯'];

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-secondary flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" type="button" disabled={disabled}>
            <Smile className="h-5 w-5" />
            <span className="sr-only">Emoji</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="grid grid-cols-5 gap-1">
            {emojis.map(emoji => (
              <button 
                key={emoji}
                type="button" 
                onClick={() => handleEmojiSelect(emoji)} 
                className="text-2xl p-1 rounded hover:bg-accent transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      
      <Button variant="ghost" size="icon" type="button" disabled={disabled}>
        <Paperclip className="h-5 w-5" />
        <span className="sr-only">Attach file</span>
      </Button>

      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 min-h-[40px] max-h-[120px] resize-none bg-background text-sm"
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <Button type="submit" size="icon" disabled={disabled || !message.trim()}>
        <SendHorizonal className="h-5 w-5" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
}
