import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, type Customer } from "@/lib/api/client";
import { formatCurrency, formatNumber, initials, relativeTime } from "@/lib/format";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers - Stockwise" },
      { name: "description", content: "View and manage your customers." },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone_number: "", status: "active" as Customer["status"] });
  const queryClient = useQueryClient();
  const { data: customers = [], isLoading, error } = useQuery({ queryKey: ["customers"], queryFn: api.customers.list });

  const createCustomer = useMutation({
    mutationFn: () => api.customers.create(form),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setForm({ full_name: "", email: "", phone_number: "", status: "active" });
      setSheetOpen(false);
      toast.success("Customer created");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteCustomer = useMutation({
    mutationFn: api.customers.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Customer deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = useMemo(
    () => customers.filter((c) => `${c.full_name} ${c.email}`.toLowerCase().includes(query.toLowerCase())),
    [customers, query],
  );
  const canCreate = form.full_name.trim() && form.email.trim() && form.phone_number.trim();

  if (isLoading) return <div className="py-12 text-sm text-muted-foreground">Loading customers...</div>;
  if (error) return <div className="py-12 text-sm text-[hsl(var(--danger))]">{error.message}</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <PageHeader
        title="Customers"
        description="Everyone who has purchased from your store."
        actions={<Button size="sm" onClick={() => setSheetOpen(true)}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add customer</Button>}
      />

      <div className="pb-4">
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers..." className="h-9 pl-8" />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] uppercase tracking-wide">Customer</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide">Email</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide">Phone</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-right">Orders</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-right">LTV</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide">Created</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id} className="cursor-pointer text-[13px]" onClick={() => setSelected(c)}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-7 w-7"><AvatarFallback className="bg-muted text-[11px] font-medium">{initials(c.full_name)}</AvatarFallback></Avatar>
                    <span className="font-medium">{c.full_name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{c.email}</TableCell>
                <TableCell className="text-muted-foreground">{c.phone_number}</TableCell>
                <TableCell><CustomerStatus status={c.status} /></TableCell>
                <TableCell className="text-right font-mono tabular-nums">{formatNumber(c.total_orders)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{formatCurrency(c.lifetime_value)}</TableCell>
                <TableCell className="text-muted-foreground">{relativeTime(c.created_at)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); deleteCustomer.mutate(c.id); }}>
                    <Trash2 className="h-4 w-4 text-[hsl(var(--danger))]" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10"><AvatarFallback className="bg-foreground text-background text-sm font-medium">{initials(selected.full_name)}</AvatarFallback></Avatar>
                  <div className="text-left">
                    <SheetTitle>{selected.full_name}</SheetTitle>
                    <p className="text-[12px] text-muted-foreground">{selected.email}</p>
                  </div>
                </div>
              </SheetHeader>
              <div className="mt-6 space-y-3">
                <Stat label="Lifetime value" value={formatCurrency(selected.lifetime_value)} />
                <Stat label="Total orders" value={formatNumber(selected.total_orders)} />
                <Stat label="Status" value={<CustomerStatus status={selected.status} />} />
                <Stat label="Phone" value={selected.phone_number} />
                <Stat label="Created" value={relativeTime(selected.created_at)} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle>Add customer</SheetTitle></SheetHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-1.5"><Label htmlFor="full_name">Full name</Label><Input id="full_name" value={form.full_name} onChange={(e) => setForm((cur) => ({ ...cur, full_name: e.target.value }))} placeholder="Avery Tan" /></div>
            <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={(e) => setForm((cur) => ({ ...cur, email: e.target.value }))} placeholder="avery@example.com" /></div>
            <div className="space-y-1.5"><Label htmlFor="phone">Phone</Label><Input id="phone" value={form.phone_number} onChange={(e) => setForm((cur) => ({ ...cur, phone_number: e.target.value }))} placeholder="+1 555 0134" /></div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
            <Button disabled={!canCreate || createCustomer.isPending} onClick={() => createCustomer.mutate()}>{createCustomer.isPending ? "Creating..." : "Create customer"}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3">
      <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{label}</span>
      <span className="font-mono text-[13px] font-medium tabular-nums">{value}</span>
    </div>
  );
}

function CustomerStatus({ status }: { status: Customer["status"] }) {
  const tone = status === "active" ? "success" : status === "lead" ? "accent" : status === "inactive" ? "warning" : "danger";
  return <StatusBadge tone={tone}>{status}</StatusBadge>;
}
