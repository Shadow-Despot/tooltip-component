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
      setIsLoadingAuthState(true);
      if (firebaseUser) {
        // Immediately set a basic user object from Firebase Auth data.
        // This allows redirection logic to work even if Firestore fetch is slow or fails.
        const basicUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
          avatarUrl: firebaseUser.photoURL || `https://picsum.photos/seed/${firebaseUser.uid}/100/100`,
        };
        setCurrentUser(basicUser); // Set basic user information first

        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setCurrentUser(userDocSnap.data() as User); // Update with full Firestore data
            console.log('AuthProvider: User document found and currentUser updated from Firestore.');
          } else {
            // Firestore document doesn't exist, create it using the basicUser info.
            console.log('AuthProvider: User document not found in Firestore, creating new one with basic info.');
            await setDoc(userDocRef, basicUser);
            // currentUser is already basicUser, which is correct here.
          }
        } catch (error: any) {
          console.error("AuthProvider: Error fetching/creating user document in Firestore. User will proceed with basic auth data.", error);
          // Do not sign out. User remains logged in with basic info.
          // currentUser is already set to basicUser.
          toast({
            title: "Profile Sync Issue",
            description: "Could not fully sync your profile. Some features might be limited. Please check your connection.",
            variant: "destructive",
            duration: 7000, // Show for longer
          });
        }
      } else {
        setCurrentUser(null);
        console.log('AuthProvider: No Firebase user, currentUser set to null.');
      }
      setIsLoadingAuthState(false);
      // The console log for isLoadingAuthState and currentUser was moved to the redirect effect
      // to show state *when redirection logic runs*.
    });

    return () => unsubscribe();
  }, [toast]); // Added toast to dependency array as it's used in the effect.

  const logout = async () => {
    setIsLoadingAuthState(true);
    try {
      await auth.signOut();
      // currentUser will be set to null by onAuthStateChanged listener.
      toast({ title: "Logged Out", description: "You have been successfully logged out."});
      console.log('AuthProvider: User logged out successfully.');
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: "Logout Failed", description: "Could not sign out. Please try again.", variant: "destructive" });
      setIsLoadingAuthState(false); 
    }
  };
  
  useEffect(() => {
    // Log state *before* redirection logic
    console.log(`AuthProvider (redirect check): isLoadingAuthState: ${isLoadingAuthState}, currentUser: ${!!currentUser}, email: ${currentUser?.email}, pathname: ${pathname}`);

    if (isLoadingAuthState) {
      console.log('AuthProvider (redirect logic): Auth state still loading, skipping redirect checks.');
      return; 
    }

    const isAuthPage = pathname === '/login' || pathname === '/signup';
    
    if (currentUser) {
      // User is logged in
      if (isAuthPage) {
        console.log('AuthProvider: User logged in, on auth page, redirecting to /');
        router.replace('/');
      } else {
        console.log('AuthProvider: User logged in, not on auth page, no redirect needed.');
      }
    } else {
      // User is NOT logged in
      if (!isAuthPage) {
        console.log('AuthProvider: User not logged in, not on auth page, redirecting to /login');
        router.replace('/login');
      } else {
         console.log('AuthProvider: User not logged in, on auth page, no redirect needed.');
      }
    }
  }, [currentUser, isLoadingAuthState, pathname, router]);

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
