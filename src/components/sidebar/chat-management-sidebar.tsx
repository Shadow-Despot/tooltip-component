"use client";

import type { Chat, User } from '@/types/chat';
import { SidebarHeader } from './sidebar-header';
import { ChatList } from '@/components/chat/chat-list';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { currentUser } from '@/lib/dummy-data'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ChatManagementSidebarProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onAddChat: (contact: User) => void;
  onDeleteChat: (chatId: string) => void;
  onAddContact: (name: string, avatarSeed?: string) => void;
  availableContacts: User[];
  className?: string; 
}

export function ChatManagementSidebar({ 
  chats, 
  selectedChatId, 
  onSelectChat,
  onAddChat,
  onDeleteChat,
  onAddContact,
  availableContacts,
  className
}: ChatManagementSidebarProps) {
  const { toast } = useToast();
  const [newContactName, setNewContactName] = useState('');
  const [newContactAvatarSeed, setNewContactAvatarSeed] = useState('');
  const [isAddContactDialogOpen, setIsAddContactDialogOpen] = useState(false);
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);

  const handleAddContact = () => {
    if (newContactName.trim()) {
      onAddContact(newContactName.trim(), newContactAvatarSeed.trim());
      toast({ title: "Contact Added", description: `${newContactName} has been added to your contacts.` });
      setNewContactName('');
      setNewContactAvatarSeed('');
      setIsAddContactDialogOpen(false);
    } else {
      toast({ title: "Error", description: "Contact name cannot be empty.", variant: "destructive" });
    }
  };

  const handleStartNewChat = (contact: User) => {
    onAddChat(contact);
    setIsNewChatDialogOpen(false);
    toast({ title: "Chat Started", description: `Chat with ${contact.name} started.` });
  }

  return (
    <aside className={cn("flex flex-col h-full bg-sidebar", className)}>
      <SidebarHeader 
        onAddNewChat={() => setIsNewChatDialogOpen(true)} 
        onAddNewContact={() => setIsAddContactDialogOpen(true)} 
      />
      <ChatList className="flex-1 min-h-0" chats={chats} selectedChatId={selectedChatId} onSelectChat={onSelectChat} /> {/* Ensure ChatList takes remaining space */}

      {/* Add New Contact Dialog */}
      <Dialog open={isAddContactDialogOpen} onOpenChange={setIsAddContactDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Enter the details for your new contact.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact-name" className="text-right">
                Name
              </Label>
              <Input 
                id="contact-name" 
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact-avatar-seed" className="text-right">
                Avatar Seed (Optional)
              </Label>
              <Input 
                id="contact-avatar-seed" 
                value={newContactAvatarSeed}
                onChange={(e) => setNewContactAvatarSeed(e.target.value)}
                placeholder="e.g. 'john_doe'"
                className="col-span-3" 
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleAddContact}>Add Contact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Chat Dialog (Select from contacts) */}
      <Dialog open={isNewChatDialogOpen} onOpenChange={setIsNewChatDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start New Chat</DialogTitle>
            <DialogDescription>
              Select a contact to start a new chat with.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-72 my-4">
            <div className="space-y-2">
            {availableContacts.filter(c => c.id !== currentUser.id).map(contact => (
              <button 
                key={contact.id}
                onClick={() => handleStartNewChat(contact)}
                className="flex items-center w-full p-2 hover:bg-accent rounded-md transition-colors"
              >
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={contact.avatarUrl} alt={contact.name} data-ai-hint="profile avatar"/>
                  <AvatarFallback>{contact.name.substring(0,1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="truncate">{contact.name}</span>
              </button>
            ))}
            {availableContacts.filter(c => c.id !== currentUser.id).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No contacts available. Add a new contact first.</p>
            )}
            </div>
          </ScrollArea>
          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
             </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
