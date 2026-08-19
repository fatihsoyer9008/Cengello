"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  widthClassName?: string;
}

export function Dialog({ open, onOpenChange, title, children, widthClassName = "max-w-md" }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <RadixDialog.Content
          className={`fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-5 shadow-xl focus:outline-none ${widthClassName}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <RadixDialog.Title className="text-base font-semibold text-gray-900">{title}</RadixDialog.Title>
            <RadixDialog.Close asChild>
              <button
                aria-label="Close"
                className="rounded p-1 text-lg leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                ×
              </button>
            </RadixDialog.Close>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
