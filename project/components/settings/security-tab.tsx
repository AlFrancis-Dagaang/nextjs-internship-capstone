"use client";

import { useState, useTransition } from "react";
import { useUser, useReverification } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Mail,
  KeyRound,
  MoreHorizontal,
  CheckCircle2,
  ShieldAlert,
  Lock,
} from "lucide-react";

export function SecurityTab() {
  const { isLoaded, user } = useUser();
  const { toast } = useToast();

  const [isEmailPending, startEmailTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();

  const [newEmail, setNewEmail] = useState("");
  const [pendingEmailObj, setPendingEmailObj] = useState<any | null>(null);
  const [verificationCode, setVerificationCode] = useState("");

  // Password modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Clerk sensitive action wrappers using useReverification
  const createEmailAddress = useReverification((email: string) => {
    if (!user) throw new Error("User not loaded");
    return user.createEmailAddress({ email });
  });

  const updatePassword = useReverification(
    (args: { currentPassword?: string; newPassword: string }) => {
      if (!user) throw new Error("User not loaded");
      return user.updatePassword(args);
    },
  );

  if (!isLoaded || !user) {
    return (
      <div className="flex items-center justify-center py-16 bg-card border border-border/80 rounded-2xl shadow-xs">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  const emailAddresses = user.emailAddresses || [];
  const primaryEmailId = user.primaryEmailAddressId;

  function handleAddEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim() || !user) return;

    startEmailTransition(async () => {
      try {
        const emailRes = await createEmailAddress(newEmail.trim());
        if (emailRes) {
          await emailRes.prepareVerification({ strategy: "email_code" });
          setPendingEmailObj(emailRes);
          toast({
            title: "Verification code sent",
            description: `Please check ${newEmail} for your 6-digit verification code.`,
          });
        }
      } catch (err: any) {
        toast({
          title: "Failed to add email",
          description:
            err?.errors?.[0]?.message ||
            err?.message ||
            "Could not add email address.",
          variant: "destructive",
        });
      }
    });
  }

  function handleVerifyEmailCode(e: React.FormEvent) {
    e.preventDefault();
    if (!verificationCode.trim() || !pendingEmailObj || !user) return;

    startEmailTransition(async () => {
      try {
        await pendingEmailObj.attemptVerification({
          code: verificationCode.trim(),
        });
        await user.reload();

        toast({
          title: "Email verified",
          description: "Successfully added and verified new email address.",
        });
        setPendingEmailObj(null);
        setNewEmail("");
        setVerificationCode("");
      } catch (err: any) {
        toast({
          title: "Verification failed",
          description:
            err?.errors?.[0]?.message ||
            err?.message ||
            "Invalid verification code.",
          variant: "destructive",
        });
      }
    });
  }

  function handleMakePrimary(emailId: string) {
    if (!user) return;

    startEmailTransition(async () => {
      try {
        await user.update({ primaryEmailAddressId: emailId });
        await user.reload();
        toast({
          title: "Primary email updated",
          description:
            "Your primary email address has been changed successfully.",
        });
      } catch (err: any) {
        toast({
          title: "Failed to update primary email",
          description:
            err?.errors?.[0]?.message ||
            err?.message ||
            "Could not set primary email.",
          variant: "destructive",
        });
      }
    });
  }

  function handleRemoveEmail(emailObj: any) {
    if (!user) return;

    startEmailTransition(async () => {
      try {
        await emailObj.destroy();
        await user.reload();
        toast({
          title: "Email removed",
          description: "The email address has been removed from your account.",
        });
      } catch (err: any) {
        toast({
          title: "Failed to remove email",
          description:
            err?.errors?.[0]?.message ||
            err?.message ||
            "Could not remove email.",
          variant: "destructive",
        });
      }
    });
  }

  function handleResendVerification(emailObj: any) {
    startEmailTransition(async () => {
      try {
        await emailObj.prepareVerification({ strategy: "email_code" });
        setPendingEmailObj(emailObj);
        toast({
          title: "Verification code sent",
          description: `A new code has been sent to ${emailObj.emailAddress}.`,
        });
      } catch (err: any) {
        toast({
          title: "Failed to send code",
          description:
            err?.errors?.[0]?.message || err?.message || "Could not send code.",
          variant: "destructive",
        });
      }
    });
  }

  function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword.trim() || !user) return;

    startPasswordTransition(async () => {
      try {
        if (user.passwordEnabled) {
          await updatePassword({ currentPassword, newPassword });
        } else {
          await updatePassword({ newPassword });
        }
        await user.reload();
        toast({
          title: "Password updated",
          description: user.passwordEnabled
            ? "Your password has been changed."
            : "Password created successfully.",
        });
        setCurrentPassword("");
        setNewPassword("");
        setPasswordModalOpen(false);
      } catch (err: any) {
        toast({
          title: "Failed to update password",
          description:
            err?.errors?.[0]?.message ||
            err?.message ||
            "Could not update password.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Email Addresses Section */}
      <div className="bg-card border border-border/80 rounded-2xl shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-primary" />
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Email Addresses
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Manage email addresses linked to your account.
        </p>

        <div className="divide-y divide-border/60 border border-border/80 rounded-xl overflow-hidden bg-muted/30">
          {emailAddresses.map((emailObj) => {
            const isPrimary = emailObj.id === primaryEmailId;
            const isVerified = emailObj.verification?.status === "verified";

            return (
              <div
                key={emailObj.id}
                className="px-4 py-3 flex items-center justify-between text-xs gap-4"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Mail size={14} className="text-muted-foreground shrink-0" />
                  <span className="font-medium text-foreground truncate">
                    {emailObj.emailAddress}
                  </span>

                  {isPrimary && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      <CheckCircle2 size={11} /> Primary
                    </span>
                  )}
                  {isVerified && !isPrimary && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-muted-foreground border border-border shrink-0">
                      <CheckCircle2 size={11} /> Verified
                    </span>
                  )}
                  {!isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive/10 text-destructive border border-destructive/20 shrink-0">
                      <ShieldAlert size={11} /> Unverified
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                      >
                        <MoreHorizontal size={15} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 bg-card text-card-foreground border-border rounded-xl shadow-xl p-1 z-50 text-xs"
                    >
                      {isVerified && !isPrimary && (
                        <DropdownMenuItem
                          onClick={() => handleMakePrimary(emailObj.id)}
                          className="cursor-pointer px-2.5 py-2 rounded-lg focus:bg-accent focus:text-accent-foreground font-medium"
                        >
                          Set as primary
                        </DropdownMenuItem>
                      )}
                      {!isVerified && (
                        <DropdownMenuItem
                          onClick={() => handleResendVerification(emailObj)}
                          className="cursor-pointer px-2.5 py-2 rounded-lg focus:bg-accent focus:text-accent-foreground font-medium"
                        >
                          Verify email
                        </DropdownMenuItem>
                      )}
                      {emailAddresses.length > 1 && (
                        <DropdownMenuItem
                          onClick={() => handleRemoveEmail(emailObj)}
                          className="cursor-pointer px-2.5 py-2 rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive font-medium"
                        >
                          Remove email
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>

        {!pendingEmailObj ? (
          <form onSubmit={handleAddEmail} className="pt-2 flex gap-2">
            <Input
              type="email"
              placeholder="Add new email address..."
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="h-8 text-xs bg-muted border-border rounded-xl shadow-2xs flex-1"
            />
            <Button
              type="submit"
              disabled={isEmailPending || !newEmail.trim()}
              className="h-8 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-2xs cursor-pointer"
            >
              {isEmailPending && (
                <Loader2 size={13} className="mr-1.5 animate-spin" />
              )}
              Add Email
            </Button>
          </form>
        ) : (
          <form
            onSubmit={handleVerifyEmailCode}
            className="pt-2 p-4 bg-muted/50 border border-border rounded-xl space-y-3"
          >
            <p className="text-xs font-semibold text-foreground">
              Enter 6-digit verification code sent to {newEmail}
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="h-8 text-xs bg-card border-border rounded-xl shadow-2xs flex-1"
              />
              <Button
                type="submit"
                disabled={isEmailPending || !verificationCode.trim()}
                className="h-8 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-2xs cursor-pointer"
              >
                Verify Code
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Password Section */}
      <div className="bg-card border border-border/80 rounded-2xl shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="text-primary" />
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Password
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Manage your account password credentials.
        </p>

        <div className="border border-border/80 rounded-xl bg-muted/30 px-4 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <Lock size={14} className="text-muted-foreground" />
            <span className="font-mono tracking-widest text-foreground text-sm">
              ••••••••••••
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
              >
                <MoreHorizontal size={15} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-card text-card-foreground border-border rounded-xl shadow-xl p-1 z-50 text-xs"
            >
              <DropdownMenuItem
                onClick={() => setPasswordModalOpen(true)}
                className="cursor-pointer px-2.5 py-2 rounded-lg focus:bg-accent focus:text-accent-foreground font-medium"
              >
                {user.passwordEnabled ? "Change password" : "Set password"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Password Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="max-w-md bg-card text-card-foreground border border-border/80 rounded-2xl shadow-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
              {user.passwordEnabled ? "Change Password" : "Set Password"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
            {user.passwordEnabled && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Current Password
                </Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-9 text-xs bg-muted border-border rounded-xl shadow-2xs"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                New Password
              </Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-9 text-xs bg-muted border-border rounded-xl shadow-2xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordModalOpen(false)}
                className="h-8 text-xs font-medium border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPasswordPending || !newPassword.trim()}
                className="h-8 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl cursor-pointer"
              >
                {isPasswordPending && (
                  <Loader2 size={13} className="mr-1.5 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
