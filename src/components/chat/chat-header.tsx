
"use client";

import type { Chat } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreVertical, Phone, Search, Video, Users, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useState } from 'react';

interface ChatHeaderProps {
  chat: Chat | null;
  onDeleteChat?: (chatId: string) => void; // Optional: for deleting the current chat
  isLoading?: boolean;
}

export function ChatHeader({ chat, onDeleteChat, isLoading }: ChatHeaderProps) {
  const { currentUser } = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (isLoading || !currentUser) {
    return (
      <div className="h-[60px] sm:h-[68px] p-3 sm:p-4 border-b border-border bg-secondary flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-full" />
          <div className="flex-1 min-w-0 space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-md" />
          <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-md" />
          <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 rounded-md" />
        </div>
      </div>
    );
  }
  
  if (!chat) {
    return (
      <div className="h-[60px] sm:h-[68px] p-3 sm:p-4 border-b border-border bg-secondary flex items-center justify-center flex-shrink-0">
         <p className="text-sm text-muted-foreground">No chat selected</p>
      </div>
    );
  }
  
  const otherParticipant = chat.isGroup ? null : chat.participants.find(p => p.email !== currentUser.email);
  const displayName = chat.isGroup ? chat.name : otherParticipant?.name || chat.name;
  const displayAvatarUrl = chat.isGroup ? chat.avatarUrl : otherParticipant?.avatarUrl || chat.avatarUrl;
  const FallbackName = displayName.substring(0, 1).toUpperCase();

  const handleDeleteConfirm = () => {
    if (onDeleteChat) {
      onDeleteChat(chat.id);
    }
    setIsDeleteDialogOpen(false);
  }

  return (
    <div className="h-[60px] sm:h-[68px] p-3 sm:p-4 border-b border-border bg-secondary flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <Avatar className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
          <AvatarImage src={displayAvatarUrl} alt={displayName} data-ai-hint="profile avatar" />
          <AvatarFallback>{FallbackName}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">{displayName}</h2>
          <p className="text-xs text-muted-foreground truncate">
            {chat.isGroup 
              ? `${chat.participants.length} members` 
              : "Online" /* Placeholder, real status would need presence system */
            }
          </p> 
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Action buttons can be re-enabled if functionality is implemented */}
        {/* <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
          <Video className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="sr-only">Video call</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
          <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="sr-only">Audio call</span>
        </Button> */}
        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
          <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="sr-only">Search in chat</span>
        </Button>
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
              <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* <DropdownMenuItem>
              <Users className="mr-2 h-4 w-4" />
              <span>View Contact</span>
            </DropdownMenuItem> */}
            {onDeleteChat && (
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete Chat</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the chat
                      and all its messages.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
