export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Message {
  id: string;
  text: string;
  timestamp: number; // Unix timestamp
  senderId: string; // User ID
  status?: 'sent' | 'delivered' | 'read';
  edited?: boolean;
}

export interface Chat {
  id: string;
  participants: User[];
  messages: Message[];
  name: string; // Contact name or Group name
  avatarUrl?: string; // Contact avatar or Group avatar
  lastMessagePreview?: string;
  lastMessageTimestamp?: number;
  unreadCount?: number;
  isGroup?: boolean;
}
