
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import type { User } from '@/types/chat';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  currentUser: User | null;
  isLoadingAuthState: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuthState, setIsLoadingAuthState] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setCurrentUser(userDocSnap.data() as User);
          } else {
            const newUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
              avatarUrl: firebaseUser.photoURL || `https://picsum.photos/seed/${firebaseUser.uid}/100/100`,
            };
            await setDoc(userDocRef, newUser);
            setCurrentUser(newUser);
          }
        } catch (error: any) {
            console.error("Error fetching or creating user document in Firestore:", error);
            await auth.signOut(); // Sign out to prevent inconsistent state
            setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoadingAuthState(false); // Initial auth state resolved
    });

    return () => unsubscribe();
  }, []); // Runs once on mount

  const logout = async () => {
    setIsLoadingAuthState(true); // Indicate transition
    try {
      await auth.signOut();
      setCurrentUser(null);
      // router.push('/login'); // Redirection handled by useEffect below
    } catch (error) {
      console.error("Error signing out: ", error);
    } finally {
      // No need to setIsLoadingAuthState(false) here, onAuthStateChanged will fire with null user
      // and set it to false. This avoids a flash of content if logout is slow.
      // Forcing a redirect to login is safer after sign out, handled by the effect.
       if (pathname !== '/login') { // prevent loop if already on login
            router.push('/login');
       } else {
            setIsLoadingAuthState(false); // if already on login, just stop loading.
       }
    }
  };
  
  useEffect(() => {
    if (!isLoadingAuthState) { // Only redirect after initial auth state is known
      const isAuthPage = pathname === '/login' || pathname === '/signup';
      if (currentUser && isAuthPage) {
        router.replace('/'); // Logged in, on auth page -> redirect to home
      } else if (!currentUser && !isAuthPage) {
        router.replace('/login'); // Not logged in, not on auth page -> redirect to login
      }
    }
  }, [currentUser, isLoadingAuthState, pathname, router]);

  // Show a global loader during the very initial auth state check if NOT on an auth page.
  if (isLoadingAuthState && pathname !== '/login' && pathname !== '/signup') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // For auth pages, AuthLayout will handle its own loading/content based on isLoadingAuthState and currentUser.
  // For other pages, they will render their content or loaders.
  return (
    <AuthContext.Provider value={{ currentUser, isLoadingAuthState, logout }}>
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
