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
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setIsLoadingAuthState(true); // Start loading when auth state might change
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setCurrentUser(userDocSnap.data() as User);
          } else {
            // This case might happen if user was created in Auth but not Firestore, or first login.
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
            // Sign out to prevent inconsistent state if Firestore operations fail
            await auth.signOut(); 
            setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoadingAuthState(false); // Auth state resolved
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await auth.signOut();
      // currentUser will be set to null by onAuthStateChanged listener
      // isLoadingAuthState will be set to false by onAuthStateChanged listener
      // Redirection will be handled by the useEffect hook below
      toast({ title: "Logged Out", description: "You have been successfully logged out."});
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: "Logout Failed", description: "Could not sign out. Please try again.", variant: "destructive" });
    }
  };
  
  useEffect(() => {
    if (isLoadingAuthState) {
      return; // Don't redirect while initial auth state is still loading
    }

    const isAuthPage = pathname === '/login' || pathname === '/signup';

    if (currentUser) {
      // User is logged in
      if (isAuthPage) {
        // If on an auth page (login/signup), redirect to home
        router.replace('/');
      }
      // If user is logged in and NOT on an auth page, they are in the right place. No action.
    } else {
      // User is NOT logged in
      if (!isAuthPage) {
        // If not on an auth page, redirect to login
        router.replace('/login');
      }
      // If user is NOT logged in and IS on an auth page, they are in the right place. No action.
    }
  }, [currentUser, isLoadingAuthState, pathname, router]);

  // Show a global loader during the very initial auth state check if NOT on an auth page.
  // AuthLayout handles its own loader for auth pages.
  if (isLoadingAuthState && pathname !== '/login' && pathname !== '/signup') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

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
