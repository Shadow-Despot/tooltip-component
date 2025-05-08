
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, SendHorizonal, Smile, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  isSending?: boolean;
}

const emojis = ['😀', '😂', '😍', '🤔', '😢', '🎉', '👍', '🙏', '❤️', '💯'];

export function ChatInput({ onSendMessage, disabled, isSending }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (message.trim() && !isSending) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  }

  return (
    <form onSubmit={handleSubmit} className="p-2 sm:p-4 border-t border-border bg-secondary flex items-center gap-1 sm:gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" type="button" disabled={disabled} className="h-8 w-8 sm:h-9 sm:w-9">
            <Smile className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="sr-only">Emoji</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2 mb-2">
          <div className="grid grid-cols-5 gap-1">
            {emojis.map(emoji => (
              <button 
                key={emoji}
                type="button" 
                onClick={() => handleEmojiSelect(emoji)} 
                className="text-xl sm:text-2xl p-1 rounded hover:bg-accent transition-colors"
                aria-label={`Insert emoji ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      
      <Button variant="ghost" size="icon" type="button" disabled={disabled} className="h-8 w-8 sm:h-9 sm:w-9">
        <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="sr-only">Attach file</span>
      </Button>

      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 min-h-[40px] max-h-[100px] sm:max-h-[120px] resize-none bg-background text-sm p-2"
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        rows={1}
      />
      <Button type="submit" size="icon" disabled={disabled || !message.trim() || isSending} className="h-8 w-8 sm:h-9 sm:w-9">
        {isSending ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : <SendHorizonal className="h-4 w-4 sm:h-5 sm:w-5" />}
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
}
