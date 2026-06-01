const API_BASE_URL = import.meta.env.SSR
  ? (process.env.API_INTERNAL_BASE_URL ?? process.env.VITE_API_BASE_URL ?? "http://backend:8000")
  : (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000");

type RequestOptions = RequestInit & { body?: BodyInit | null };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    const detail = typeof error?.detail === "string" ? error.detail : "Request failed";
    throw new Error(detail);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity_in_stock: number;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  status: "active" | "inactive" | "churned" | "lead";
  created_at: string;
  total_orders: number;
  lifetime_value: number;
}

export interface OrderItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  line_total: number;
  product_name: string;
  product_sku: string;
}

export interface Order {
  id: number;
  customer_id: number;
  customer_name: string;
  total_amount: number;
  status: "pending" | "fulfilled" | "cancelled";
  created_at: string;
  items: OrderItem[];
}

export interface DashboardSummary {
  total_products: number;
  total_customers: number;
  total_orders: number;
  low_stock_products: number;
  low_stock: Product[];
  customer_status_counts: Record<string, number>;
  order_status_counts: Record<string, number>;
  trends: {
    products: TrendPoint[];
    orders: TrendPoint[];
    low_stock: TrendPoint[];
    customers: TrendPoint[];
  };
}

export interface TrendPoint {
  label: string;
  value: number;
}

const PRODUCT_IMAGES: Record<number, string> = {
  1: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
  2: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62",
  3: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
  4: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c",
  5: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
  6: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
  7: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd",
  8: "https://images.unsplash.com/photo-1602143407151-7111542de6e8",
  9: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f",
  10: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea",
  11: "https://images.unsplash.com/photo-1556911220-bff31c812dba",
  12: "https://images.unsplash.com/photo-1501139083538-0139583c060f",
  13: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853",
  14: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
  15: "https://images.unsplash.com/photo-1531346680769-a1d79b57de5c",
  16: "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
  17: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1",
  18: "https://images.unsplash.com/photo-1556821840-3a63f95609a7",
  19: "https://images.unsplash.com/photo-1488646953014-85cb44e25828",
  20: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46",
  21: "https://images.unsplash.com/photo-1603199506016-b9a594b593c0",
  22: "https://images.unsplash.com/photo-1591561954557-26941169b49e",
  23: "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
  24: "https://images.unsplash.com/photo-1544787219-7f47ccb76574",
};

export const productImage = (id: number, size = "120/120") => {
  const [width = "120", height = width] = size.split("/");
  const image = PRODUCT_IMAGES[id] ?? "https://images.unsplash.com/photo-1542838132-92c53300491e";
  return `${image}?auto=format&fit=crop&crop=center&w=${width}&h=${height}&q=80`;
};

export const api = {
  products: {
    list: () => request<Product[]>("/products"),
    get: (id: string | number) => request<Product>(`/products/${id}`),
    create: (payload: Pick<Product, "name" | "sku" | "price" | "quantity_in_stock" | "description">) =>
      request<Product>("/products", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: string | number, payload: Partial<Pick<Product, "name" | "sku" | "price" | "quantity_in_stock" | "description">>) =>
      request<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    delete: (id: string | number) => request<void>(`/products/${id}`, { method: "DELETE" }),
  },
  customers: {
    list: () => request<Customer[]>("/customers"),
    get: (id: string | number) => request<Customer>(`/customers/${id}`),
    create: (payload: Pick<Customer, "full_name" | "email" | "phone_number"> & Partial<Pick<Customer, "status">>) =>
      request<Customer>("/customers", { method: "POST", body: JSON.stringify(payload) }),
    delete: (id: string | number) => request<void>(`/customers/${id}`, { method: "DELETE" }),
  },
  orders: {
    list: () => request<Order[]>("/orders"),
    get: (id: string | number) => request<Order>(`/orders/${id}`),
    create: (payload: { customer_id: number; items: { product_id: number; quantity: number }[] }) =>
      request<Order>("/orders", { method: "POST", body: JSON.stringify(payload) }),
    delete: (id: string | number) => request<void>(`/orders/${id}`, { method: "DELETE" }),
  },
  dashboard: {
    summary: () => request<DashboardSummary>("/dashboard/summary"),
  },
};
