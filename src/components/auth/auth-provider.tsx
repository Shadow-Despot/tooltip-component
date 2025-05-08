'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import type { User } from '@/types/chat';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAuthenticating: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(true); // Tracks initial auth check
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        try {
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setCurrentUser(userDocSnap.data() as User);
          } else {
            // Create a new user document if it doesn't exist
            const newUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!, // Email should be present for email/password auth
              name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
              avatarUrl: firebaseUser.photoURL || `https://picsum.photos/seed/${firebaseUser.uid}/100/100`,
            };
            try {
              await setDoc(userDocRef, newUser);
              setCurrentUser(newUser);
            } catch (setDocError: any) {
              console.error("Error creating user document in Firestore:", setDocError);
              // If creating user data fails, sign out to prevent inconsistent state
              await auth.signOut();
              setCurrentUser(null);
            }
          }
        } catch (error: any) {
            console.error("Error fetching or creating user document in Firestore:", error);
            // If fetching/creating user data fails, sign out to prevent inconsistent state
            await auth.signOut();
            setCurrentUser(null);
            // Potentially redirect to an error page or show a global error message
            // For now, this will effectively lead to redirection to /login by the subsequent logic
        }
      } else {
        setCurrentUser(null);
        // Redirect to login if not on a public page and not authenticated
        // Check if current path is not /login or /signup
        if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
             router.push('/login');
        }
      }
      setLoading(false);
      setIsAuthenticating(false);
    });

    return () => unsubscribe();
  }, [router]);

  const logout = async () => {
    setLoading(true); // Indicate loading state during logout
    try {
      await auth.signOut();
      setCurrentUser(null); // Clear user state immediately
    } catch (error) {
      console.error("Error signing out: ", error);
      // Handle sign-out error if necessary, though typically it's reliable
    } finally {
      setLoading(false); // End loading state
      router.push('/login'); // Ensure redirection happens after state updates
    }
  };
  
  // Show loading spinner only during initial auth check or if loading state is true but not on login/signup pages
  if (isAuthenticating && (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/signup')) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <AuthContext.Provider value={{ currentUser, loading, isAuthenticating, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
