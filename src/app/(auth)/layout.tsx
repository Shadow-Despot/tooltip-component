
'use client';
import type { ReactNode } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Loader2 } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { currentUser, isLoadingAuthState } = useAuth();

  // If auth state is still loading, or if the user is authenticated (AuthProvider will redirect them from auth pages), show a loader.
  if (isLoadingAuthState || currentUser) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }
  
  // If auth state is resolved, and there's no current user, render the login/signup form.
  return <>{children}</>;
}
