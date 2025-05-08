
import type { User } from '@/types/chat';

// This file is largely deprecated with Firebase integration.
// currentUser will be derived from Firebase Auth.

// Kept for potential use in UI components before auth state is fully resolved,
// or for components that might need a default/placeholder user structure.
// However, with AuthProvider, this specific export might become obsolete.
export const placeholderUser: User = {
  id: 'placeholder_user',
  name: 'Loading User...',
  email: 'loading@example.com',
  avatarUrl: 'https://picsum.photos/seed/placeholder/100/100',
};

// All other dummy data (otherUsers, generateDummyMessages, generateDummyChats)
// should be removed or commented out as they are replaced by Firestore data.
