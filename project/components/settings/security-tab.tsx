"use client";

import { useReverification, useUser } from "@clerk/nextjs";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MoreHorizontal,
  ShieldAlert,
} from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function SecurityTab() {
  const { isLoaded, user } = useUser();
  const { toast } = useToast();

  const [isEmailPending, startEmailTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();

  const [newEmail, setNewEmail] = useState("");
  const [pendingEmailObj, setPendingEmailObj] = useState<any | null>(null);
  const [verificationCode, setVerificationCode] = useState("");

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const updatePasswordWithReverification = useReverification(
    async (args: { currentPassword?: string; newPassword: string }) => {
      if (!user) {
        throw new Error("User not loaded");
      }

      return user.updatePassword({
        ...(args.currentPassword
          ? { currentPassword: args.currentPassword }
          : {}),
        newPassword: args.newPassword,
      });
    },
  );

  if (!isLoaded || !user) {
    return (
      <div className="flex items-center justify-center py-16 bg-card border border-border/80 rounded-3xl shadow-xs">
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
        const emailRes = await user.createEmailAddress({
          email: newEmail.trim(),
        });

        if (emailRes) {
          await emailRes.prepareVerification({
            strategy: "email_code",
          });

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
        await user.update({
          primaryEmailAddressId: emailId,
        });

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
        await emailObj.prepareVerification({
          strategy: "email_code",
        });

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

    if (!user || !newPassword.trim()) return;

    setPasswordError(null);

    startPasswordTransition(async () => {
      try {
        const hadPassword = user.passwordEnabled;

        if (hadPassword && !currentPassword.trim()) {
          setPasswordError("Please enter your current password.");
          return;
        }

        await updatePasswordWithReverification({
          ...(hadPassword
            ? {
                currentPassword: currentPassword.trim(),
              }
            : {}),
          newPassword: newPassword.trim(),
        });

        await user.reload();

        toast({
          title: hadPassword ? "Password updated" : "Password created",
          description: hadPassword
            ? "Your password has been changed successfully."
            : "Your password has been created successfully.",
        });

        setCurrentPassword("");
        setNewPassword("");
        setPasswordError(null);
        setPasswordModalOpen(false);
      } catch (err: any) {
        if (
          err?.code === "reverification_cancelled" ||
          err?.message?.toLowerCase().includes("cancelled")
        ) {
          return;
        }

        const errorMsg =
          err?.errors?.[0]?.message ||
          err?.message ||
          "Could not update password.";

        setPasswordError(errorMsg);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Email Addresses Section */}
      <div className="bg-card border border-border/80 rounded-3xl shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
          <div className="p-2 bg-secondary text-foreground rounded-xl border border-border/60">
            <Mail size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wider text-foreground">
              Email Addresses
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage email addresses linked to your account.
            </p>
          </div>
        </div>

        <div className="divide-y divide-border/60 border border-border/80 rounded-2xl overflow-hidden bg-muted/30">
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
                      <CheckCircle2 size={11} />
                      Primary
                    </span>
                  )}

                  {isVerified && !isPrimary && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-muted-foreground border border-border shrink-0">
                      <CheckCircle2 size={11} />
                      Verified
                    </span>
                  )}

                  {!isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-destructive/10 text-destructive border border-destructive/20 shrink-0">
                      <ShieldAlert size={11} />
                      Unverified
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
                          className="cursor-pointer px-2.5 py-2 rounded-lg focus:bg-accent/10 focus:text-accent-foreground font-medium"
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
          <form
            onSubmit={handleAddEmail}
            className="pt-2 flex flex-col sm:flex-row gap-2"
          >
            <Input
              type="email"
              placeholder="Add new email address..."
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="h-10 text-xs bg-muted border-border rounded-xl shadow-2xs flex-1"
            />

            <Button
              type="submit"
              disabled={isEmailPending || !newEmail.trim()}
              className="h-10 px-4 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-2xs cursor-pointer"
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
            className="pt-2 p-4 bg-muted/50 border border-border rounded-2xl space-y-3"
          >
            <p className="text-xs font-semibold text-foreground">
              Enter 6-digit verification code sent to {newEmail}
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="h-10 text-xs bg-card border-border rounded-xl shadow-2xs flex-1"
              />

              <Button
                type="submit"
                disabled={isEmailPending || !verificationCode.trim()}
                className="h-10 px-4 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-2xs cursor-pointer"
              >
                Verify Code
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Password Section */}
      <div className="bg-card border border-border/80 rounded-3xl shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
          <div className="p-2 bg-secondary text-foreground rounded-xl border border-border/60">
            <KeyRound size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wider text-foreground">
              Password
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your account password credentials.
            </p>
          </div>
        </div>

        <div className="border border-border/80 rounded-2xl bg-muted/30 px-4 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <Lock size={14} className="text-muted-foreground" />

            <span className="font-mono tracking-widest text-foreground text-sm">
              {user.passwordEnabled ? "••••••••••••" : "No password set"}
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
                onClick={() => {
                  setPasswordError(null);
                  setCurrentPassword("");
                  setNewPassword("");
                  setPasswordModalOpen(true);
                }}
                className="cursor-pointer px-2.5 py-2 rounded-lg focus:bg-accent focus:text-accent-foreground font-medium"
              >
                {user.passwordEnabled ? "Change password" : "Set password"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Password Modal */}
      <Dialog
        open={passwordModalOpen}
        onOpenChange={(open) => {
          setPasswordModalOpen(open);

          if (!open) {
            setPasswordError(null);
            setCurrentPassword("");
            setNewPassword("");
          }
        }}
      >
        <DialogContent className="w-[90vw] sm:max-w-md bg-card text-card-foreground border border-border/80 rounded-3xl shadow-2xl p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
              {user.passwordEnabled ? "Change Password" : "Set Password"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
            {passwordError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                <AlertCircle size={15} className="shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {user.passwordEnabled && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Current Password
                </Label>

                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  className="h-10 text-xs bg-muted border-border rounded-xl shadow-2xs"
                  autoComplete="current-password"
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
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                className="h-10 text-xs bg-muted border-border rounded-xl shadow-2xs"
                autoComplete="new-password"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordModalOpen(false)}
                className="w-full sm:w-auto h-10 text-xs font-medium border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isPasswordPending || !newPassword.trim()}
                className="w-full sm:w-auto h-10 px-4 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl cursor-pointer"
              >
                {isPasswordPending && (
                  <Loader2 size={13} className="mr-1.5 animate-spin" />
                )}
                {user.passwordEnabled ? "Change Password" : "Set Password"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
