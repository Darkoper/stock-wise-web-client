import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRouteWithContext } from "@tanstack/react-router";

import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/layouts/AppShell";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-semibold tracking-tight text-foreground">404</h1>
        <h2 className="mt-3 text-base font-medium text-foreground">Page not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href="/dashboard"
          className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Back to dashboard
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-base font-semibold text-foreground">This page didn't load</h1>
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={reset}
          className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}
