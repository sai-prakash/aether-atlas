import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { Shell } from "@/components/aether/shell";
import { SetupNeon } from "@/components/aether/setup-neon";
import { isSetupRequiredError } from "@/lib/setup-error";
import { SITE } from "@/lib/site";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${SITE.name} · ${SITE.tagline}` },
      { name: "description", content: SITE.description },
      { name: "theme-color", content: "#09090b" },
      { property: "og:title", content: `${SITE.name} · ${SITE.tagline}` },
      { property: "og:description", content: SITE.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE.url },
      { property: "og:image", content: `${SITE.url}/og.svg` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `${SITE.url}/og.svg` },
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
