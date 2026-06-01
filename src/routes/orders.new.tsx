import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, productImage, type Product } from "@/lib/api/client";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/orders/new")({
  head: () => ({ meta: [{ title: "New order - Stockwise" }] }),
  component: NewOrderPage,
});

interface Line { product: Product; qty: number; }

function NewOrderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [pickerId, setPickerId] = useState("");
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: api.customers.list });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: api.products.list });

  const createOrder = useMutation({
    mutationFn: () => api.orders.create({
      customer_id: Number(customerId),
      items: lines.map((line) => ({ product_id: line.product.id, quantity: line.qty })),
    }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      toast.success("Order created");
      navigate({ to: "/orders" });
    },
    onError: (err) => toast.error(err.message),
  });

  const addLine = () => {
    const p = products.find((x) => String(x.id) === pickerId);
    if (!p) return;
    if (lines.some((l) => l.product.id === p.id)) {
      toast.error("That product is already in the order.");
      return;
    }
    setLines((cur) => [...cur, { product: p, qty: 1 }]);
    setPickerId("");
  };

  const totals = useMemo(() => {
    const total = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
    return { total };
  }, [lines]);
  const canSubmit = customerId && lines.length > 0 && lines.every((l) => l.qty <= l.product.quantity_in_stock);

  return (
    <div>
      <Link to="/orders" className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to orders
      </Link>
      <PageHeader title="Create order" description="Pick a customer, add items, and confirm." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold pb-3">Customer</h2>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger>
              <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.full_name} <span className="ml-2 text-muted-foreground">{c.email}</span></SelectItem>)}</SelectContent>
            </Select>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold pb-3">Line items</h2>
            <div className="flex gap-2 pb-4">
              <Select value={pickerId} onValueChange={setPickerId}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Pick a product" /></SelectTrigger>
                <SelectContent>{products.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}<span className="ml-2 font-mono text-[11px] text-muted-foreground">{p.sku} - {p.quantity_in_stock} in stock</span></SelectItem>)}</SelectContent>
              </Select>
              <Button onClick={addLine} disabled={!pickerId}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add</Button>
            </div>

            {lines.length === 0 ? (
              <p className="rounded-md border border-dashed border-border py-8 text-center text-sm text-muted-foreground">No items yet.</p>
            ) : (
              <ul className="divide-y divide-border rounded-md border border-border">
                {lines.map((l, i) => {
                  const insufficient = l.qty > l.product.quantity_in_stock;
                  return (
                    <li key={l.product.id} className="space-y-1 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={productImage(l.product.id)} alt="" className="h-9 w-9 rounded-md object-cover" />
                        <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-medium">{l.product.name}</div><div className="font-mono text-[11px] text-muted-foreground">{l.product.sku} - {formatCurrency(l.product.price)}</div></div>
                        <div className="space-y-1"><Label className="sr-only">Qty</Label><Input type="number" min={1} value={l.qty} className="h-8 w-20 text-right font-mono" onChange={(e) => {
                          const v = Math.max(1, parseInt(e.target.value || "1", 10));
                          setLines((cur) => cur.map((x, idx) => idx === i ? { ...x, qty: v } : x));
                        }} /></div>
                        <div className="w-24 text-right font-mono tabular-nums text-[13px]">{formatCurrency(l.product.price * l.qty)}</div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLines((cur) => cur.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                      {insufficient && <p className="text-[11px] text-[hsl(var(--danger))]">Only {l.product.quantity_in_stock} in stock. Reduce quantity.</p>}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold">Order summary</h3>
            <Row label="Total" value={formatCurrency(totals.total)} bold />
            <Button className="w-full" disabled={!canSubmit || createOrder.isPending} onClick={() => createOrder.mutate()}>{createOrder.isPending ? "Creating..." : "Create order"}</Button>
            {!canSubmit && <p className="text-[11px] text-muted-foreground text-center">Pick a customer and at least one in-stock item.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: ReactNode; bold?: boolean }) {
  return <div className="flex items-center justify-between text-[13px]"><span className="text-muted-foreground">{label}</span><span className={`font-mono tabular-nums ${bold ? "font-semibold text-foreground" : ""}`}>{value}</span></div>;
}
