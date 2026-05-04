"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type CarWashStatus = Database["public"]["Tables"]["car_washes"]["Update"]["status"];

interface Props {
  carWashId: string;
  currentStatus: string;
}

export function AdminActions({ carWashId, currentStatus }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<string | null>(null);

  async function updateStatus(status: CarWashStatus) {
    setLoading(status ?? null);
    const { error } = await supabase
      .from("car_washes")
      .update({ status })
      .eq("id", carWashId);
    setLoading(null);
    if (error) {
      toast.error("Update failed.");
    } else {
      toast.success(`Car wash ${status}.`);
      router.refresh();
    }
  }

  return (
    <div className="flex gap-2 shrink-0">
      {currentStatus !== "approved" && (
        <Button
          size="sm"
          variant="outline"
          className="text-green-700 border-green-300 hover:bg-green-50"
          onClick={() => updateStatus("approved")}
          disabled={!!loading}
        >
          {loading === "approved" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
          <span className="ml-1.5">Approve</span>
        </Button>
      )}
      {currentStatus !== "suspended" && (
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => updateStatus("suspended")}
          disabled={!!loading}
        >
          {loading === "suspended" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
          <span className="ml-1.5">Suspend</span>
        </Button>
      )}
    </div>
  );
}
