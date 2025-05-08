
'use client';
import type { ReactNode } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { currentUser, isAuthenticating } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticating && currentUser) {
      router.replace('/'); // Redirect to home if authenticated and trying to access auth pages
    }
  }, [currentUser, isAuthenticating, router]);

  if (isAuthenticating || (!isAuthenticating && currentUser)) {
    // Show loader or nothing while checking auth or if redirecting
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }
  
  // Only render children (login/signup form) if not authenticating and no current user
  return <>{children}</>;
}
