"use client";

import * as RadixPopover from "@radix-ui/react-popover";
import type { ReactNode } from "react";

export function Popover({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  return (
    <RadixPopover.Root>
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          sideOffset={6}
          className="z-50 w-64 rounded-md border border-gray-200 bg-white p-3 text-sm shadow-lg"
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
