import * as React from "react";

type ToastProps = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
};

type ToastContextType = {
  toast: (props: ToastProps) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    // Fallback to console if provider not available
    return {
      toast: ({ title, description, variant }: ToastProps) => {
        if (variant === "destructive") {
          console.error(title, description);
        } else {
          console.log(title, description);
        }
      },
    };
  }
  return context;
}
