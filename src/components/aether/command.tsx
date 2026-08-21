import { useEffect, useState } from "react";
import { Command as Cmdk } from "cmdk";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { searchAll } from "@/lib/server/queries";
import { KIND_LABEL, type Entity } from "@/lib/catalog/types";
import { SITE } from "@/lib/site";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Entity[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const query = q.trim();
      if (!query) {
        setHits([]);
        return;
      }
      void searchAll({ data: { q: query } }).then(setHits);
    }, 120);
    return () => clearTimeout(t);
  }, [q, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]">
      <button
        type="button"
        className="absolute inset-0 bg-bg/70"
        aria-label="Close search"
        onClick={() => onOpenChange(false)}
      />
      <Cmdk
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]"
        label={`Search ${SITE.name}`}
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 text-subtle" />
          <Cmdk.Input
            autoFocus
            value={q}
            onValueChange={setQ}
            placeholder="Search tools, models, papers, techniques"
            className="h-12 w-full bg-transparent text-sm text-fg outline-none placeholder:text-subtle"
          />
        </div>
        <Cmdk.List className="max-h-80 overflow-y-auto p-2">
          <Cmdk.Empty className="px-3 py-8 text-center text-sm text-muted">
            {q ? "Nothing in the atlas matches." : "Type to search the atlas."}
          </Cmdk.Empty>
          {hits.map((e) => (
            <Cmdk.Item
              key={e.id}
              value={`${e.name} ${e.id}`}
              onSelect={() => {
                onOpenChange(false);
                void navigate({ to: "/e/$slug", params: { slug: e.id } });
              }}
              className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm data-[selected=true]:bg-elevated"
            >
              <span>{e.name}</span>
              <span className="text-[11px] uppercase tracking-wide text-subtle">{KIND_LABEL[e.kind]}</span>
            </Cmdk.Item>
          ))}
        </Cmdk.List>
      </Cmdk>
    </div>
  );
}

export function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-10 min-h-10 w-full items-center gap-2 rounded-md bg-elevated px-3 text-sm text-subtle shadow-[var(--shadow-border)] hover:text-fg"
    >
      <Search className="size-4" />
      <span className="flex-1 text-left">Search Hundred</span>
      <kbd className="hidden rounded bg-surface px-1.5 py-0.5 font-mono text-[10px] text-subtle sm:inline">⌘K</kbd>
    </button>
  );
}
