"use client";

import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        variant,
        ...props
      }) {
        // Select icon based on toast variant
        const Icon =
          variant === "destructive"
            ? AlertCircle
            : variant === "success"
              ? CheckCircle2
              : variant === "warning"
                ? AlertTriangle
                : Info;

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3 w-full">
              {/* Status Icon */}
              <div className="mt-0.5 shrink-0">
                <Icon
                  className={
                    variant === "destructive"
                      ? "text-red-500 w-5 h-5"
                      : variant === "success"
                        ? "text-emerald-500 w-5 h-5"
                        : variant === "warning"
                          ? "text-amber-500 w-5 h-5"
                          : "text-blue-500 w-5 h-5"
                  }
                />
              </div>

              {/* Text Content */}
              <div className="grid gap-1 flex-1">
                {title && (
                  <ToastTitle className="font-semibold text-sm">
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription className="text-xs text-muted-foreground leading-relaxed">
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>

            {action}
            <ToastClose className="opacity-60 hover:opacity-100 transition-opacity" />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
