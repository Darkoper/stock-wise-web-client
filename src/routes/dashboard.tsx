import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, ArrowUpRight, Package, ShoppingBag, Users } from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, productImage } from "@/lib/api/client";
import { formatCurrency, formatNumber, relativeTime, toNumber } from "@/lib/format";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard - Stockwise" },
      { name: "description", content: "Overview of orders, stock, and customers." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: summary, isLoading, error } = useQuery({ queryKey: ["dashboard"], queryFn: api.dashboard.summary });
  const { data: orders = [] } = useQuery({ queryKey: ["orders"], queryFn: api.orders.list });
  const recent = orders.slice(0, 5);
  const revenue = orders.reduce((sum, order) => sum + toNumber(order.total_amount), 0);

  if (isLoading) return <div className="py-12 text-sm text-muted-foreground">Loading dashboard...</div>;
  if (error || !summary) return <div className="py-12 text-sm text-[hsl(var(--danger))]">{error?.message ?? "Dashboard failed to load"}</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <PageHeader
        title="Dashboard"
        description="A snapshot of your inventory and order operations."
        actions={<Button size="sm" asChild><Link to="/orders/new"><ArrowUpRight className="mr-1.5 h-3.5 w-3.5" /> New order</Link></Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Products" value={formatNumber(summary.total_products)} delta={trendDelta(summary.trends.products)} icon={Package} spark={summary.trends.products} caption="Products added over 7 days" />
        <KpiCard label="Total Orders" value={formatNumber(summary.total_orders)} delta={trendDelta(summary.trends.orders)} icon={ShoppingBag} spark={summary.trends.orders} caption="Daily order volume" />
        <KpiCard label="Low Stock Items" value={formatNumber(summary.low_stock_products)} delta={trendDelta(summary.trends.low_stock)} icon={AlertTriangle} spark={summary.trends.low_stock} caption="SKUs under 5 units" positiveIsGood={false} />
        <KpiCard label="Total Customers" value={formatNumber(summary.total_customers)} delta={trendDelta(summary.trends.customers)} icon={Users} spark={summary.trends.customers} caption="Customers added over 7 days" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="xl:col-span-2 rounded-lg border border-border bg-card p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Revenue from recorded orders</div>
          <div className="mt-1 font-mono text-3xl font-semibold tabular-nums tracking-tight">{formatCurrency(revenue)}</div>
          <p className="mt-2 text-sm text-muted-foreground">Calculated from backend order totals. Stock is reduced automatically when new orders are created.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(summary.order_status_counts).map(([status, count]) => (
              <StatusBadge key={status} tone={orderTone(status)}>{status}: {formatNumber(count)}</StatusBadge>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(summary.customer_status_counts).map(([status, count]) => (
              <StatusBadge key={status} tone={customerTone(status)}>{status}: {formatNumber(count)}</StatusBadge>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card">
          <header className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" /><h2 className="text-sm font-semibold">Low stock alerts</h2></div>
            <Link to="/products" className="text-[11px] font-medium text-muted-foreground hover:text-foreground">View all</Link>
          </header>
          <ul className="divide-y divide-border">
            {summary.low_stock.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <img src={productImage(p.id)} alt="" className="h-9 w-9 rounded-md object-cover" />
                <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-medium">{p.name}</div><div className="font-mono text-[11px] text-muted-foreground">{p.sku}</div></div>
                <span className="inline-flex h-6 items-center rounded-full bg-[hsl(var(--danger)/0.12)] px-2 font-mono text-[11px] font-medium tabular-nums text-[hsl(var(--danger))]">{p.quantity_in_stock} left</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-muted-foreground" /><h2 className="text-sm font-semibold">Recent orders</h2></div>
          <Button variant="ghost" size="sm" className="h-7 text-[11px]" asChild><Link to="/orders">View all</Link></Button>
        </header>
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="h-9 text-[11px] uppercase tracking-wide">Order</TableHead><TableHead className="h-9 text-[11px] uppercase tracking-wide">Customer</TableHead><TableHead className="h-9 text-[11px] uppercase tracking-wide">Items</TableHead><TableHead className="h-9 text-[11px] uppercase tracking-wide">Total</TableHead><TableHead className="h-9 text-[11px] uppercase tracking-wide">Status</TableHead><TableHead className="h-9 text-[11px] uppercase tracking-wide text-right">Created</TableHead></TableRow></TableHeader>
          <TableBody>{recent.map((o) => <TableRow key={o.id} className="text-[13px]"><TableCell className="font-mono font-medium">#SW-{String(o.id).padStart(5, "0")}</TableCell><TableCell>{o.customer_name}</TableCell><TableCell className="tabular-nums">{o.items.length}</TableCell><TableCell className="font-mono tabular-nums">{formatCurrency(o.total_amount)}</TableCell><TableCell><StatusBadge tone={orderTone(o.status)}>{o.status}</StatusBadge></TableCell><TableCell className="text-right text-muted-foreground">{relativeTime(o.created_at)}</TableCell></TableRow>)}</TableBody>
        </Table>
      </section>
    </motion.div>
  );
}

function orderTone(status: string) {
  if (status === "fulfilled") return "success";
  if (status === "pending") return "warning";
  if (status === "cancelled") return "danger";
  return "neutral";
}

function customerTone(status: string) {
  if (status === "active") return "success";
  if (status === "lead") return "accent";
  if (status === "inactive") return "warning";
  if (status === "churned") return "danger";
  return "neutral";
}

function trendDelta(points: { value: number }[]) {
  if (points.length < 2) return 0;
  const first = points[0]?.value ?? 0;
  const last = points.at(-1)?.value ?? 0;
  if (first === 0) return last > 0 ? 1 : 0;
  return (last - first) / first;
}
