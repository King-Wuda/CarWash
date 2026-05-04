"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, Loader2 } from "lucide-react";

export function MarkCompleteButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    setLoading(true);
    const { error } = await supabase
      .from("bookings")
      .update({ status: "completed" })
      .eq("id", bookingId);
    setLoading(false);
    if (error) {
      toast.error("Failed to mark complete.");
    } else {
      toast.success("Booking marked as complete.");
      router.refresh();
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleComplete}
      disabled={loading}
      className="text-green-700 border-green-300 hover:bg-green-50 shrink-0"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
    </Button>
  );
}
