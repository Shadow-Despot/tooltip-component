
"use client";

import { useState, useEffect, useCallback } from 'react';
import { ChatView } from '@/components/chat/chat-view';
import { ChatManagementSidebar } from '@/components/sidebar/chat-management-sidebar';
import type { Chat, Message, User } from '@/types/chat';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/auth-provider';
// useRouter is not needed for redirection here anymore
import { 
  streamUserChats, 
  sendMessage as sendMessageService,
  editMessageInChat,
  deleteMessageInChat,
  deleteChat as deleteChatService,
  findUserByEmail, 
  markMessagesAsRead,
  getCurrentUserData
} from '@/services/chatService';
import { collection, onSnapshot, query, Unsubscribe, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils'; 

export default function MonochromeChatPage() {
  const { currentUser, isLoadingAuthState } = useAuth(); // Use isLoadingAuthState
  const { toast } = useToast();

  const [chats, setChats] = useState<Chat[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); 
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const [isMobileView, setIsMobileView] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list'); 

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      if (!mobile && mobileView === 'chat' && !selectedChatId) {
        // If switching to desktop and chat view was open without a selected chat, revert to list
      } else if (mobile && selectedChatId) {
        setMobileView('chat');
      } else if (mobile && !selectedChatId) {
        setMobileView('list');
      }
    };
    handleResize(); 
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedChatId, mobileView]);

  // AuthProvider now handles redirection if !currentUser and !isLoadingAuthState
  // useEffect(() => {
  //   if (!isLoadingAuthState && !currentUser) {
  //     router.push('/login'); // This logic is moved to AuthProvider
  //   }
  // }, [currentUser, isLoadingAuthState, router]);

  useEffect(() => {
    let unsubscribeChats: Unsubscribe | undefined;
    let unsubscribeUsers: Unsubscribe | undefined;

    if (currentUser) {
      setIsLoadingChats(true);
      unsubscribeChats = streamUserChats(currentUser.email, (fetchedChats) => {
        setChats(fetchedChats);
        setIsLoadingChats(false);
        if (!selectedChatId && fetchedChats.length > 0 && !isMobileView) {
           //setSelectedChatId(fetchedChats[0].id); 
        } else if (selectedChatId && !fetchedChats.some(c => c.id === selectedChatId)) {
            setSelectedChatId(fetchedChats.length > 0 && !isMobileView ? fetchedChats[0].id : null); 
        }
      });

      setIsLoadingUsers(true);
      const usersCollectionRef = collection(db, "users");
      // Query for users whose email is not the current user's email
      const qUsers = query(usersCollectionRef, where("email", "!=", currentUser.email)); 
      unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
        const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setAllUsers(usersList);
        setIsLoadingUsers(false);
      }, (error) => {
        console.error("Error fetching users:", error);
        toast({title: "Error", description: "Could not load users.", variant: "destructive"});
        setIsLoadingUsers(false);
      });
    } else {
      // If no current user, clear chats and users, and stop loading them.
      setChats([]);
      setAllUsers([]);
      setIsLoadingChats(false);
      setIsLoadingUsers(false);
    }
    return () => {
      if (unsubscribeChats) unsubscribeChats();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, [currentUser, toast, isMobileView, selectedChatId]); // Added selectedChatId to dependencies

  const handleSelectChat = useCallback(async (chatId: string) => {
    setSelectedChatId(chatId);
    if (currentUser) {
      await markMessagesAsRead(chatId, currentUser.id); 
    }
    if (isMobileView) {
      setMobileView('chat');
    }
  }, [currentUser, isMobileView]);

  const handleSendMessage = useCallback(async (chatId: string, text: string) => {
    if (!currentUser) return;
    setIsSendingMessage(true);
    const result = await sendMessageService(chatId, text, currentUser);
    setIsSendingMessage(false);
    if (typeof result === 'string') { 
      toast({ title: "Error Sending Message", description: result, variant: "destructive" });
    }
  }, [currentUser, toast]);

  const handleEditMessage = useCallback(async (chatId: string, messageId: string, newText: string) => {
    const error = await editMessageInChat(chatId, messageId, newText);
    if (error) {
      toast({ title: "Error Editing Message", description: error, variant: "destructive" });
    } else {
      toast({ title: "Message Edited", description: "Your message has been updated." });
    }
  }, [toast]);

  const handleDeleteMessage = useCallback(async (chatId: string, messageId: string) => {
    const error = await deleteMessageInChat(chatId, messageId);
    if (error) {
      toast({ title: "Error Deleting Message", description: error, variant: "destructive" });
    } else {
      toast({ title: "Message Deleted", description: "Your message has been removed." });
    }
  }, [toast]);
  
  const handleChatCreated = useCallback((newChat: Chat) => {
    setSelectedChatId(newChat.id);
     if (isMobileView) {
      setMobileView('chat');
    }
  }, [isMobileView]);

  const handleDeleteChat = useCallback(async (chatId: string) => {
    const error = await deleteChatService(chatId);
    if (error) {
      toast({ title: "Error Deleting Chat", description: error, variant: "destructive" });
    } else {
      toast({ title: "Chat Deleted", description: "The chat has been removed." });
      if (selectedChatId === chatId) {
        setSelectedChatId(null); 
        if(isMobileView) setMobileView('list');
      }
    }
  }, [selectedChatId, toast, isMobileView]);

  const handleBackToList = () => {
    if (isMobileView) {
      setMobileView('list');
    }
  };

  const selectedChat = chats.find(chat => chat.id === selectedChatId) || null;

  // If initial auth state is loading, show a full-page loader.
  // AuthProvider will handle redirection if !currentUser after isLoadingAuthState is false.
  // Also consider if currentUser is briefly null during data loading.
  if (isLoadingAuthState || (!currentUser && !isLoadingAuthState) || (currentUser && (isLoadingChats || isLoadingUsers) && chats.length === 0 && allUsers.length === 0) ) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // At this point, if !currentUser, AuthProvider should have redirected.
  // So, if we are here and !currentUser, it's an unexpected state, but better to show loader than crash.
  // However, the above condition `(!currentUser && !isLoadingAuthState)` should ideally lead to AuthProvider redirecting.
  // For safety, if somehow currentUser is null after all loading, it's an issue.
  // But the primary loader above should catch most initial loading states.

  const sidebarComponent = (
      <ChatManagementSidebar
        className={cn(
          "w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-border h-full",
          isMobileView && mobileView === 'chat' ? 'hidden' : 'flex',
          isMobileView && mobileView === 'list' ? 'flex w-full h-full' : ''
        )}
        chats={chats} 
        selectedChatId={selectedChatId} 
        onSelectChat={handleSelectChat}
        allUsers={allUsers}
        isLoadingChats={isLoadingChats || isLoadingUsers} // Pass combined loading state for sidebar internal loaders
        onChatCreated={handleChatCreated}
      />
  );

  const chatViewComponent = (
    <div 
      className={cn(
        "flex-1 flex flex-col min-w-0 h-full",
        isMobileView && mobileView === 'list' ? 'hidden' : 'flex',
        isMobileView && mobileView === 'chat' ? 'w-full h-full' : ''
      )}
    >
      {isMobileView && selectedChat && (
        <div className="p-2 border-b border-border bg-secondary flex-shrink-0 sticky top-0 z-10">
          <Button variant="ghost" size="icon" onClick={handleBackToList} aria-label="Back to chat list">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      )}
      <ChatView 
        chat={selectedChat} 
        onSendMessage={handleSendMessage}
        onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage}
        onDeleteChat={handleDeleteChat} 
        isLoadingMessages={isLoadingChats && !!selectedChatId} // Loading messages for a specific chat
        isSendingMessage={isSendingMessage}
      />
    </div>
  );

  return (
    <div className="flex h-screen antialiased text-foreground bg-background overflow-hidden">
      {!isMobileView && (
        <>
          {sidebarComponent}
          {chatViewComponent}
        </>
      )}

      {isMobileView && (
        <AnimatePresence mode="wait" initial={false}>
          {mobileView === 'list' && (
            <motion.div 
              key="chat-list-mobile"
              className="w-full h-full absolute inset-0"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            >
              {sidebarComponent}
            </motion.div>
          )}
          {mobileView === 'chat' && selectedChatId && (
             <motion.div 
              key="chat-view-mobile"
              className="w-full h-full absolute inset-0"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            >
              {chatViewComponent}
            </motion.div>
          )}
           {/* Fallback for mobile if no chat is selected but view is 'chat' (should not happen often) */}
           {mobileView === 'chat' && !selectedChatId && (
            <motion.div
              key="chat-empty-mobile"
              className="w-full h-full absolute inset-0 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-muted-foreground">Select a chat to view messages.</p>
                 <Button onClick={handleBackToList} className="mt-4">Back to List</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
