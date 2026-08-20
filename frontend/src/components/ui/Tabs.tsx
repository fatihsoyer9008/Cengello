"use client";

import * as RadixTabs from "@radix-ui/react-tabs";
import type { ReactNode } from "react";

interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({ items, defaultValue, value, onValueChange }: TabsProps) {
  return (
    <RadixTabs.Root defaultValue={defaultValue} value={value} onValueChange={onValueChange}>
      <RadixTabs.List className="mb-3 flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            className="border-b-2 border-transparent px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 dark:text-gray-400 dark:hover:text-gray-200 dark:data-[state=active]:border-blue-400 dark:data-[state=active]:text-blue-400"
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((item) => (
        <RadixTabs.Content key={item.value} value={item.value}>
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
