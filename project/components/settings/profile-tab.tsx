"use client";

import { useState, useEffect, useTransition } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type UserSchema = {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export function ProfileTab({ dbUser }: { dbUser: UserSchema }) {
  const { isLoaded, user } = useUser();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
    }
  }, [user]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-16 bg-card border border-border/80 rounded-2xl shadow-xs">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    startTransition(async () => {
      try {
        await user.update({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
        toast({
          title: "Profile updated",
          description: "Your name has been updated successfully.",
        });
      } catch (err: any) {
        toast({
          title: "Failed to update profile",
          description:
            err?.errors?.[0]?.message ||
            err?.message ||
            "Something went wrong.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="bg-card border border-border/80 rounded-2xl shadow-xs p-6 space-y-6">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Profile Information
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Update your personal details associated with your account.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              First Name
            </Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="h-9 text-xs bg-muted border-border rounded-xl shadow-2xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Last Name
            </Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="h-9 text-xs bg-muted border-border rounded-xl shadow-2xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Email Address (Read-only)
          </Label>
          <Input
            readOnly
            value={dbUser.email}
            className="h-9 text-xs bg-muted/60 border-border rounded-xl shadow-2xs text-muted-foreground cursor-not-allowed"
          />
          <p className="text-[11px] text-muted-foreground">
            To update your email address or manage credentials, visit the
            Security tab.
          </p>
        </div>

        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            disabled={isPending}
            className="h-8 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-2xs cursor-pointer"
          >
            {isPending && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
