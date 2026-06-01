import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Eye, LayoutGrid, List, MoreHorizontal, Package, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, productImage } from "@/lib/api/client";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "Products - Stockwise" },
      { name: "description", content: "Manage your product catalog, pricing, and stock." },
    ],
  }),
  component: ProductsPage,
});

type View = "table" | "grid";

function stockTone(n: number) {
  if (n < 5) return { tone: "danger" as const, label: "Low" };
  if (n < 20) return { tone: "warning" as const, label: "Limited" };
  return { tone: "success" as const, label: "In stock" };
}

function ProductsPage() {
  const [query, setQuery] = useState("");
  const [stock, setStock] = useState("all");
  const [view, setView] = useState<View>("table");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ name: "", sku: "", price: "", quantity: "", description: "" });
  const pageSize = 10;
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, error } = useQuery({ queryKey: ["products"], queryFn: api.products.list });

  const createProduct = useMutation({
    mutationFn: () => api.products.create({
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      quantity_in_stock: Number(form.quantity),
      description: form.description.trim() || null,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setForm({ name: "", sku: "", price: "", quantity: "", description: "" });
      setSheetOpen(false);
      toast.success("Product created");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteProduct = useMutation({
    mutationFn: api.products.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Product deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (query && !`${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase())) return false;
      if (stock === "low" && p.quantity_in_stock >= 5) return false;
      if (stock === "limited" && (p.quantity_in_stock < 5 || p.quantity_in_stock >= 20)) return false;
      if (stock === "ok" && p.quantity_in_stock < 20) return false;
      return true;
    });
  }, [query, products, stock]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const canCreate = form.name.trim() && form.sku.trim() && Number(form.price) >= 0 && Number(form.quantity) >= 0;

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(paged.map((p) => p.id)) : new Set());
  };

  if (isLoading) return <div className="py-12 text-sm text-muted-foreground">Loading products...</div>;
  if (error) return <div className="py-12 text-sm text-[hsl(var(--danger))]">{error.message}</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <PageHeader
        title="Products"
        description="Your full product catalog. Edit details, prices, and stock in one place."
        actions={<Button size="sm" onClick={() => setSheetOpen(true)}><Plus className="mr-1.5 h-3.5 w-3.5" /> Add product</Button>}
      />

      <div className="flex flex-wrap items-center gap-2 pb-4">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search by name or SKU..." className="h-9 pl-8" />
        </div>
        <Select value={stock} onValueChange={(v) => { setStock(v); setPage(1); }}>
          <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Stock" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any stock</SelectItem>
            <SelectItem value="ok">In stock</SelectItem>
            <SelectItem value="limited">Limited</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto inline-flex rounded-md border border-border p-0.5">
          <button onClick={() => setView("table")} className={cn("flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-foreground", view === "table" && "bg-muted text-foreground")} aria-label="Table view"><List className="h-3.5 w-3.5" /></button>
          <button onClick={() => setView("grid")} className={cn("flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-foreground", view === "grid" && "bg-muted text-foreground")} aria-label="Grid view"><LayoutGrid className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="No products match these filters" description="Try a different search term or clear filters to see everything." action={{ label: "Clear filters", onClick: () => { setQuery(""); setStock("all"); } }} />
      ) : view === "table" ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 h-10"><Checkbox checked={paged.every((p) => selected.has(p.id)) && paged.length > 0} onCheckedChange={(c) => toggleAll(!!c)} /></TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">Product</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide text-right">Price</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">Stock</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wide">Status</TableHead>
                <TableHead className="w-[88px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((p) => {
                const s = stockTone(p.quantity_in_stock);
                return (
                  <TableRow key={p.id} className="text-[13px]">
                    <TableCell><Checkbox checked={selected.has(p.id)} onCheckedChange={(c) => {
                      const next = new Set(selected);
                      if (c) next.add(p.id); else next.delete(p.id);
                      setSelected(next);
                    }} /></TableCell>
                    <TableCell>
                      <a href={`/products/${p.id}`} className="flex items-center gap-3">
                        <img src={productImage(p.id)} alt="" className="h-9 w-9 rounded-md object-cover" />
                        <div className="min-w-0">
                          <div className="truncate font-medium">{p.name}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">{p.sku}</div>
                        </div>
                      </a>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{formatCurrency(p.price)}</TableCell>
                    <TableCell><span className="inline-flex items-center gap-2 font-mono tabular-nums"><span className={cn("h-1.5 w-1.5 rounded-full", s.tone === "success" && "bg-[hsl(var(--success))]", s.tone === "warning" && "bg-[hsl(var(--warning))]", s.tone === "danger" && "bg-[hsl(var(--danger))]")} />{p.quantity_in_stock}</span></TableCell>
                    <TableCell><StatusBadge tone="success">active</StatusBadge></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={`/products/${p.id}`} aria-label={`View ${p.name}`}>
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild><a href={`/products/${p.id}`}>View details</a></DropdownMenuItem>
                            <DropdownMenuItem className="text-[hsl(var(--danger))]" onClick={() => deleteProduct.mutate(p.id)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-[12px] text-muted-foreground">
            <span>Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="tabular-nums">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paged.map((p) => (
            <a key={p.id} href={`/products/${p.id}`} className="group overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-foreground/15">
              <div className="aspect-[4/3] overflow-hidden bg-muted"><img src={productImage(p.id)} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" /></div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><div className="truncate text-[13px] font-medium">{p.name}</div><div className="font-mono text-[11px] text-muted-foreground">{p.sku}</div></div>
                  <div className="font-mono text-[13px] font-medium tabular-nums">{formatCurrency(p.price)}</div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <StatusBadge tone="neutral" withDot={false}>General</StatusBadge>
                  <StatusBadge tone={stockTone(p.quantity_in_stock).tone}>{p.quantity_in_stock} in stock</StatusBadge>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add product</SheetTitle>
            <SheetDescription>Create a new SKU. You can edit everything later.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-1.5"><Label htmlFor="name">Name</Label><Input id="name" value={form.name} onChange={(e) => setForm((cur) => ({ ...cur, name: e.target.value }))} placeholder="Merino Wool Crew" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="sku">SKU</Label><Input id="sku" value={form.sku} onChange={(e) => setForm((cur) => ({ ...cur, sku: e.target.value }))} placeholder="SW-01234" className="font-mono" /></div>
              <div className="space-y-1.5"><Label htmlFor="price">Price</Label><Input id="price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((cur) => ({ ...cur, price: e.target.value }))} placeholder="49.00" className="font-mono" /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="quantity">Quantity in stock</Label><Input id="quantity" type="number" min="0" value={form.quantity} onChange={(e) => setForm((cur) => ({ ...cur, quantity: e.target.value }))} placeholder="24" className="font-mono" /></div>
            <div className="space-y-1.5"><Label htmlFor="desc">Description</Label><Textarea id="desc" value={form.description} onChange={(e) => setForm((cur) => ({ ...cur, description: e.target.value }))} placeholder="Short product description..." rows={4} /></div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
            <Button disabled={!canCreate || createProduct.isPending} onClick={() => createProduct.mutate()}>{createProduct.isPending ? "Creating..." : "Create product"}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
