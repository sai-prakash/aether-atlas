import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, History, Layers, Map, MoreHorizontal, Newspaper, ShieldOff, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { HundredMark } from "./mark";
import { CommandPalette, SearchTrigger } from "./command";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SITE } from "@/lib/site";

const NAV = [
  { to: "/", label: "Today", icon: Newspaper },
  { to: "/week", label: "Letter", icon: BookOpen },
  { to: "/archive", label: "Archive", icon: History },
  { to: "/atlas", label: "Atlas", icon: Map },
] as const;

const MORE = [
  { to: "/refusals", label: "Not listed", icon: ShieldOff },
  { to: "/lab", label: "How it runs", icon: Layers },
  { to: "/ira", label: "Ira", icon: User },
] as const;

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [cmd, setCmd] = useState(false);
  if (pathname.startsWith("/embed/")) return <>{children}</>;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-52 flex-col border-r border-border bg-bg md:flex">
        <Link to="/" className="flex items-center gap-2.5 px-5 py-5 text-fg">
          <HundredMark />
          <span className="font-display text-2xl tracking-tight">{SITE.name}</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {NAV.map((item) => (
            <NavLink key={item.to} {...item} active={isActive(pathname, item.to)} />
          ))}
          <p className="mb-1 mt-8 px-3 text-xs text-subtle">Also</p>
          {MORE.map((item) => (
            <NavLink key={item.to} {...item} active={isActive(pathname, item.to)} />
          ))}
        </nav>
        <p className="px-5 pb-5 text-[11px] leading-relaxed text-subtle">
          Mentions aren’t rank.
          <br />
          <a href="/feed.xml" className="hover:text-fg">
            RSS
          </a>
          {" · "}
          <a href="/api/day.json" className="hover:text-fg">
            Days
          </a>
        </p>
      </aside>

      <div className="md:pl-52">
        <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <Link to="/" className="text-fg md:hidden">
              <HundredMark className="size-6" />
            </Link>
            <div className="flex-1">
              <SearchTrigger onOpen={() => setCmd(true)} />
            </div>
          </div>
        </header>
        <main id="main" className="px-4 pb-24 pt-6 sm:px-6 md:pb-12">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="grid grid-cols-5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex min-h-12 flex-col items-center justify-center gap-0.5 text-[10px]",
                    active ? "text-fg" : "text-subtle",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <Sheet>
              <SheetTrigger className="flex min-h-12 w-full flex-col items-center justify-center gap-0.5 text-[10px] text-subtle">
                <MoreHorizontal className="size-4" />
                Also
              </SheetTrigger>
              <SheetContent side="bottom" className="pb-8">
                <SheetHeader>
                  <SheetTitle>Also</SheetTitle>
                </SheetHeader>
                <div className="grid gap-1 px-3 pb-4">
                  {MORE.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm hover:bg-elevated"
                      >
                        <Icon className="size-4 text-muted" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </li>
        </ul>
      </nav>

      <CommandPalette open={cmd} onOpenChange={setCmd} />
    </div>
  );
}

function NavLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: (typeof NAV)[number]["to"] | (typeof MORE)[number]["to"];
  label: string;
  icon: typeof BookOpen;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex min-h-10 items-center gap-2.5 rounded-md px-3 text-sm transition-colors duration-150",
        active ? "bg-elevated text-fg" : "text-muted hover:bg-elevated/60 hover:text-fg",
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}
