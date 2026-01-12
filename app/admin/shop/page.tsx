import Link from "next/link";
import { Plus, ShoppingBag } from "lucide-react";
import { ProductsList } from "@/components/admin/products-list";

export default function ShopAdminPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shop Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage wallpapers, prints and digital products
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/shop"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:bg-muted transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            View Shop
          </Link>
          <Link
            href="/admin/shop/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Product
          </Link>
        </div>
      </div>
      <ProductsList />
    </div>
  );
}
