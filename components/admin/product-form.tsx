"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2, Eye, Check, Cloud, Plus, Trash2, Upload, X } from "lucide-react";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import type { Product, ProductVariant, ProductType } from "@/db/schema";
import { ImageField } from "./image-uploader";
import { TagSelector } from "./tag-selector";

interface ProductFormProps {
  product?: Product & { variants: ProductVariant[] };
  isNew?: boolean;
}

type VariantInput = {
  label: string;
  url: string;
  width?: number;
  height?: number;
  fileSize?: string;
};

type ProductInput = {
  slug: string;
  title: string;
  type: ProductType;
  description: string;
  thumbnail: string;
  price: string;
  isFree: boolean;
  isPublished: boolean;
  tags: string[];
  variants: VariantInput[];
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

async function createProduct(data: ProductInput): Promise<Product & { variants: ProductVariant[] }> {
  const res = await fetch("/api/shop/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create product");
  return res.json();
}

async function updateProduct({
  id,
  data,
}: {
  id: number;
  data: Partial<ProductInput>;
}): Promise<Product & { variants: ProductVariant[] }> {
  const res = await fetch(`/api/shop/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update product");
  return res.json();
}

const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: "wallpaper", label: "Wallpaper" },
  { value: "print", label: "Print" },
  { value: "poster", label: "Poster" },
];

export function ProductForm({ product, isNew }: ProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ProductInput>({
    slug: product?.slug ?? "",
    title: product?.title ?? "",
    type: product?.type ?? "wallpaper",
    description: product?.description ?? "",
    thumbnail: product?.thumbnail ?? "",
    price: product?.price ?? "0.00",
    isFree: product?.isFree ?? true,
    isPublished: product?.isPublished ?? false,
    tags: product?.tags ?? [],
    variants: product?.variants?.map((v) => ({
      label: v.label,
      url: v.url,
      width: v.width ?? undefined,
      height: v.height ?? undefined,
      fileSize: v.fileSize ?? undefined,
    })) ?? [],
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const lastSavedData = useRef<string>(JSON.stringify(formData));
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (product) {
      const currentData = JSON.stringify(formData);
      const originalData = JSON.stringify({
        slug: product.slug,
        title: product.title,
        type: product.type,
        description: product.description ?? "",
        thumbnail: product.thumbnail,
        price: product.price,
        isFree: product.isFree,
        isPublished: product.isPublished,
        tags: product.tags ?? [],
        variants: product.variants?.map((v) => ({
          label: v.label,
          url: v.url,
          width: v.width ?? undefined,
          height: v.height ?? undefined,
          fileSize: v.fileSize ?? undefined,
        })) ?? [],
      });
      setHasChanges(currentData !== originalData);
    } else {
      setHasChanges(formData.title.length > 0);
    }
  }, [formData, product]);

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
      router.push(`/admin/shop/${newProduct.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onMutate: async () => {
      setSaveStatus("saving");
    },
    onError: () => {
      setSaveStatus("error");
    },
    onSuccess: (_, { data }) => {
      queryClient.invalidateQueries({ queryKey: ["shop-products"] });
      lastSavedData.current = JSON.stringify({ ...formData, ...data });
      setSaveStatus("saved");
      setHasChanges(false);
    },
  });

  useEffect(() => {
    if (isNew || !product || isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const currentData = JSON.stringify(formData);
    if (currentData === lastSavedData.current) {
      return;
    }

    if (updateMutation.isPending) {
      return;
    }

    const timeout = setTimeout(() => {
      updateMutation.mutate({ id: product.id, data: formData });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [formData, isNew, product, updateMutation.isPending]);

  useEffect(() => {
    if (saveStatus === "saved") {
      const timeout = setTimeout(() => setSaveStatus("idle"), 2000);
      return () => clearTimeout(timeout);
    }
  }, [saveStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNew) {
      createMutation.mutate(formData);
    } else if (product) {
      updateMutation.mutate({ id: product.id, data: formData });
    }
  };

  const updateField = <K extends keyof ProductInput>(
    field: K,
    value: ProductInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, { label: "", url: "" }],
    }));
  };

  const removeVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const updateVariant = (index: number, field: keyof VariantInput, value: string | number | undefined) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      ),
    }));
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/shop"
            className="p-2 hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isNew ? "New Product" : "Edit Product"}
            </h1>
            {!isNew && product && (
              <p className="text-sm text-muted-foreground">/shop/{product.slug}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isNew && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {saveStatus === "saving" && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <Check className="h-3.5 w-3.5 text-green-500" />
                  <span>Saved</span>
                </>
              )}
              {saveStatus === "error" && (
                <span className="text-destructive">Save failed</span>
              )}
              {saveStatus === "idle" && hasChanges && (
                <>
                  <Cloud className="h-3.5 w-3.5" />
                  <span>Unsaved</span>
                </>
              )}
            </div>
          )}

          {!isNew && product && (
            <Link
              href={`/shop/${product.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:bg-muted transition-colors"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Link>
          )}
          <button
            type="submit"
            disabled={isPending || (!isNew && !hasChanges)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isNew ? "Create" : "Save"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4 p-6 border border-border">
            <h2 className="font-semibold">Basic Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    updateField("title", e.target.value);
                    if (isNew) {
                      updateField(
                        "slug",
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, "")
                      );
                    }
                  }}
                  placeholder="Product Title"
                  className="w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                    Slug
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-muted border border-r-0 border-border text-muted-foreground text-sm">
                      /shop/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) =>
                        updateField(
                          "slug",
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "")
                        )
                      }
                      placeholder="product-slug"
                      className="flex-1 px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => updateField("type", e.target.value as ProductType)}
                    className="w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20"
                  >
                    {PRODUCT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe this product..."
                  rows={4}
                  className="w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6 border border-border">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Download Variants</h2>
              <button
                type="button"
                onClick={addVariant}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border hover:bg-muted transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Variant
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Add different file sizes or formats for download (e.g., 4K Desktop, Mobile, Print-Ready PDF)
            </p>
            
            {formData.variants.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border">
                <p className="text-muted-foreground mb-3">No variants added yet</p>
                <button
                  type="button"
                  onClick={addVariant}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-foreground text-background hover:bg-foreground/90 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add First Variant
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.variants.map((variant, index) => (
                  <VariantEditor
                    key={index}
                    variant={variant}
                    index={index}
                    onChange={updateVariant}
                    onRemove={() => removeVariant(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4 p-6 border border-border">
            <h2 className="font-semibold">Thumbnail</h2>
            <ImageField
              value={formData.thumbnail}
              onChange={(thumbnail) => updateField("thumbnail", thumbnail)}
            />
          </div>

          <div className="space-y-4 p-6 border border-border">
            <h2 className="font-semibold">Publishing</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => updateField("isPublished", e.target.checked)}
                  className="w-4 h-4"
                />
                <div>
                  <span className="font-medium">Published</span>
                  <p className="text-xs text-muted-foreground">
                    Make this product visible in the shop
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-4 p-6 border border-border">
            <h2 className="font-semibold">Pricing</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFree}
                  onChange={(e) => {
                    updateField("isFree", e.target.checked);
                    if (e.target.checked) {
                      updateField("price", "0.00");
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="font-medium">Free Download</span>
              </label>
              {!formData.isFree && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                    Price (USD)
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-muted border border-r-0 border-border text-muted-foreground">
                      $
                    </span>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => updateField("price", e.target.value)}
                      min="0"
                      step="0.01"
                      className="flex-1 px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border border-border">
            <TagSelector
              selectedTags={formData.tags}
              onChange={(tags) => updateField("tags", tags)}
            />
          </div>
        </div>
      </div>
    </form>
  );
}

interface VariantEditorProps {
  variant: VariantInput;
  index: number;
  onChange: (index: number, field: keyof VariantInput, value: string | number | undefined) => void;
  onRemove: () => void;
}

function VariantEditor({ variant, index, onChange, onRemove }: VariantEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setProgress(0);

    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload/client",
        onUploadProgress: (e) => {
          setProgress(e.percentage);
        },
      });

      onChange(index, "url", blob.url);
      
      // Try to extract dimensions if it's an image
      if (file.type.startsWith("image/")) {
        const img = new Image();
        img.onload = () => {
          onChange(index, "width", img.width);
          onChange(index, "height", img.height);
        };
        img.src = URL.createObjectURL(file);
      }

      // Set file size
      const sizeInMB = file.size / (1024 * 1024);
      onChange(index, "fileSize", sizeInMB >= 1 ? `${sizeInMB.toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`);

    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="p-4 border border-border space-y-4">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Variant {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            Label
          </label>
          <input
            type="text"
            value={variant.label}
            onChange={(e) => onChange(index, "label", e.target.value)}
            placeholder="e.g., 4K Desktop, Mobile, Print-Ready"
            className="w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20"
            required
          />
        </div>
        
        <div className="col-span-2">
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
          />
          {variant.url ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-muted border border-border text-sm truncate">
                {variant.url.split("/").pop()}
                {variant.fileSize && (
                  <span className="text-muted-foreground">({variant.fileSize})</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onChange(index, "url", "")}
                className="p-2 hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : isUploading ? (
            <div className="flex items-center gap-2 px-3 py-2 border border-border">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Uploading... {progress}%</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-border hover:border-foreground/50 transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span className="text-sm">Upload file</span>
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            Width (px)
          </label>
          <input
            type="number"
            value={variant.width ?? ""}
            onChange={(e) => onChange(index, "width", e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="3840"
            className="w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            Height (px)
          </label>
          <input
            type="number"
            value={variant.height ?? ""}
            onChange={(e) => onChange(index, "height", e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="2160"
            className="w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20"
          />
        </div>
      </div>
    </div>
  );
}
