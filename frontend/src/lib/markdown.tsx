"use client";

import ReactMarkdown from "react-markdown";

export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown-body text-sm leading-relaxed text-gray-800 [&_a]:text-blue-600 [&_a]:underline [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_p]:my-1.5">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
