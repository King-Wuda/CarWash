import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkCompleteButton } from "./mark-complete-button";
import { format, parseISO } from "date-fns";
import { Clock, Car, LayoutGrid, Settings } from "lucide-react";

interface BookingRow {
  id: string;
  status: string;
  services: { name: string; price: number; duration_minutes: number } | null;
  slots: { slot_date: string; start_time: string; end_time: string } | null;
  profiles: { full_name: string | null; phone: string | null } | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "owner" && profile?.role !== "admin") redirect("/");

  const { data: carWash } = await supabase
    .from("car_washes")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!carWash) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar profile={profile} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 text-center">
          <Car className="h-12 w-12 text-slate-300" />
          <h2 className="text-xl font-semibold text-slate-700">No car wash listed yet</h2>
          <p className="text-slate-500 max-w-sm">
            You haven&apos;t applied to list your car wash. Contact us to get started.
          </p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("bookings")
    .select(`
      id, status,
      services (name, price, duration_minutes),
      slots (slot_date, start_time, end_time),
      profiles (full_name, phone)
    `)
    .eq("car_wash_id", carWash.id)
    .in("status", ["confirmed", "completed"])
    .order("created_at", { ascending: false })
    .limit(50);

  const bookings = (data ?? []) as unknown as BookingRow[];

  const todayBookings = bookings.filter(
    (b) => b.slots && b.slots.slot_date === today && b.status === "confirmed"
  );
  const upcomingBookings = bookings.filter(
    (b) => b.slots && b.slots.slot_date > today && b.status === "confirmed"
  );

  const { data: slots } = await supabase
    .from("slots")
    .select("*")
    .eq("car_wash_id", carWash.id)
    .gte("slot_date", today)
    .order("slot_date")
    .order("start_time");

  const totalSlots = slots?.length ?? 0;
  const bookedSlots = slots?.reduce((n, s) => n + s.bookings_count, 0) ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar profile={profile} />
      <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-10">

        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{carWash.name}</h1>
            <p className="text-slate-500 text-sm mt-1">
              {carWash.status === "approved" ? (
                <span className="text-green-600 font-medium">● Live on WashSlot</span>
              ) : (
                <span className="text-amber-600 font-medium">● Pending approval</span>
              )}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" render={<Link href="/dashboard/slots" />}>
              <LayoutGrid className="h-4 w-4 mr-1.5" />Manage slots
            </Button>
            <Button variant="outline" size="sm" render={<Link href="/dashboard/services" />}>
              <Settings className="h-4 w-4 mr-1.5" />Services &amp; pricing
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Today's bookings", value: todayBookings.length },
            { label: "Upcoming", value: upcomingBookings.length },
            { label: "Slots this week", value: totalSlots },
            { label: "Slots filled", value: `${bookedSlots}/${totalSlots}` },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Today&apos;s bookings</CardTitle>
              <Badge variant="secondary">{todayBookings.length} confirmed</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayBookings.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No bookings today.</p>
              ) : (
                [...todayBookings]
                  .sort((a, b) => (a.slots?.start_time ?? "").localeCompare(b.slots?.start_time ?? ""))
                  .map((b) => <BookingRowCard key={b.id} booking={b} showDate={false} />)
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Upcoming bookings</CardTitle>
              <Badge variant="secondary">{upcomingBookings.length} total</Badge>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {upcomingBookings.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">No upcoming bookings.</p>
              ) : (
                [...upcomingBookings]
                  .sort((a, b) => {
                    const da = `${a.slots?.slot_date}${a.slots?.start_time}`;
                    const db = `${b.slots?.slot_date}${b.slots?.start_time}`;
                    return da.localeCompare(db);
                  })
                  .map((b) => <BookingRowCard key={b.id} booking={b} showDate />)
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BookingRowCard({ booking, showDate }: { booking: BookingRow; showDate: boolean }) {
  const slot = booking.slots;
  const svc = booking.services;
  const customer = booking.profiles;

  return (
    <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-50 border">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 text-sm truncate">{customer?.full_name ?? "Customer"}</p>
        <p className="text-xs text-slate-500">{svc?.name}</p>
        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
          <Clock className="h-3 w-3" />
          {showDate && slot ? `${format(parseISO(slot.slot_date), "EEE d MMM")} · ` : ""}
          {slot?.start_time.slice(0, 5)}
          {svc && <span className="ml-2 font-medium text-slate-600">R{svc.price.toFixed(0)}</span>}
        </p>
      </div>
      {booking.status === "confirmed" && <MarkCompleteButton bookingId={booking.id} />}
      {booking.status === "completed" && (
        <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50 shrink-0">Done</Badge>
      )}
    </div>
  );
}
