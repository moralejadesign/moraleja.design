"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import type { BillingProfile } from "@/db/schema";
import { fetchBillingProfile } from "./charge-editor";

type ProfileInput = Pick<BillingProfile, "fullName" | "idNumber" | "city" | "paymentDetails">;

async function saveProfile(data: ProfileInput): Promise<BillingProfile> {
  const res = await fetch("/api/billing-profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save billing profile");
  return res.json();
}

const inputClass =
  "w-full px-3 py-2 bg-background border border-border focus:outline-none focus:ring-1 focus:ring-foreground/20";
const labelClass = "block text-sm font-medium text-muted-foreground mb-1.5";

export function BillingProfileForm() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({ queryKey: ["billing-profile"], queryFn: fetchBillingProfile });
  const [formData, setFormData] = useState<ProfileInput | null>(null);

  useEffect(() => {
    if (profile && !formData) {
      setFormData({
        fullName: profile.fullName,
        idNumber: profile.idNumber,
        city: profile.city,
        paymentDetails: profile.paymentDetails,
      });
    }
  }, [profile, formData]);

  const saveMutation = useMutation({
    mutationFn: saveProfile,
    onSuccess: (saved) => queryClient.setQueryData(["billing-profile"], saved),
  });

  if (isLoading || !formData) {
    return <div className="h-64 max-w-xl bg-muted/50 animate-pulse" />;
  }

  const update = <K extends keyof ProfileInput>(field: K, value: ProfileInput[K]) => {
    saveMutation.reset();
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        saveMutation.mutate(formData);
      }}
      className="max-w-xl space-y-6"
    >
      <div className="space-y-4 p-6 border border-border">
        <div>
          <label className={labelClass}>Full name</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Cédula</label>
            <input
              type="text"
              value={formData.idNumber}
              onChange={(e) => update("idNumber", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="Bogotá"
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Payment details</label>
          <textarea
            value={formData.paymentDetails}
            onChange={(e) => update("paymentDetails", e.target.value)}
            placeholder={"Bancolombia · Cuenta de ahorros\nN.º 000-000000-00"}
            rows={4}
            className={`${inputClass} resize-y`}
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Copied into each new cuenta de cobro, where you can still change it.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save
        </button>
        {saveMutation.isSuccess && (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-green-500" />
            Saved
          </span>
        )}
        {saveMutation.isError && <span className="text-sm text-destructive">Couldn&apos;t save. Try again.</span>}
      </div>
    </form>
  );
}
