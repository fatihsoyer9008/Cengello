"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Chrome, Lock, Mail, MessageSquare, Phone, Video, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { inboxApi } from "@/lib/api/inbox";

const ORBIT_ICONS: { icon: ReactNode; color: string; angleDeg: number; badge?: string }[] = [
  { icon: <Phone className="h-4 w-4" />, color: "bg-blue-500", angleDeg: -90 },
  { icon: <Mail className="h-4 w-4" />, color: "bg-emerald-500", angleDeg: -18 },
  { icon: <MessageSquare className="h-4 w-4" />, color: "bg-purple-500", angleDeg: 54 },
  { icon: <Video className="h-4 w-4" />, color: "bg-indigo-500", angleDeg: 126 },
  { icon: <Chrome className="h-4 w-4" />, color: "bg-amber-500", angleDeg: 198, badge: "YENİ" },
];

const ORBIT_RADIUS = 66;

function OrbitGraphic() {
  return (
    <div className="relative my-6 h-40 w-40">
      <div className="absolute inset-0 rounded-full border border-dashed border-white/15" />
      <div className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10" />
      <div className="animate-orbit-spin absolute inset-0">
        {ORBIT_ICONS.map(({ icon, color, angleDeg, badge }, i) => {
          const rad = (angleDeg * Math.PI) / 180;
          const x = ORBIT_RADIUS * Math.cos(rad);
          const y = ORBIT_RADIUS * Math.sin(rad);
          return (
            <div
              key={i}
              className="absolute left-1/2 top-1/2"
              style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
            >
              <div className="animate-orbit-spin-reverse relative">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white shadow-md ${color}`}>{icon}</div>
                {badge && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-red-500 px-1 py-px text-[8px] font-bold leading-none text-white">
                    {badge}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function InboxPanel({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");

  const { data: items } = useQuery({ queryKey: ["inbox"], queryFn: inboxApi.list });

  const createItem = useMutation({
    mutationFn: (value: string) => inboxApi.create({ text: value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      setText("");
    },
  });

  const removeItem = useMutation({
    mutationFn: (id: string) => inboxApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inbox"] }),
  });

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-r border-white/10 bg-[#0b1a33] text-white">
      <div className="flex items-center justify-between px-3 py-3">
        <h2 className="text-sm font-bold">Gelen Kutusu</h2>
        <button onClick={onClose} className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Kapat">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) createItem.mutate(text.trim());
        }}
        className="px-3 pb-2"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Kart ekle"
          rows={2}
          className="w-full resize-none rounded-md border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (text.trim()) createItem.mutate(text.trim());
            }
          }}
        />
      </form>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {items && items.length > 0 ? (
          <ul className="space-y-1.5">
            {items.map((item) => (
              <li key={item.id} className="group flex items-start justify-between gap-2 rounded-md bg-white/5 px-2.5 py-2 text-sm">
                <span className="flex-1 whitespace-pre-wrap break-words">{item.text}</span>
                <button
                  onClick={() => removeItem.mutate(item.id)}
                  className="shrink-0 rounded p-0.5 text-white/40 opacity-0 hover:bg-white/10 hover:text-white group-hover:opacity-100"
                  aria-label="Kaldır"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center px-2 pt-2 text-center">
            <h3 className="text-base font-semibold">Yapılacaklarınızı birleştirin</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-white/60">
              E-posta gönderin, söyleyin, iletin — nasıl gelirse gelsin, hızlı bir şekilde Cengello&apos;ya alın.
            </p>
            <OrbitGraphic />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 border-t border-white/10 px-3 py-3 text-[11px] text-white/50">
        <Lock className="h-3 w-3 shrink-0" />
        Gelen kutusunu yalnızca siz görebilirsiniz
      </div>
    </aside>
  );
}
