import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, type OrderItem } from "@/lib/api/client";
import { formatCurrency, relativeTime } from "@/lib/format";

export const Route = createFileRoute("/orders/$id")({
  loader: async ({ params }) => {
    try {
      const order = await api.orders.get(params.id);
      return { order };
    } catch {
      throw notFound();
    }
  },
  notFoundComponent: () => <div className="py-16 text-center text-sm text-muted-foreground">Order not found.</div>,
  head: ({ loaderData }) => ({ meta: [{ title: `#SW-${String(loaderData?.order.id ?? "").padStart(5, "0")} - Stockwise` }] }),
  component: OrderDetail,
});

function OrderDetail() {
  const { order: o } = Route.useLoaderData();
  return (
    <div>
      <Link to="/orders" className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back to orders</Link>
      <PageHeader title={`#SW-${String(o.id).padStart(5, "0")}`} description={`Placed ${relativeTime(o.created_at)} - ${o.customer_name}`} actions={<><StatusBadge tone={orderTone(o.status)}>{o.status}</StatusBadge><Button size="sm" variant="outline">Print</Button></>} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="text-[11px] uppercase tracking-wide">Item</TableHead><TableHead className="text-[11px] uppercase tracking-wide text-right">Qty</TableHead><TableHead className="text-[11px] uppercase tracking-wide text-right">Price</TableHead><TableHead className="text-[11px] uppercase tracking-wide text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>{o.items.map((l: OrderItem) => <TableRow key={l.product_id} className="text-[13px]"><TableCell><div className="font-medium">{l.product_name}</div><div className="font-mono text-[11px] text-muted-foreground">{l.product_sku}</div></TableCell><TableCell className="text-right font-mono tabular-nums">{l.quantity}</TableCell><TableCell className="text-right font-mono tabular-nums">{formatCurrency(l.unit_price)}</TableCell><TableCell className="text-right font-mono tabular-nums">{formatCurrency(l.line_total)}</TableCell></TableRow>)}</TableBody>
          </Table>
        </div>
        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5 space-y-3"><h3 className="text-sm font-semibold">Summary</h3><Row label="Total" value={<span className="text-foreground">{formatCurrency(o.total_amount)}</span>} bold /></div>
          <div className="rounded-lg border border-border bg-card p-5 space-y-2"><h3 className="text-sm font-semibold">Customer</h3><p className="text-[13px]">{o.customer_name}</p><Link to="/customers" className="text-[12px] text-[hsl(var(--accent))] hover:underline">View customers</Link></div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: ReactNode; bold?: boolean }) {
  return <div className="flex items-center justify-between text-[13px]"><span className="text-muted-foreground">{label}</span><span className={`font-mono tabular-nums ${bold ? "font-semibold" : ""}`}>{value}</span></div>;
}

function orderTone(status: "pending" | "fulfilled" | "cancelled") {
  if (status === "fulfilled") return "success";
  if (status === "pending") return "warning";
  return "danger";
}
