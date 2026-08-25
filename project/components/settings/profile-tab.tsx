"use client";

import { useUser } from "@clerk/nextjs";
import { Camera, Loader2, User as UserIcon } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useToast } from "@/hooks/use-toast";

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
    }
  }, [user]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-16 bg-card border border-border/80 rounded-3xl shadow-xs">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingImage(true);
    try {
      await user.setProfileImage({ file });
      await user.reload();
      toast({
        title: "Profile picture updated",
        description: "Your new avatar has been uploaded successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Failed to upload image",
        description:
          err?.errors?.[0]?.message || err?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
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
    <div className="bg-card border border-border/80 rounded-3xl shadow-xs p-5 sm:p-6 space-y-6">
      <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
        <div className="p-2 bg-secondary text-foreground rounded-xl border border-border/60">
          <UserIcon size={16} />
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-wider text-foreground">
            Profile Information
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Update your personal details and profile picture associated with
            your account.
          </p>
        </div>
      </div>

      {/* Profile Picture Section (Centered on mobile, left-aligned on desktop) */}
      <div className="flex flex-col items-center sm:flex-row sm:items-center text-center sm:text-left gap-4 py-2">
        <div className="relative group shrink-0">
          <UserAvatar
            userId={dbUser.id}
            name={dbUser.name}
            imageUrl={user?.imageUrl}
            hasImage={!!user?.hasImage}
            className="w-16 h-16 text-base rounded-full border-2 border-border shadow-xs"
          />
          {uploadingImage && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-xs rounded-full flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={20} />
            </div>
          )}
        </div>

        <div className="space-y-1.5 w-full sm:w-auto flex flex-col items-center sm:items-start">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploadingImage || isPending}
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto h-9 text-xs font-medium rounded-xl border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 gap-1.5 cursor-pointer"
          >
            <Camera size={13} />
            Change profile
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Recommended square image, PNG or JPG up to 5MB.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              First Name
            </Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="h-10 text-xs bg-muted border-border rounded-xl shadow-2xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Last Name
            </Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="h-10 text-xs bg-muted border-border rounded-xl shadow-2xs"
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
            className="h-10 text-xs bg-muted/60 border-border rounded-xl shadow-2xs text-muted-foreground cursor-not-allowed"
          />
          <p className="text-[11px] text-muted-foreground">
            To update your email address or manage credentials, visit the
            Security tab.
          </p>
        </div>

        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            disabled={isPending || uploadingImage}
            className="w-full sm:w-auto h-10 px-4 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-2xs cursor-pointer"
          >
            {isPending && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
