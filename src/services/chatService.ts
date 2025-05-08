
import { db, auth } from '@/lib/firebase';
import type { Chat, Message, User } from '@/types/chat';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  orderBy,
  Timestamp,
  deleteDoc,
  writeBatch,
  getDoc,
  serverTimestamp,
  arrayRemove,
  onSnapshot,
  Unsubscribe,
  setDoc,
} from 'firebase/firestore';
import {nanoid} from 'nanoid'; // Using nanoid for more robust unique IDs than crypto.randomUUID in some server environments

// --- User Management ---
export async function findUserByEmail(email: string): Promise<User | null> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }
  // Assuming email is unique
  const userDoc = querySnapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() } as User;
}

export async function getCurrentUserData(): Promise<User | null> {
  if (!auth.currentUser) return null;
  const userDocRef = doc(db, 'users', auth.currentUser.uid);
  const userDocSnap = await getDoc(userDocRef);
  return userDocSnap.exists() ? (userDocSnap.data() as User) : null;
}


// --- Chat Management ---
export function streamUserChats(userId: string, callback: (chats: Chat[]) => void): Unsubscribe {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef, 
    where('participantEmails', 'array-contains', userId), // userId here is expected to be the email
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const chats: Chat[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore Timestamps to numbers
      const messages = (data.messages || []).map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp instanceof Timestamp ? msg.timestamp.toMillis() : msg.timestamp,
      }));
      chats.push({ 
        id: doc.id, 
        ...data,
        messages,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt,
        lastMessageTimestamp: data.lastMessageTimestamp instanceof Timestamp ? data.lastMessageTimestamp.toMillis() : data.lastMessageTimestamp,
      } as Chat);
    });
    callback(chats);
  }, (error) => {
    console.error("Error streaming user chats:", error);
    callback([]); // Send empty array on error
  });
}


export async function createNewChat(currentUser: User, contactUser: User): Promise<Chat | string> {
  if (currentUser.email === contactUser.email) return "Cannot create chat with yourself.";

  // Check if a 1-on-1 chat already exists
  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef, 
    where('isGroup', '==', false),
    where('participantEmails', 'array-contains', currentUser.email)
  );
  
  const querySnapshot = await getDocs(q);
  const existingChat = querySnapshot.docs.find(doc => {
    const chat = doc.data() as Chat;
    return chat.participantEmails.includes(contactUser.email) && chat.participantEmails.length === 2;
  });

  if (existingChat) {
    return existingChat.data() as Chat; // Return existing chat
  }

  const now = Timestamp.now();
  const newChatRef = doc(collection(db, 'chats'));
  const newChatData: Chat = {
    id: newChatRef.id,
    participants: [currentUser, contactUser],
    participantEmails: [currentUser.email, contactUser.email].sort(), // Store sorted for consistent querying
    messages: [],
    name: contactUser.name, // For 1:1 chat, name is the other user's name
    avatarUrl: contactUser.avatarUrl,
    lastMessagePreview: 'Chat started',
    lastMessageTimestamp: now.toMillis(),
    unreadCount: { [currentUser.id]: 0, [contactUser.id]: 0 },
    isGroup: false,
    createdAt: now.toMillis(),
    updatedAt: now.toMillis(),
  };

  await setDoc(newChatRef, newChatData);
  return newChatData;
}


// --- Message Management ---
export async function sendMessage(chatId: string, text: string, sender: User): Promise<Message | string> {
  if (!text.trim()) return "Message cannot be empty.";

  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);
  if (!chatSnap.exists()) return "Chat not found.";
  
  const chatData = chatSnap.data() as Chat;

  const newMessage: Message = {
    id: nanoid(), // Generate a unique ID for the message
    text,
    timestamp: Timestamp.now().toMillis(),
    senderId: sender.email, // Use email as senderId
    senderName: sender.name,
    senderAvatarUrl: sender.avatarUrl,
    status: 'sent', // Assuming 'sent' initially
  };

  // Update messages array and other chat properties
  await updateDoc(chatRef, {
    messages: arrayUnion(newMessage),
    lastMessagePreview: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
    lastMessageTimestamp: newMessage.timestamp,
    updatedAt: serverTimestamp(),
    // Optionally reset unread counts for other participants here if needed,
    // or handle unread counts on the client-side based on who is viewing the chat.
  });

  return newMessage;
}


export async function editMessageInChat(chatId: string, messageId: string, newText: string): Promise<string | null> {
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    return "Chat not found.";
  }

  const chatData = chatSnap.data() as Chat;
  const messages = chatData.messages || [];
  const messageIndex = messages.findIndex(msg => msg.id === messageId);

  if (messageIndex === -1) {
    return "Message not found.";
  }

  // Create a new array with the updated message
  const updatedMessages = messages.map((msg, index) => {
    if (index === messageIndex) {
      return {
        ...msg,
        text: newText,
        edited: true,
        timestamp: Timestamp.now().toMillis(), // Update timestamp on edit
      };
    }
    return msg;
  });

  await updateDoc(chatRef, { 
    messages: updatedMessages,
    updatedAt: serverTimestamp() 
  });
  return null; // Success
}


export async function deleteMessageInChat(chatId: string, messageId: string): Promise<string | null> {
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    return "Chat not found.";
  }
  
  const chatData = chatSnap.data() as Chat;
  const messages = chatData.messages || [];
  
  // Find the message to be deleted to create the object for arrayRemove
  const messageToDelete = messages.find(msg => msg.id === messageId);
  if (!messageToDelete) {
    return "Message not found to delete.";
  }

  const updatedMessages = messages.filter(msg => msg.id !== messageId);
  const lastMessage = updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1] : null;

  await updateDoc(chatRef, { 
    messages: updatedMessages, // Use the filtered array
    lastMessagePreview: lastMessage ? lastMessage.text.substring(0,30) + (lastMessage.text.length > 30 ? '...' : '') : "Chat cleared",
    lastMessageTimestamp: lastMessage ? lastMessage.timestamp : serverTimestamp(),
    updatedAt: serverTimestamp() 
  });

  return null; // Success
}


export async function deleteChat(chatId: string): Promise<string | null> {
  const chatRef = doc(db, 'chats', chatId);
  try {
    await deleteDoc(chatRef);
    return null; // Success
  } catch (error) {
    console.error("Error deleting chat:", error);
    return "Failed to delete chat.";
  }
}

// --- Contact (User) Management using Firebase Auth & Firestore ---
// Adding a contact is essentially finding a user by email and then potentially starting a chat.
// The actual "contact list" is implicitly managed by the chats the user is part of.
// No explicit "add contact to list" function is needed if we follow WhatsApp model where chats = contacts.

export async function markMessagesAsRead(chatId: string, userId: string): Promise<void> {
  const chatRef = doc(db, 'chats', chatId);
  // In a more complex system, you might set specific messages as read.
  // For simplicity here, we can update an unreadCount or a 'lastReadTimestamp' for the user.
  // This example assumes unreadCount is an object like { userId1: count, userId2: count }
  // where userId is the Firebase UID.

  const updateData: any = {};
  updateData[`unreadCount.${userId}`] = 0; // Reset unread count for the current user

  try {
    await updateDoc(chatRef, updateData);
  } catch (error) {
    console.error("Error marking messages as read:", error);
    // Handle error appropriately
  }
}

