"use client";

import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";

interface MenuItem {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
}

export function DropdownMenu({ trigger, items }: { trigger: ReactNode; items: MenuItem[] }) {
  return (
    <RadixDropdown.Root>
      <RadixDropdown.Trigger asChild>{trigger}</RadixDropdown.Trigger>
      <RadixDropdown.Portal>
        <RadixDropdown.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-[10rem] rounded-md border border-gray-200 bg-white p-1 text-sm shadow-lg"
        >
          {items.map((item) => (
            <RadixDropdown.Item
              key={item.label}
              onSelect={item.onSelect}
              className={`cursor-pointer rounded px-2.5 py-1.5 outline-none hover:bg-gray-100 ${
                item.destructive ? "text-red-600" : "text-gray-700"
              }`}
            >
              {item.label}
            </RadixDropdown.Item>
          ))}
        </RadixDropdown.Content>
      </RadixDropdown.Portal>
    </RadixDropdown.Root>
  );
}
