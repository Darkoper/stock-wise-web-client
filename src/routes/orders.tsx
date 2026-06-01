import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api/client";
import { formatCurrency, formatNumber, relativeTime } from "@/lib/format";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Orders - Stockwise" },
      { name: "description", content: "All orders across every channel." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading, error } = useQuery({ queryKey: ["orders"], queryFn: api.orders.list });
  const deleteOrder = useMutation({
    mutationFn: api.orders.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  if (isLoading) return <div className="py-12 text-sm text-muted-foreground">Loading orders...</div>;
  if (error) return <div className="py-12 text-sm text-[hsl(var(--danger))]">{error.message}</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <PageHeader
        title="Orders"
        description="Track and fulfill orders across all channels."
        actions={<Button size="sm" asChild><Link to="/orders/new"><Plus className="mr-1.5 h-3.5 w-3.5" /> Create order</Link></Button>}
      />

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] uppercase tracking-wide">Order</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide">Customer</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-right">Items</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-right">Total</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wide text-right">Created</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id} className="text-[13px]">
                <TableCell><Link to="/orders/$id" params={{ id: String(o.id) }} className="font-mono font-medium hover:underline">#SW-{String(o.id).padStart(5, "0")}</Link></TableCell>
                <TableCell>{o.customer_name}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{formatNumber(o.items.length)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{formatCurrency(o.total_amount)}</TableCell>
                <TableCell><StatusBadge tone={orderTone(o.status)}>{o.status}</StatusBadge></TableCell>
                <TableCell className="text-right text-muted-foreground">{relativeTime(o.created_at)}</TableCell>
                <TableCell><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteOrder.mutate(o.id)}><Trash2 className="h-4 w-4 text-[hsl(var(--danger))]" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}

function orderTone(status: "pending" | "fulfilled" | "cancelled") {
  if (status === "fulfilled") return "success";
  if (status === "pending") return "warning";
  return "danger";
}
