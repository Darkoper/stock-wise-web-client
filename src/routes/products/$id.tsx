import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Box, Edit3, ShoppingCart, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api, productImage, type Product } from "@/lib/api/client";
import { formatCurrency, formatNumber, relativeTime, toNumber } from "@/lib/format";

export const Route = createFileRoute("/products/$id")({
  loader: async ({ params }) => {
    try {
      const product = await api.products.get(params.id);
      return { product };
    } catch {
      throw notFound();
    }
  },
  notFoundComponent: () => <div className="py-16 text-center text-sm text-muted-foreground">Product not found.</div>,
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.product.name ?? "Product"} - Stockwise` }] }),
  component: ProductDetail,
});

function ProductDetail() {
  const { product: initialProduct } = Route.useLoaderData();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(productToForm(initialProduct));

  const { data: product = initialProduct } = useQuery({
    queryKey: ["products", initialProduct.id],
    queryFn: () => api.products.get(initialProduct.id),
    initialData: initialProduct,
  });
  const { data: orders = [] } = useQuery({ queryKey: ["orders"], queryFn: api.orders.list });

  useEffect(() => {
    if (editOpen) setForm(productToForm(product));
  }, [editOpen, product]);

  const relatedOrders = useMemo(
    () => orders.filter((order) => order.items.some((item) => item.product_id === product.id)),
    [orders, product.id],
  );
  const unitsSold = relatedOrders.reduce(
    (sum, order) => sum + order.items.filter((item) => item.product_id === product.id).reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  );
  const inventoryValue = toNumber(product.price) * product.quantity_in_stock;
  const stock = stockStatus(product.quantity_in_stock);

  const updateProduct = useMutation({
    mutationFn: () =>
      api.products.update(product.id, {
        name: form.name.trim(),
        sku: form.sku.trim(),
        price: Number(form.price),
        quantity_in_stock: Number(form.quantity_in_stock),
        description: form.description.trim() || null,
      }),
    onSuccess: async (updated) => {
      queryClient.setQueryData(["products", product.id], updated);
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setEditOpen(false);
      toast.success("Product updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteProduct = useMutation({
    mutationFn: () => api.products.delete(product.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Product deleted");
      window.location.href = "/products";
    },
    onError: (err) => toast.error(err.message),
  });

  const canUpdate = form.name.trim() && form.sku.trim() && Number(form.price) >= 0 && Number(form.quantity_in_stock) >= 0;

  return (
    <div>
      <Link to="/products" className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to products
      </Link>

      <PageHeader
        title={product.name}
        description={product.description || "No description yet."}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => deleteProduct.mutate()} disabled={deleteProduct.isPending}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <img src={productImage(product.id, "1200/700")} alt="" className="aspect-[16/9] w-full object-cover" />
          </div>

          <section className="rounded-lg border border-border bg-card">
            <header className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Orders containing this product</h2>
              </div>
              <StatusBadge tone="neutral" withDot={false}>{formatNumber(relatedOrders.length)} orders</StatusBadge>
            </header>
            {relatedOrders.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">No orders have used this SKU yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[11px] uppercase tracking-wide">Order</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Customer</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide text-right">Qty</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide text-right">Line total</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-wide">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatedOrders.slice(0, 8).map((order) => {
                    const lines = order.items.filter((item) => item.product_id === product.id);
                    const qty = lines.reduce((sum, item) => sum + item.quantity, 0);
                    const total = lines.reduce((sum, item) => sum + toNumber(item.line_total), 0);
                    return (
                      <TableRow key={order.id} className="text-[13px]">
                        <TableCell>
                          <Link to="/orders/$id" params={{ id: String(order.id) }} className="font-mono font-medium hover:underline">
                            #SW-{String(order.id).padStart(5, "0")}
                          </Link>
                        </TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">{formatNumber(qty)}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">{formatCurrency(total)}</TableCell>
                        <TableCell><StatusBadge tone={orderTone(order.status)}>{order.status}</StatusBadge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <MetricCard label="Price" value={formatCurrency(product.price)} />
          <MetricCard label="Inventory value" value={formatCurrency(inventoryValue)} />

          <div className="rounded-lg border border-border bg-card divide-y divide-border text-[13px]">
            <Row label="SKU" value={<span className="font-mono">{product.sku}</span>} />
            <Row label="Stock" value={<span className="font-mono tabular-nums">{formatNumber(product.quantity_in_stock)}</span>} />
            <Row label="Stock status" value={<StatusBadge tone={stock.tone}>{stock.label}</StatusBadge>} />
            <Row label="Units sold" value={<span className="font-mono tabular-nums">{formatNumber(unitsSold)}</span>} />
            <Row label="Created" value={<span className="text-muted-foreground">{relativeTime(product.created_at)}</span>} />
            <Row label="Updated" value={<span className="text-muted-foreground">{relativeTime(product.updated_at)}</span>} />
          </div>

          <div className="rounded-lg border border-dashed border-border bg-card/50 p-5 text-center">
            <Box className="mx-auto h-5 w-5 text-muted-foreground" />
            <p className="mt-2 text-[12px] text-muted-foreground">Inventory changes automatically when orders are created or cancelled.</p>
          </div>
        </aside>
      </div>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle>Edit product</SheetTitle></SheetHeader>
          <div className="space-y-4 py-6">
            <Field label="Name"><Input value={form.name} onChange={(e) => setForm((cur) => ({ ...cur, name: e.target.value }))} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="SKU"><Input value={form.sku} onChange={(e) => setForm((cur) => ({ ...cur, sku: e.target.value }))} className="font-mono" /></Field>
              <Field label="Price"><Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((cur) => ({ ...cur, price: e.target.value }))} className="font-mono" /></Field>
            </div>
            <Field label="Quantity in stock"><Input type="number" min="0" value={form.quantity_in_stock} onChange={(e) => setForm((cur) => ({ ...cur, quantity_in_stock: e.target.value }))} className="font-mono" /></Field>
            <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm((cur) => ({ ...cur, description: e.target.value }))} rows={4} /></Field>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button disabled={!canUpdate || updateProduct.isPending} onClick={() => updateProduct.mutate()}>
              {updateProduct.isPending ? "Saving..." : "Save changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function productToForm(product: Product) {
  return {
    name: product.name,
    sku: product.sku,
    price: String(product.price),
    quantity_in_stock: String(product.quantity_in_stock),
    description: product.description ?? "",
  };
}

function stockStatus(quantity: number) {
  if (quantity < 5) return { tone: "danger" as const, label: "Low stock" };
  if (quantity < 20) return { tone: "warning" as const, label: "Limited" };
  return { tone: "success" as const, label: "In stock" };
}

function orderTone(status: string) {
  if (status === "fulfilled") return "success";
  if (status === "pending") return "warning";
  if (status === "cancelled") return "danger";
  return "neutral";
}

function MetricCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return <div className="flex items-center justify-between px-5 py-3"><span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{label}</span><span>{value}</span></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
