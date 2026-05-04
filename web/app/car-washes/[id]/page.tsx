import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/shared/navbar";
import { BookingPanel } from "./booking-panel";
import { MapPin, Phone, Mail, Star, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CarWashDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  const { data: carWash } = await supabase
    .from("car_washes")
    .select("*")
    .eq("id", id)
    .eq("status", "approved")
    .single();

  if (!carWash) notFound();

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("car_wash_id", id)
    .eq("is_active", true)
    .order("price", { ascending: true });

  // Get slots for next 7 days
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: slots } = await supabase
    .from("slots")
    .select("*")
    .eq("car_wash_id", id)
    .gte("slot_date", today)
    .lte("slot_date", nextWeek)
    .order("slot_date", { ascending: true })
    .order("start_time", { ascending: true });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar profile={profile} />

      {/* Hero image */}
      <div className="w-full bg-slate-200 h-56 md:h-72 overflow-hidden">
        {carWash.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={carWash.image_url} alt={carWash.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-6xl">🚗</div>
        )}
      </div>

      <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: info */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-start gap-4 justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-1">{carWash.name}</h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold text-slate-700">4.8</span>
                      <span className="text-sm text-slate-400">(42 reviews)</span>
                    </div>
                    <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                      Accepting bookings
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {carWash.description && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-2">About</h2>
                <p className="text-slate-600 leading-relaxed">{carWash.description}</p>
              </div>
            )}

            <Separator />

            {/* Contact */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Location & contact</h2>
              <div className="space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  {carWash.address}, {carWash.city}, {carWash.province}
                </p>
                {carWash.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    {carWash.phone}
                  </p>
                )}
                {carWash.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                    {carWash.email}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Services list */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Services & pricing</h2>
              {!services || services.length === 0 ? (
                <p className="text-slate-500 text-sm">No services listed yet.</p>
              ) : (
                <div className="space-y-3">
                  {services.map((svc) => (
                    <div key={svc.id} className="flex items-center justify-between p-4 rounded-lg border bg-white">
                      <div>
                        <p className="font-medium text-slate-900">{svc.name}</p>
                        {svc.description && (
                          <p className="text-sm text-slate-500 mt-0.5">{svc.description}</p>
                        )}
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          ~{svc.duration_minutes} min
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="font-bold text-slate-900 text-lg">R{svc.price.toFixed(0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: booking panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <BookingPanel
                carWash={carWash}
                services={services ?? []}
                slots={slots ?? []}
                user={user}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
