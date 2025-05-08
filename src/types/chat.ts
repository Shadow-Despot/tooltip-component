
export interface User {
  id: string; // This will be the Firebase UID
  name: string;
  email: string; // User's email
  avatarUrl?: string;
}

export interface Message {
  id: string; // Firestore document ID
  text: string;
  timestamp: number; // Unix timestamp (Firestore Timestamps will be converted)
  senderId: string; // User's email
  senderName?: string; // Store sender name for convenience if needed
  senderAvatarUrl?: string; // Store sender avatar for convenience
  status?: 'sent' | 'delivered' | 'read'; // Status might be simplified or handled differently with Firestore
  edited?: boolean;
}

export interface Chat {
  id: string; // Firestore document ID
  participants: User[]; // Array of users in the chat
  participantEmails: string[]; // Array of participant emails for querying
  messages: Message[]; // Messages stored as an array within the chat document
  name: string; // Contact name (for 1:1) or Group name
  avatarUrl?: string; // Contact avatar or Group avatar
  lastMessagePreview?: string;
  lastMessageTimestamp?: number;
  unreadCount?: { [userId: string]: number }; // Unread count per user { email: count }
  isGroup?: boolean;
  groupAdmin?: string; // Email of the group admin if it's a group chat
  createdAt?: number; // Timestamp for when the chat was created
  updatedAt?: number; // Timestamp for when the chat was last updated (e.g., new message)
}
