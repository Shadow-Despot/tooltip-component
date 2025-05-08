"use client";

import { useState, useEffect, useCallback } from 'react';
import { ChatView } from '@/components/chat/chat-view';
import { ChatManagementSidebar } from '@/components/sidebar/chat-management-sidebar';
import type { Chat, Message, User } from '@/types/chat';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/auth-provider';
import { 
  streamUserChats, 
  sendMessage as sendMessageService,
  editMessageInChat,
  deleteMessageInChat,
  deleteChat as deleteChatService,
  // findUserByEmail, // No longer used directly on this page, handled in sidebar
  markMessagesAsRead,
  // getCurrentUserData // No longer used directly, currentUser from useAuth is preferred
} from '@/services/chatService';
import { collection, onSnapshot, query, Unsubscribe, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils'; 

export default function MonochromeChatPage() {
  const { currentUser, isLoadingAuthState } = useAuth();
  const { toast } = useToast();

  const [chats, setChats] = useState<Chat[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); 
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true); // Combined loader for chats & users
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const [isMobileView, setIsMobileView] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list'); 

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      if (!mobile && mobileView === 'chat' && !selectedChatId) {
        // Desktop, chat view was open without selected chat (no specific action needed here, view will adjust)
      } else if (mobile && selectedChatId) {
        setMobileView('chat');
      } else if (mobile && !selectedChatId) {
        setMobileView('list');
      }
    };

    if (typeof window !== 'undefined') {
        handleResize(); 
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }
  }, [selectedChatId, mobileView]); // mobileView dependency removed if it causes loops, selectedChatId is key


  useEffect(() => {
    let unsubscribeChats: Unsubscribe | undefined;
    let unsubscribeUsers: Unsubscribe | undefined;

    if (currentUser && !isLoadingAuthState) { // Ensure currentUser is available and auth state is resolved
      setIsLoadingInitialData(true);
      let chatsLoaded = false;
      let usersLoaded = false;

      const checkDataLoaded = () => {
        if (chatsLoaded && usersLoaded) {
          setIsLoadingInitialData(false);
        }
      };

      unsubscribeChats = streamUserChats(currentUser.email, (fetchedChats) => {
        setChats(fetchedChats);
        chatsLoaded = true;
        checkDataLoaded();
        
        // Auto-select logic (careful with mobile view)
        if (!selectedChatId && fetchedChats.length > 0 && !isMobileView) {
           // setSelectedChatId(fetchedChats[0].id); // Consider if this auto-selection is desired
        } else if (selectedChatId && !fetchedChats.some(c => c.id === selectedChatId)) {
            // If current selected chat is deleted/gone, select first available on desktop, or none
            setSelectedChatId(fetchedChats.length > 0 && !isMobileView ? fetchedChats[0].id : null); 
        }
      }, (error) => {
        console.error("Error fetching chats:", error);
        toast({title: "Error", description: "Could not load chats.", variant: "destructive"});
        chatsLoaded = true; // Mark as loaded to stop global loader
        checkDataLoaded();
      });

      const usersCollectionRef = collection(db, "users");
      const qUsers = query(usersCollectionRef, where("email", "!=", currentUser.email)); 
      unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
        const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setAllUsers(usersList);
        usersLoaded = true;
        checkDataLoaded();
      }, (error) => {
        console.error("Error fetching users:", error);
        toast({title: "Error", description: "Could not load users.", variant: "destructive"});
        usersLoaded = true; // Mark as loaded
        checkDataLoaded();
      });
    } else if (!isLoadingAuthState && !currentUser) {
      // User is logged out, AuthProvider handles redirection. Clear local state.
      setChats([]);
      setAllUsers([]);
      setIsLoadingInitialData(false); // No data to load
    }
    
    return () => {
      if (unsubscribeChats) unsubscribeChats();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, [currentUser, isLoadingAuthState, toast, isMobileView]); // selectedChatId removed to avoid re-subscribing on chat select

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
    setSelectedChatId(newChat.id); // Auto-select newly created chat
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
      setSelectedChatId(null); // Deselect chat when going back to list on mobile
    }
  };

  const selectedChat = chats.find(chat => chat.id === selectedChatId) || null;

  // AuthProvider handles redirection if !currentUser.
  // This loader handles the initial data fetching phase after auth is confirmed.
  if (isLoadingAuthState || (currentUser && isLoadingInitialData)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If here and !currentUser, AuthProvider should have redirected.
  // If somehow still here without user, it indicates an issue, but rendering UI for this state is complex.
  // The main loader above covers auth loading and initial data loading with a user.

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
        isLoadingChats={isLoadingInitialData} // Sidebar uses this for its internal loaders
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
        isLoadingMessages={isLoadingInitialData && !!selectedChatId && (!selectedChat || selectedChat.messages.length === 0)}
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
          {mobileView === 'chat' && selectedChatId && ( // Ensure selectedChatId exists for chat view
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
           {/* Fallback for mobile if 'chat' view is active but no chat is selected */}
           {mobileView === 'chat' && !selectedChatId && (
            <motion.div
              key="chat-empty-mobile"
              className="w-full h-full absolute inset-0 flex flex-col items-center justify-center p-4 bg-background"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Loading chat details or select one.</p>
                 <Button onClick={handleBackToList} variant="outline">Back to Chat List</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
