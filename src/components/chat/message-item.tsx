
"use client";

import type { Message, User } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format, isValid } from 'date-fns';
import { Check, CheckCheck, Edit3, MoreHorizontal, Trash2, Clock } from 'lucide-react';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/auth-provider';


interface MessageItemProps {
  message: Message;
  // Sender info might be directly on the message object from Firestore
  isCurrentUser: boolean;
  onEditMessage: (messageId: string, newText: string) => void;
  onDeleteMessage: (messageId: string) => void;
}

export function MessageItem({ message, isCurrentUser, onEditMessage, onDeleteMessage }: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const { currentUser } = useAuth();

  const handleEditSave = () => {
    if (editText.trim() && editText.trim() !== message.text) {
      onEditMessage(message.id, editText.trim());
    }
    setIsEditing(false);
  };

  const MessageStatusIcon = () => {
    if (!isCurrentUser) return null;
    if (message.status === 'read') return <CheckCheck className="h-4 w-4 text-accent-foreground" />;
    if (message.status === 'delivered') return <CheckCheck className="h-4 w-4 text-muted-foreground" />;
    if (message.status === 'sent') return <Check className="h-4 w-4 text-muted-foreground" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />; 
  };
  
  const senderName = message.senderName || message.senderId.split('@')[0];
  const senderAvatar = message.senderAvatarUrl || `https://picsum.photos/seed/${message.senderId}/100/100`;
  const FallbackName = senderName?.substring(0,1).toUpperCase() || "U";
  
  const messageTimestamp = message.timestamp && isValid(new Date(message.timestamp)) 
    ? format(new Date(message.timestamp), 'HH:mm')
    : '--:--';

  return (
    <motion.div 
      className={cn("flex items-end gap-2 p-1 sm:p-2 group", isCurrentUser ? "justify-end" : "justify-start")}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      layout
    >
      {!isCurrentUser && (
        <Avatar className="h-8 w-8 self-start flex-shrink-0">
          <AvatarImage src={senderAvatar} alt={senderName} data-ai-hint="profile avatar" />
          <AvatarFallback>{FallbackName}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[70%] sm:max-w-[60%] p-2 sm:p-3 rounded-lg shadow-sm",
          isCurrentUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-secondary text-secondary-foreground rounded-bl-none"
        )}
      >
        {!isCurrentUser && (
          <p className="text-xs font-semibold mb-1 text-muted-foreground">{senderName}</p>
        )}
        {isEditing ? (
          <div className="space-y-2">
            <Textarea 
              value={editText} 
              onChange={(e) => setEditText(e.target.value)}
              className="min-h-[60px] text-sm bg-background text-foreground p-2"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleEditSave();
                } else if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditText(message.text);
                }
              }}
            />
            <div className="flex justify-end gap-2 mt-1">
              <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setEditText(message.text);}}>Cancel</Button>
              <Button size="sm" onClick={handleEditSave}>Save</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        )}
        <div className={cn("text-xs mt-1 flex items-center gap-1", isCurrentUser ? "text-primary-foreground/70 justify-end" : "text-muted-foreground justify-start")}>
          {message.edited && !isEditing && <span className="italic text-xs mr-1">(edited)</span>}
          <span>{messageTimestamp}</span>
          <MessageStatusIcon />
        </div>
      </div>
      {isCurrentUser && message.senderId === currentUser?.email && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isCurrentUser ? "end" : "start"}>
            <DropdownMenuItem onClick={() => setIsEditing(true)} disabled={isEditing}>
              <Edit3 className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDeleteMessage(message.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </motion.div>
  );
}
