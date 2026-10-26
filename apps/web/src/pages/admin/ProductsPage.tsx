import { useCallback, useEffect, useMemo, useState} from "react";
import { 
  Plus,
  Search,
  Pencil,
  Trash2,
  Power,
  Package,
  CheckCircle2,
  PauseCircle,
  Tag,
  Banknote,
  Layers,
  type LucideIcon,
}
 from "lucide-react";
 import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
 } from "recharts";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Badge } from "@/components/ui/badge";
 import { Label } from "@/components/ui/label";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { productManagementService, type ProductRow, type ProductsOverview, type ProductInput } from "@/services/ProductManagement.service";
 import { AppShell } from "@/components/layout/AppShell";
 import { PageContainer } from "@/components/layout/PageContainer";
 import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
 import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";


 const COLORS = ["#0f6b4f", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6", "#ec4899", "#64748b"];
 const num = (v: number) => Math.round(v).toLocaleString("en-KE");
 const kes = (v: number) => `KES ${num(v)}`;
 const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
 const ALL = "all";

 function Insight({ title, children } : { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-md bg-muted/50 p-3 text-sm">
      <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      <p className="leading-relaxed">{children}</p>
    </div>
  );
 }
 const Empty = ({ text }: { text: string }) => <p className="flex h-full items-center justify-center text-sm text-muted-foreground">{text}</p>;

 export function ProductsPage() {
  const [data, setData] = useState<ProductsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState(ALL);
  const [brand, setBrand] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [editing, setEditing] = useState<ProductRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<ProductRow | null>(null);

  const load = useCallback(async () => {
    try {
      setData(
        await productManagementService.getOverview()
      );
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load products");
    }
  }, []);

  useEffect (() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.products ?? []).filter((p) =>
      (cat === ALL || p.category === cat) && (brand === ALL || p.brand === brand) &&
      (status === ALL || (status === "active") === p.isActive) &&
      (!q || [p.name, p.sku, p.brand].some((v) => v?.toLowerCase().includes(q))));
  }, [data, search, cat, brand, status]);

  const toggle = async (p: ProductRow) => {
    try {
      await productManagementService.setStatus(p.id, !p.isActive);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update product");
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await productManagementService.remove(deleting.id);
      setDeleting(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete product");
      setDeleting(null);
    }
  };

  const s = data?.stats;
  const kpis: { label: string; value: string; Icon: LucideIcon; tone: string }[] = s ? [
    { label: "Total Products", value: num(s.total), Icon: Package, tone: "bg-primary/10 text-primary" },
    { label: "Active SKUs", value: num(s.active), Icon: CheckCircle2, tone: "bg-emerald-500/10 text-emerald-600" },
    { label: "Inactive SKUs", value: num(s.inactive), Icon: PauseCircle, tone: "bg-muted text-muted-foreground" },
    { label: "Brands", value: num(s.brands), Icon: Tag, tone: "bg-violet-500/10 text-violet-600" },
    { label: "Avg Unit Price", value: kes(s.avgPrice), Icon: Banknote, tone: "bg-amber-500/10 text-amber-600" },
    { label: "Categories", value: num(s.categories), Icon: Layers, tone: "bg-sky-500/10 text-sky-600" },
  ] : [];

  // Insights, computed from the data
  const topCat = data?.byCategory[0], lowCat = data?.byCategory[data.byCategory.length - 1];
  const topBrand = data?.byBrand[0];
  const unbranded = data?.byBrand.find((b) => b.name === "Unbranded")?.count ?? 0;
  const topBucket = data ? [...data.priceBuckets].sort((a, b) => b.count - a.count)[0] : undefined;
  const prices = data?.products.map((p) => p.price) ?? [];
  const top1 = data?.topSelling[0];
  const top3 = data ? data.topSelling.slice(0, 3).reduce((a, b) => a + b.revenue, 0) : 0;
  const topRev = data?.revenueByCategory[0];

  return (
    <AppShell>
      <PageContainer>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
              <DashboardHeader title="Products" description="Manage the product catalogue and see how it sells" />
              {s && <Badge variant="secondary" className="mt-1">{num(s.total)} products</Badge>}
            </div>
            <Button onClick={() => setEditing("new")} className="sm:mt-1"><Plus className="mr-2 h-4 w-4" />Add Product</Button>
          </div>

          {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {s ? kpis.map(({ label, value, Icon, tone }) => (
              <Card key={label}><CardContent className="flex items-center gap-3 p-4">
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", tone)}><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <div className="min-w-0"><div className="truncate text-xl font-semibold leading-tight" title={value}>{value}</div><div className="truncate text-xs text-muted-foreground">{label}</div></div>
              </CardContent></Card>
            )) : Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><div className="h-6 w-14 animate-pulse rounded bg-muted" /><div className="mt-2 h-3 w-20 animate-pulse rounded bg-muted" /></CardContent></Card>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Products by Category</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  {data && data.byCategory.length ? (
                    <ResponsiveContainer width="100%" height="100%"><PieChart>
                      <Pie data={data.byCategory} dataKey="count" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                        {data.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [v, "Products"]} /><Legend />
                    </PieChart></ResponsiveContainer>
                  ) : <Empty text="No products yet." />}
                </div>
                <Insight title="Category insight">
                  {topCat && lowCat ? `${topCat.name} is the largest category with ${topCat.count} products (${pct(topCat.count, s!.total)}% of the catalogue). ${data!.byCategory.length > 1 ? `${lowCat.name} is the smallest with ${lowCat.count}.` : ""}` : "Add products to see category insights."}
                </Insight>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Products by Brand</CardTitle><CardDescription>Top 10 brands</CardDescription></CardHeader>
              <CardContent>
                <div className="h-64">
                  {data && data.byBrand.length ? (
                    <ResponsiveContainer width="100%" height="100%"><BarChart data={data.byBrand} layout="vertical" margin={{ left: 8 }}>
                      <XAxis type="number" allowDecimals={false} hide /><YAxis type="category" dataKey="name" width={90} tickLine={false} axisLine={false} fontSize={11} />
                      <Tooltip formatter={(v) => [v, "Products"]} /><Bar dataKey="count" fill="#0f6b4f" radius={[0, 4, 4, 0]} />
                    </BarChart></ResponsiveContainer>
                  ) : <Empty text="No products yet." />}
                </div>
                <Insight title="Brand insight">
                  {topBrand ? `${topBrand.name} has the most products (${topBrand.count}, ${pct(topBrand.count, s!.total)}% of the catalogue).${unbranded && topBrand.name !== "Unbranded" ? ` ${unbranded} products have no brand set.` : ""}` : "Add products to see brand insights."}
                </Insight>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Price Distribution</CardTitle><CardDescription>Distributor price in KES</CardDescription></CardHeader>
              <CardContent>
                <div className="h-64">
                  {data && prices.length ? (
                    <ResponsiveContainer width="100%" height="100%"><BarChart data={data.priceBuckets}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tickLine={false} fontSize={11} />
                      <YAxis allowDecimals={false} width={28} tickLine={false} axisLine={false} fontSize={11} />
                      <Tooltip formatter={(v) => [v, "Products"]} /><Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart></ResponsiveContainer>
                  ) : <Empty text="No products yet." />}
                </div>
                <Insight title="Price insight">
                  {topBucket && prices.length ? `Most products (${topBucket.count}) are priced KES ${topBucket.label}. Prices range from ${kes(Math.min(...prices))} to ${kes(Math.max(...prices))}, averaging ${kes(s!.avgPrice)}.` : "Add products to see price insights."}
                </Insight>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2"><CardTitle className="text-base">Top Selling Products (by Revenue)</CardTitle><span className="shrink-0 text-xs text-muted-foreground">Last 30 days</span></div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {data && data.topSelling.length ? (
                    <ResponsiveContainer width="100%" height="100%"><BarChart data={data.topSelling} layout="vertical" margin={{ left: 8 }}>
                      <XAxis type="number" hide /><YAxis type="category" dataKey="name" width={110} tickLine={false} axisLine={false} fontSize={11} />
                      <Tooltip formatter={(v) => [kes(Number(v)), "Revenue"]} /><Bar dataKey="revenue" fill="#0f6b4f" radius={[0, 4, 4, 0]} />
                    </BarChart></ResponsiveContainer>
                  ) : <Empty text="No sales in the last 30 days." />}
                </div>
                <Insight title="Sales performance insight">
                  {top1 && data!.revenue30d ? `${top1.name} leads with ${kes(top1.revenue)} (${pct(top1.revenue, data!.revenue30d)}% of 30-day revenue). The top 3 products bring in ${pct(top3, data!.revenue30d)}% of revenue.` : "Sales insights appear once orders come in."}
                </Insight>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2"><CardTitle className="text-base">Revenue by Category</CardTitle><span className="shrink-0 text-xs text-muted-foreground">Last 30 days</span></div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {data && data.revenueByCategory.length ? (
                    <ResponsiveContainer width="100%" height="100%"><PieChart>
                      <Pie data={data.revenueByCategory} dataKey="revenue" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                        {data.revenueByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [kes(Number(v)), "Revenue"]} /><Legend />
                    </PieChart></ResponsiveContainer>
                  ) : <Empty text="No sales in the last 30 days." />}
                </div>
                <Insight title="Category revenue insight">
                  {topRev && data!.revenue30d ? `${topRev.name} earns the most revenue: ${kes(topRev.revenue)}, ${pct(topRev.revenue, data!.revenue30d)}% of the ${kes(data!.revenue30d)} total.` : "Revenue insights appear once orders come in."}
                </Insight>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-2 lg:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, SKU, or brand" aria-label="Search products" className="pl-9" />
              </div>
              <Select value={cat} onValueChange={(v) => setCat(v ?? ALL)}>
                <SelectTrigger className="lg:w-44" aria-label="Category"><SelectValue>{cat === ALL ? "All Categories" : cat}</SelectValue></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>All Categories</SelectItem>{data?.categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={brand} onValueChange={(v) => setBrand(v ?? ALL)}>
                <SelectTrigger className="lg:w-40" aria-label="Brand"><SelectValue>{brand === ALL ? "All Brands" : brand}</SelectValue></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>All Brands</SelectItem>{data?.brandList.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={status} onValueChange={(v) => setStatus(v ?? ALL)}>
                <SelectTrigger className="lg:w-36" aria-label="Status"><SelectValue>{status === ALL ? "All Status" : status === "active" ? "Active" : "Inactive"}</SelectValue></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
              </Select>
            </div>

            <Card className="overflow-hidden"><div className="overflow-x-auto"><Table>
              <TableHeader><TableRow>
                {["Product Name", "SKU Code", "Brand", "Category", "Pack Size", "Distributor Price (KES)", "Status", "Actions"].map((h) => <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>)}
              </TableRow></TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                    <TableCell>{p.brand ?? "—"}</TableCell>
                    <TableCell>{p.category ?? "—"}</TableCell>
                    <TableCell>{p.packSize ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">{num(p.price)}</TableCell>
                    <TableCell><Badge variant={p.isActive ? "default" : "secondary"}>{p.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => setEditing(p)}><Pencil className="mr-1 h-3.5 w-3.5" />Edit</Button>
                        <Button size="sm" variant="outline" onClick={() => toggle(p)}><Power className="mr-1 h-3.5 w-3.5" />{p.isActive ? "Deactivate" : "Activate"}</Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleting(p)}><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {data && rows.length === 0 && <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">{data.products.length === 0 ? "No products yet. Add the first one." : "No products match your filters."}</TableCell></TableRow>}
                {!data && <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Loading…</TableCell></TableRow>}
              </TableBody>
            </Table></div></Card>
          </div>
        </div>

        <ProductDialog target={editing} data={data} onClose={() => setEditing(null)} onSaved={load} />

        <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Delete product?</DialogTitle><DialogDescription>{deleting?.name} will be removed permanently. Products with order history can't be deleted, so deactivate those instead.</DialogDescription></DialogHeader>
            <DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button><Button variant="destructive" onClick={confirmDelete}>Delete</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </AppShell>
  );
 }

function ProductDialog({ target, data, onClose, onSaved }: { target: ProductRow | "new" | null; data: ProductsOverview | null; onClose: () => void; onSaved: () => void }) {
  const blank = { name: "", sku: "", brand: "", category: "", packSize: "", unitPrice: "", isActive: true };
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (target === "new") setF(blank);
    else if (target) setF({ name: target.name, sku: target.sku, brand: target.brand ?? "", category: target.category ?? "", packSize: target.packSize ?? "", unitPrice: String(target.price), isActive: target.isActive });
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    const price = Number(f.unitPrice);
    if (f.name.trim().length < 2 || !f.sku.trim()) return;
    if (f.unitPrice === "" || Number.isNaN(price) || price < 0) return
    const body: ProductInput = { ...f, unitPrice: price };
    setBusy(true);
    try {
      if (target === "new") await productManagementService.create(body);
      else if (target) await productManagementService.update(target.id, body);
      onClose(); onSaved();
    } catch (e) { (e instanceof Error ? e.message : "Could not save product"); }
    finally { setBusy(false); }
  };
  const field = (k: "name" | "sku" | "brand" | "category" | "packSize", label: string, list?: string) => (
    <div className="space-y-1"><Label>{label}</Label><Input list={list} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
  );

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{target === "new" ? "Add Product" : "Edit Product"}</DialogTitle><DialogDescription>Pick an existing brand or category, or type a new one.</DialogDescription></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">{field("name", "Product name *")}</div>
          {field("sku", "SKU code *")}
          <div className="space-y-1"><Label>Distributor price (KES) *</Label><Input type="number" min="0" step="0.01" value={f.unitPrice} onChange={(e) => setF({ ...f, unitPrice: e.target.value })} /></div>
          {field("brand", "Brand", "brand-list")}
          {field("category", "Category", "category-list")}
          {field("packSize", "Pack size (e.g. 500ml x 24)")}
          <label className="flex items-center gap-2 pt-6 text-sm"><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} />Active</label>
        </div>
        <datalist id="brand-list">{data?.brandList.map((b) => <option key={b} value={b} />)}</datalist>
        <datalist id="category-list">{data?.categories.map((c) => <option key={c} value={c} />)}</datalist>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={busy}>{target === "new" ? "Add product" : "Save changes"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}