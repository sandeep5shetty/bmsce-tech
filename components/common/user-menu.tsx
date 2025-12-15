"use client";

import { useState } from "react";

import { useProgress, useRouter } from "@bprogress/next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

import { ProfileDialog } from "@/features/profile/components/profile-dialog";

import { logout } from "@/actions/auth";

import { Loader } from "@/components/icons";
import { User as UserType } from "@/types";

import { Logout, User } from "../icons";

interface UserMenuProps {
  user: UserType;
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [profileOpen, setProfileOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { start, stop } = useProgress();

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Clear all cached queries
      queryClient.clear();
      // Redirect to login
      router.push("/auth/login");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to logout");
    },
  });

  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || user.email[0].toUpperCase();

  return (
    <>
      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={user}
      />
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full p-0"
            aria-label="User menu"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.image || ""} alt={user.name || ""} />
              <AvatarFallback className="text-sm">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="end">
          <div className="flex items-center gap-3 p-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.image || ""} alt={user.name || ""} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm leading-none font-medium">{user.name}</p>
              <p className="text-muted-foreground text-xs">{user.email}</p>
            </div>
          </div>
          <Separator />
          <div className="p-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              size="sm"
              onClick={() => {
                start();
                setPopoverOpen(false);
                setProfileOpen(true);
                stop();
              }}
            >
              <User className="mr-2" />
              Profile
            </Button>
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/8 w-full justify-start"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <Loader className="mr-2 h-4 w-4" />
              ) : (
                <Logout className="mr-2" />
              )}
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
