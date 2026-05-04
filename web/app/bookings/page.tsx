import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/shared/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CancelBookingButton } from "./cancel-button";
import { format, parseISO, isFuture } from "date-fns";
import { CalendarCheck, MapPin, Clock, Car } from "lucide-react";

const statusConfig = {
  confirmed: { label: "Confirmed", className: "bg-green-100 text-green-800 border-green-200" },
  completed: { label: "Completed", className: "bg-slate-100 text-slate-700 border-slate-200" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700 border-red-200" },
};

interface BookingWithRelations {
  id: string;
  status: string;
  total_price: number;
  car_washes: { id: string; name: string; address: string; city: string; image_url: string | null } | null;
  services: { name: string; duration_minutes: number } | null;
  slots: { slot_date: string; start_time: string; end_time: string } | null;
}

export default async function BookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/bookings");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const { data } = await supabase
    .from("bookings")
    .select(`
      id, status, total_price,
      car_washes (id, name, address, city, image_url),
      services (name, duration_minutes),
      slots (slot_date, start_time, end_time)
    `)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const bookings = (data ?? []) as unknown as BookingWithRelations[];

  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && b.slots && isFuture(parseISO(`${b.slots.slot_date}T${b.slots.start_time}`))
  );
  const past = bookings.filter(
    (b) => b.status !== "confirmed" || (b.slots && !isFuture(parseISO(`${b.slots.slot_date}T${b.slots.start_time}`)))
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar profile={profile} />
      <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">My bookings</h1>

        {bookings.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <CalendarCheck className="h-12 w-12 text-slate-300 mx-auto" />
            <p className="text-slate-500">You have no bookings yet.</p>
            <Button render={<Link href="/car-washes" />}>Find a car wash</Button>
          </div>
        )}

        {upcoming.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Upcoming</h2>
            <div className="space-y-4">
              {upcoming.map((booking) => (
                <BookingCard key={booking.id} booking={booking} showCancel />
              ))}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Past &amp; cancelled</h2>
            <div className="space-y-4">
              {past.map((booking) => (
                <BookingCard key={booking.id} booking={booking} showCancel={false} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function BookingCard({ booking, showCancel }: { booking: BookingWithRelations; showCancel: boolean }) {
  const cw = booking.car_washes;
  const svc = booking.services;
  const slot = booking.slots;
  const config = statusConfig[booking.status as keyof typeof statusConfig] ?? statusConfig.confirmed;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-28 bg-slate-100 flex items-center justify-center p-4 shrink-0">
            {cw?.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cw.image_url} alt={cw.name} className="w-20 h-16 object-cover rounded" />
            ) : (
              <Car className="h-8 w-8 text-slate-300" />
            )}
          </div>
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-slate-900">{cw?.name}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />{cw?.address}, {cw?.city}
                </p>
              </div>
              <Badge className={`text-xs shrink-0 border ${config.className}`} variant="outline">
                {config.label}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600 mb-3">
              <p className="flex items-center gap-1.5">
                <CalendarCheck className="h-3.5 w-3.5 text-slate-400" />
                {slot && format(parseISO(slot.slot_date), "EEE d MMM yyyy")}
              </p>
              <p className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {slot?.start_time.slice(0, 5)}
              </p>
              <p className="col-span-2 font-medium">
                {svc?.name} — <span className="text-blue-700 font-bold">R{booking.total_price.toFixed(0)}</span>
              </p>
            </div>
            {showCancel && booking.status === "confirmed" && (
              <CancelBookingButton bookingId={booking.id} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
