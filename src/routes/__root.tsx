import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { Shell } from "@/components/aether/shell";
import { SetupNeon } from "@/components/aether/setup-neon";
import { isSetupRequiredError } from "@/lib/setup-error";
import appCss from "../styles.css?url";

const APP_NAME = "AETHER";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content: "Aether is a living atlas of AI — tools, models, papers, techniques, and rankings from public firehoses. One daily pulse, then the desk sleeps.",
      },
      { name: "theme-color", content: "#09090b" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Instrument+Serif:ital@0;1&display=swap",
      },
    ],
  }),
  component: Root,
  errorComponent: DeskError,
});

function Root() {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg">
        <PreviewHostBridge />
        <AuthProvider>
          <TooltipProvider delayDuration={200}>
            <Shell>
              <Outlet />
            </Shell>
            <Toaster
              theme="dark"
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "#18181c",
                  color: "#f4f4f5",
                  border: "1px solid rgba(255,255,255,0.08)",
                },
              }}
            />
          </TooltipProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}

function DeskError({ error }: { error: Error }) {
  const setup = isSetupRequiredError(error);
  return (
    <html lang="en" className="antialiased">
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg">
        {setup ? (
          <SetupNeon detail={error.message} />
        ) : (
          <div className="mx-auto max-w-xl px-6 py-24">
            <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Desk</p>
            <h1 className="mt-2 font-display text-4xl italic tracking-tight">The desk could not open.</h1>
            <p className="mt-4 text-sm text-muted">{error.message}</p>
          </div>
        )}
        <Scripts />
      </body>
    </html>
  );
}
