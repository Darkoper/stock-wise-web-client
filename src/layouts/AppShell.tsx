import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  Moon,
  Package,
  Search,
  Settings,
  ShoppingCart,
  Sun,
  Users,
  Menu,
  type LucideIcon,
  Box,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "@tanstack/react-router";

type NavItem = { label: string; to: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Catalog",
    items: [{ label: "Products", to: "/products", icon: Package }],
  },
  {
    label: "Sales",
    items: [
      { label: "Orders", to: "/orders", icon: ShoppingCart },
      { label: "Customers", to: "/customers", icon: Users },
    ],
  },
  {
    label: "Settings",
    items: [{ label: "Settings", to: "/settings", icon: Settings }],
  },
];

function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-1">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
        <Box className="h-4 w-4" strokeWidth={2.25} />
      </div>
      {!collapsed && (
        <span className="text-[15px] font-semibold tracking-tight text-foreground">Stockwise</span>
      )}
    </div>
  );
}

function SidebarNav({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-1 flex-col gap-6 px-3 py-4">
      {NAV.map((group) => (
        <div key={group.label} className="space-y-1">
          {!collapsed && (
            <div className="px-2 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/80">
              {group.label}
            </div>
          )}
          {group.items.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  collapsed && "justify-center px-0",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r bg-foreground" />
                )}
                <item.icon className="h-4 w-4" strokeWidth={1.75} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="border-t border-sidebar-border p-3">
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-md p-1.5 hover:bg-sidebar-accent transition-colors",
          collapsed && "justify-center",
        )}
      >
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-foreground text-background text-[11px] font-medium">AT</AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-foreground">Avery Tan</div>
            <div className="truncate text-[11px] text-muted-foreground">Acme Workspace</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      className={cn(
        "hidden lg:flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
        collapsed ? "w-[64px]" : "w-[240px]",
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-2">
        <Logo collapsed={collapsed} />
        <button
          onClick={onToggle}
          className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>
      <SidebarNav collapsed={collapsed} />
      <SidebarFooter collapsed={collapsed} />
    </aside>
  );
}

function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) parts.push("dashboard");
  return (
    <nav className="hidden md:flex items-center gap-1.5 text-[13px] text-muted-foreground">
      <Link to="/dashboard" className="hover:text-foreground transition-colors">Stockwise</Link>
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="text-muted-foreground/40">/</span>
          <span className={i === parts.length - 1 ? "text-foreground font-medium capitalize" : "capitalize"}>
            {p}
          </span>
        </span>
      ))}
    </nav>
  );
}

function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const navigate = useNavigate();
  const go = (to: string) => {
    onOpenChange(false);
    navigate({ to });
  };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search products, customers, orders…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go("/dashboard")}><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</CommandItem>
          <CommandItem onSelect={() => go("/products")}><Package className="mr-2 h-4 w-4" />Products</CommandItem>
          <CommandItem onSelect={() => go("/orders")}><ShoppingCart className="mr-2 h-4 w-4" />Orders</CommandItem>
          <CommandItem onSelect={() => go("/customers")}><Users className="mr-2 h-4 w-4" />Customers</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Create">
          <CommandItem onSelect={() => go("/products")}><Package className="mr-2 h-4 w-4" />Add product</CommandItem>
          <CommandItem onSelect={() => go("/customers")}><Users className="mr-2 h-4 w-4" />Add customer</CommandItem>
          <CommandItem onSelect={() => go("/orders/new")}><ShoppingCart className="mr-2 h-4 w-4" />Create order</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function Topbar({ onOpenSearch, onOpenSidebar }: { onOpenSearch: () => void; onOpenSidebar: () => void }) {
  const [, , toggleTheme] = useTheme();
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <button
        className="lg:hidden flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
        onClick={onOpenSidebar}
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>
      <Breadcrumbs />
      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={onOpenSearch}
          className="hidden md:flex h-9 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-[13px] text-muted-foreground hover:border-foreground/20 hover:text-foreground transition-colors min-w-[260px]"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search…</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleTheme} aria-label="Toggle theme">
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="hidden h-4 w-4 dark:inline" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <div className="ml-1 h-8 w-px bg-border" />
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-foreground text-background text-[11px] font-medium">AT</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[260px] p-0">
          <div className="flex h-14 items-center border-b border-border px-2">
            <Logo />
          </div>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
          <SidebarFooter />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenSearch={() => setPaletteOpen(true)} onOpenSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
