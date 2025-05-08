import type { User, Message, Chat } from '@/types/chat';

export const currentUser: User = {
  id: 'user_me',
  name: 'You',
  avatarUrl: 'https://picsum.photos/seed/currentUser/100/100',
};

const otherUsers: User[] = [
  { id: 'user_1', name: 'Alice', avatarUrl: 'https://picsum.photos/seed/alice/100/100' },
  { id: 'user_2', name: 'Bob', avatarUrl: 'https://picsum.photos/seed/bob/100/100' },
  { id: 'user_3', name: 'Charlie', avatarUrl: 'https://picsum.photos/seed/charlie/100/100' },
  { id: 'user_4', name: 'Diana', avatarUrl: 'https://picsum.photos/seed/diana/100/100' },
  { id: 'user_5', name: 'Edward', avatarUrl: 'https://picsum.photos/seed/edward/100/100' },
];

const generateDummyMessages = (chatId: string, participants: User[]): Message[] => {
  const messages: Message[] = [];
  const now = Date.now();
  const numMessages = Math.floor(Math.random() * 15) + 5;

  for (let i = 0; i < numMessages; i++) {
    const sender = Math.random() > 0.3 ? participants.find(p => p.id !== currentUser.id)! : currentUser;
    messages.push({
      id: crypto.randomUUID(),
      text: `Message ${i + 1} in chat ${chatId.substring(0,4)}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
      timestamp: now - (numMessages - i) * 60000 * Math.floor(Math.random() * 5 + 1), // Mins ago
      senderId: sender.id,
      status: Math.random() > 0.5 ? 'read' : 'delivered',
      edited: Math.random() > 0.9 ? true : false,
    });
  }
  return messages.sort((a, b) => a.timestamp - b.timestamp);
};

export const generateDummyChats = (count: number): Chat[] => {
  const chats: Chat[] = [];
  for (let i = 0; i < count; i++) {
    const otherUser = otherUsers[i % otherUsers.length];
    const participants = [currentUser, otherUser];
    const chatId = crypto.randomUUID();
    const messages = generateDummyMessages(chatId, participants);
    const lastMessage = messages[messages.length - 1];

    chats.push({
      id: chatId,
      participants: participants,
      messages: messages,
      name: otherUser.name,
      avatarUrl: otherUser.avatarUrl,
      lastMessagePreview: lastMessage?.text.substring(0, 30) + (lastMessage?.text.length > 30 ? '...' : ''),
      lastMessageTimestamp: lastMessage?.timestamp,
      unreadCount: Math.floor(Math.random() * 3),
      isGroup: false,
    });
  }
  return chats.sort((a,b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
};
