import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddSlotsForm } from "./add-slots-form";
import { format, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";

export default async function SlotsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "owner" && profile?.role !== "admin") redirect("/");

  const { data: carWash } = await supabase
    .from("car_washes")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

  if (!carWash) redirect("/dashboard");

  const today = new Date().toISOString().split("T")[0];
  const { data: slots } = await supabase
    .from("slots")
    .select("*")
    .eq("car_wash_id", carWash.id)
    .gte("slot_date", today)
    .order("slot_date")
    .order("start_time");

  const slotsByDate = (slots ?? []).reduce<Record<string, typeof slots>>((acc, slot) => {
    if (!acc[slot!.slot_date]) acc[slot!.slot_date] = [];
    acc[slot!.slot_date]!.push(slot);
    return acc;
  }, {});

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar profile={profile} />
      <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
            <ArrowLeft className="h-4 w-4 mr-1" />Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Manage slots</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AddSlotsForm carWashId={carWash.id} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming slots ({slots?.length ?? 0})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
              {Object.keys(slotsByDate).length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">No slots added yet.</p>
              ) : (
                Object.entries(slotsByDate).map(([date, dateSlots]) => (
                  <div key={date}>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      {format(parseISO(date), "EEEE, d MMMM")}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {dateSlots?.map((slot) => (
                        <div
                          key={slot!.id}
                          className={`p-2 rounded-lg border text-center text-xs ${
                            slot!.bookings_count >= slot!.capacity
                              ? "bg-red-50 border-red-200 text-red-700"
                              : "bg-green-50 border-green-200 text-green-700"
                          }`}
                        >
                          <p className="font-semibold">{slot!.start_time.slice(0, 5)}</p>
                          <Badge variant="outline" className="mt-1 text-[10px] px-1 py-0 border-0 bg-transparent">
                            {slot!.bookings_count}/{slot!.capacity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
