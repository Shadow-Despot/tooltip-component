"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { currentUser } from "@/lib/dummy-data";
import { MessageSquarePlus, Users, Settings, LogOut, CircleEllipsis } from "lucide-react";

interface SidebarHeaderProps {
  onAddNewChat: () => void;
  onAddNewContact: () => void;
}

export function SidebarHeader({ onAddNewChat, onAddNewContact }: SidebarHeaderProps) {
  const FallbackName = currentUser.name.substring(0,1).toUpperCase();
  return (
    <div className="p-3 border-b border-border bg-secondary flex justify-between items-center h-[68px]">
      <Avatar className="h-10 w-10">
        <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint="profile avatar" />
        <AvatarFallback>{FallbackName}</AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onAddNewContact} aria-label="New Contact">
          <Users className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onAddNewChat} aria-label="New Chat">
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menu">
              <CircleEllipsis className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
