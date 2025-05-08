
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
import { useState, useMemo } from 'react';
import { useAuth } from '@/components/auth/auth-provider'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { findUserByEmail, createNewChat } from '@/services/chatService'; // Firebase services
import { Loader2, UserPlus, Users } from 'lucide-react';

interface ChatManagementSidebarProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  // onAddChat is now initiated from "Start New Chat" with a found user
  // onDeleteChat: (chatId: string) => void; // This will be handled by ChatHeader now for the selected chat
  // onAddContact is now finding user by email
  allUsers: User[]; // All users from DB to select from for new chat, excluding self
  className?: string; 
  isLoadingChats: boolean;
  onChatCreated: (newChat: Chat) => void; // Callback when a new chat is successfully created
}

export function ChatManagementSidebar({ 
  chats, 
  selectedChatId, 
  onSelectChat,
  allUsers,
  className,
  isLoadingChats,
  onChatCreated
}: ChatManagementSidebarProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const [isAddContactDialogOpen, setIsAddContactDialogOpen] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [isFindingContact, setIsFindingContact] = useState(false);
  
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);


  const handleFindAndAddContact = async () => {
    if (!contactEmail.trim() || !currentUser) {
      toast({ title: "Error", description: "Email cannot be empty.", variant: "destructive" });
      return;
    }
    if (contactEmail.trim().toLowerCase() === currentUser.email.toLowerCase()) {
      toast({ title: "Error", description: "You cannot add yourself as a contact.", variant: "destructive" });
      return;
    }

    setIsFindingContact(true);
    const foundUser = await findUserByEmail(contactEmail.trim());
    setIsFindingContact(false);

    if (foundUser) {
      // Check if chat with this contact already exists
      const existingChat = chats.find(c => !c.isGroup && c.participantEmails.includes(foundUser.email));
      if (existingChat) {
        onSelectChat(existingChat.id);
        toast({ title: "Chat Exists", description: `You already have a chat with ${foundUser.name}. Selecting it.`});
        setIsAddContactDialogOpen(false);
        setContactEmail('');
        return;
      }
      // If user found and no existing chat, proceed to create chat
      await handleStartNewChatWithUser(foundUser);
      setIsAddContactDialogOpen(false);
      setContactEmail('');
    } else {
      toast({ title: "Contact Not Found", description: `No user found with email ${contactEmail}.`, variant: "destructive" });
    }
  };

  const handleStartNewChatWithUser = async (contact: User) => {
    if (!currentUser) return;
    setIsCreatingChat(true);
    const result = await createNewChat(currentUser, contact);
    setIsCreatingChat(false);

    if (typeof result === 'string') { // Error message
      toast({ title: "Error Creating Chat", description: result, variant: "destructive" });
    } else { // Chat object
      onChatCreated(result); // Propagate new chat to parent
      onSelectChat(result.id);
      toast({ title: "Chat Started", description: `Chat with ${contact.name} started.` });
      setIsNewChatDialogOpen(false); // Close "select contact" dialog if it was open
    }
  }
  
  // Contacts available for a new chat: users not already in a 1:1 chat with current user
  const contactsForNewChat = useMemo(() => {
    if (!currentUser) return [];
    const existingChatPartnerEmails = new Set(
      chats
        .filter(c => !c.isGroup && c.participantEmails.includes(currentUser.email))
        .flatMap(c => c.participantEmails.filter(email => email !== currentUser.email))
    );
    return allUsers.filter(user => user.email !== currentUser.email && !existingChatPartnerEmails.has(user.email));
  }, [allUsers, chats, currentUser]);


  return (
    <aside className={cn("flex flex-col h-full bg-sidebar-background text-sidebar-foreground", className)}>
      <SidebarHeader 
        onAddNewChat={() => setIsNewChatDialogOpen(true)} 
        onAddNewContact={() => setIsAddContactDialogOpen(true)} 
      />
      <ChatList 
        className="flex-1 min-h-0" 
        chats={chats} 
        selectedChatId={selectedChatId} 
        onSelectChat={onSelectChat} 
        isLoading={isLoadingChats}
      />

      {/* Add New Contact by Email Dialog */}
      <Dialog open={isAddContactDialogOpen} onOpenChange={setIsAddContactDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Enter the email address of the contact you want to add and chat with.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email Address</Label>
              <Input 
                id="contact-email" 
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="friend@example.com"
                className="col-span-3" 
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isFindingContact}>Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleFindAndAddContact} disabled={isFindingContact || !contactEmail.trim()}>
              {isFindingContact && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Find and Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Chat Dialog (Select from known users not in existing chats) */}
      <Dialog open={isNewChatDialogOpen} onOpenChange={setIsNewChatDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start New Chat</DialogTitle>
            <DialogDescription>
              Select a user to start a new chat with. Add new contacts via email if not listed.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-72 my-4">
            <div className="space-y-1">
            {isCreatingChat && (
                <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <p>Starting chat...</p>
                </div>
            )}
            {!isCreatingChat && contactsForNewChat.length > 0 ? (
                contactsForNewChat.map(contact => (
                  <button 
                    key={contact.id}
                    onClick={() => handleStartNewChatWithUser(contact)}
                    className="flex items-center w-full p-2 hover:bg-accent rounded-md transition-colors text-left"
                    disabled={isCreatingChat}
                  >
                    <Avatar className="h-10 w-10 mr-3 flex-shrink-0">
                      <AvatarImage src={contact.avatarUrl} alt={contact.name} data-ai-hint="profile avatar"/>
                      <AvatarFallback>{contact.name.substring(0,1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <span className="block font-medium truncate">{contact.name}</span>
                        <span className="block text-xs text-muted-foreground truncate">{contact.email}</span>
                    </div>
                  </button>
                ))
            ) : null}
            {!isCreatingChat && contactsForNewChat.length === 0 && (
              <div className="text-center py-4 px-2 text-sm text-muted-foreground">
                <Users className="mx-auto h-10 w-10 mb-2 text-muted-foreground/50" />
                <p>No new contacts available for chat.</p>
                <p className="mt-1">You can add new contacts by their email address using the &quot;New Contact&quot; <UserPlus className="inline h-4 w-4 align-text-bottom"/> button.</p>
              </div>
            )}
            </div>
          </ScrollArea>
          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isCreatingChat}>Cancel</Button>
             </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
