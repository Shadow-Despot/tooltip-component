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
      try {
        if (firebaseUser) {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setCurrentUser(userDocSnap.data() as User);
          } else {
            // This case might happen if user was created in Auth but not Firestore, or first login.
            console.log('AuthProvider: User document not found in Firestore, creating new one.');
            const newUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
              avatarUrl: firebaseUser.photoURL || `https://picsum.photos/seed/${firebaseUser.uid}/100/100`,
            };
            await setDoc(userDocRef, newUser);
            setCurrentUser(newUser);
            console.log('AuthProvider: New user document created and currentUser set.');
          }
        } else {
          setCurrentUser(null);
          console.log('AuthProvider: No Firebase user, currentUser set to null.');
        }
      } catch (error: any) {
          console.error("AuthProvider: Error fetching or creating user document in Firestore:", error);
          // If Firestore operations fail, sign out to prevent inconsistent state.
          // onAuthStateChanged will be triggered again with null, which will set currentUser to null.
          if (auth.currentUser) { // Check if there was a user to sign out (i.e., firebaseUser was not null)
            try {
              await auth.signOut();
              console.log('AuthProvider: Signed out user due to Firestore error.');
            } catch (signOutError) {
              console.error("AuthProvider: Error signing out after Firestore error:", signOutError);
              // If sign out also fails, force currentUser to null to prevent inconsistent states.
              setCurrentUser(null);
            }
          } else {
             // If firebaseUser was null and an error occurred (e.g. network before processing firebaseUser)
             setCurrentUser(null);
          }
      } finally {
        setIsLoadingAuthState(false); // Auth state resolved or error handled
        console.log('AuthProvider: isLoadingAuthState set to false. CurrentUser:', currentUser ? currentUser.email : 'null');
      }
    });

    return () => unsubscribe();
  }, []); // Empty dependency array: runs once on mount and cleans up on unmount

  const logout = async () => {
    setIsLoadingAuthState(true);
    try {
      await auth.signOut();
      // currentUser will be set to null by onAuthStateChanged listener.
      // isLoadingAuthState will be handled by onAuthStateChanged listener.
      // Redirection will be handled by the useEffect hook below.
      toast({ title: "Logged Out", description: "You have been successfully logged out."});
      console.log('AuthProvider: User logged out successfully.');
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: "Logout Failed", description: "Could not sign out. Please try again.", variant: "destructive" });
      setIsLoadingAuthState(false); // Ensure loading state is false on logout error
    }
  };
  
  useEffect(() => {
    if (isLoadingAuthState) {
      console.log('AuthProvider (redirect logic): Auth state still loading, skipping redirect checks.');
      return; // Don't redirect while initial auth state is still loading
    }

    const isAuthPage = pathname === '/login' || pathname === '/signup';
    console.log(`AuthProvider (redirect logic): isLoadingAuthState: false, currentUser: ${!!currentUser}, pathname: ${pathname}, isAuthPage: ${isAuthPage}`);

    if (currentUser) {
      // User is logged in
      if (isAuthPage) {
        // If on an auth page (login/signup), redirect to home
        console.log('AuthProvider: User logged in, on auth page, redirecting to /');
        router.replace('/');
      } else {
        console.log('AuthProvider: User logged in, not on auth page, no redirect needed.');
      }
    } else {
      // User is NOT logged in
      if (!isAuthPage) {
        // If not on an auth page, redirect to login
        console.log('AuthProvider: User not logged in, not on auth page, redirecting to /login');
        router.replace('/login');
      } else {
         console.log('AuthProvider: User not logged in, on auth page, no redirect needed.');
      }
    }
  }, [currentUser, isLoadingAuthState, pathname, router]);

  // Show a global loader during the very initial auth state check if NOT on an auth page.
  // AuthLayout handles its own loader for auth pages.
  if (isLoadingAuthState && !pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
    console.log('AuthProvider: Global loader shown (isLoadingAuthState true, not on auth page).');
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  console.log('AuthProvider: Rendering children.');
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
