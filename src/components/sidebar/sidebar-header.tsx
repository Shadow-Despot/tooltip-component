"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MessageSquarePlus, Users, Settings, LogOut, CircleEllipsis, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Skeleton } from "../ui/skeleton";

interface SidebarHeaderProps {
  onAddNewChat: () => void;
  onAddNewContact: () => void; 
}

export function SidebarHeader({ onAddNewChat, onAddNewContact }: SidebarHeaderProps) {
  const { currentUser, logout, isLoadingAuthState } = useAuth();

  if (isLoadingAuthState || !currentUser) {
    return (
      <div className="p-3 border-b border-border bg-secondary flex justify-between items-center h-[60px] sm:h-[68px]">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    );
  }
  
  const FallbackName = currentUser.name.substring(0,1).toUpperCase();

  return (
    <div className="p-3 border-b border-border bg-secondary flex justify-between items-center h-[60px] sm:h-[68px] flex-shrink-0">
      <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
        <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint="profile avatar" />
        <AvatarFallback>{FallbackName}</AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-0.5 sm:gap-1">
        <Button variant="ghost" size="icon" onClick={onAddNewContact} aria-label="New Contact" className="h-8 w-8 sm:h-9 sm:w-9">
          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onAddNewChat} aria-label="New Chat" className="h-8 w-8 sm:h-9 sm:w-9">
          <MessageSquarePlus className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menu" className="h-8 w-8 sm:h-9 sm:w-9">
              <CircleEllipsis className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{currentUser.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled> {/* Settings not implemented yet */}
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout} disabled={isLoadingAuthState}>
              {isLoadingAuthState ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
