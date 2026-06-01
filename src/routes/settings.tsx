import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Stockwise" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [theme, setTheme] = useTheme();
  return (
    <div>
      <PageHeader title="Settings" description="Workspace preferences and appearance." />
      <div className="space-y-6">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Workspace</h2>
          <p className="pb-4 text-[12px] text-muted-foreground">Name shown in the sidebar and on receipts.</p>
          <div className="grid max-w-md grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ws">Workspace name</Label>
              <Input id="ws" defaultValue="Acme Workspace" />
            </div>
          </div>
        </section>
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Appearance</h2>
          <p className="pb-4 text-[12px] text-muted-foreground">Switch between light and dark.</p>
          <div className="flex gap-2">
            <Button variant={theme === "light" ? "default" : "outline"} size="sm" onClick={() => setTheme("light")}>Light</Button>
            <Button variant={theme === "dark" ? "default" : "outline"} size="sm" onClick={() => setTheme("dark")}>Dark</Button>
          </div>
        </section>
      </div>
    </div>
  );
}
