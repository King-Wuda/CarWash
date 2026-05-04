import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/shared/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminActions } from "./admin-actions";
import { format, parseISO } from "date-fns";
import { MapPin, Phone } from "lucide-react";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  const { data: carWashes } = await supabase
    .from("car_washes")
    .select("*")
    .order("created_at", { ascending: false });

  const pending = carWashes?.filter((c) => c.status === "pending") ?? [];
  const approved = carWashes?.filter((c) => c.status === "approved") ?? [];
  const suspended = carWashes?.filter((c) => c.status === "suspended") ?? [];

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, status, total_price, created_at");

  const totalRevenue = bookings?.filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + b.total_price * 0.1, 0) ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar profile={profile} />
      <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Admin panel</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Pending approval", value: pending.length, color: "text-amber-600" },
            { label: "Approved car washes", value: approved.length, color: "text-green-600" },
            { label: "Total bookings", value: bookings?.length ?? 0, color: "text-blue-600" },
            { label: "Est. commission", value: `R${totalRevenue.toFixed(0)}`, color: "text-slate-900" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending */}
        {pending.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Pending approval <Badge className="ml-2 bg-amber-100 text-amber-800">{pending.length}</Badge>
            </h2>
            <div className="space-y-4">
              {pending.map((cw) => (
                <CarWashRow key={cw.id} carWash={cw} />
              ))}
            </div>
          </section>
        )}

        {/* Approved */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Approved <Badge className="ml-2 bg-green-100 text-green-800">{approved.length}</Badge>
          </h2>
          {approved.length === 0 ? (
            <p className="text-slate-400 text-sm">None yet.</p>
          ) : (
            <div className="space-y-4">
              {approved.map((cw) => (
                <CarWashRow key={cw.id} carWash={cw} />
              ))}
            </div>
          )}
        </section>

        {/* Suspended */}
        {suspended.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Suspended <Badge variant="destructive">{suspended.length}</Badge>
            </h2>
            <div className="space-y-4">
              {suspended.map((cw) => (
                <CarWashRow key={cw.id} carWash={cw} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CarWashRow({ carWash }: { carWash: any }) {
  const statusColors = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    suspended: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <Card>
      <CardContent className="p-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900">{carWash.name}</h3>
            <Badge variant="outline" className={`text-xs border ${statusColors[carWash.status as keyof typeof statusColors]}`}>
              {carWash.status}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {carWash.address}, {carWash.city}
          </p>
          {carWash.phone && (
            <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
              <Phone className="h-3.5 w-3.5" /> {carWash.phone}
            </p>
          )}
          <p className="text-xs text-slate-400 mt-1">
            Applied {format(parseISO(carWash.created_at), "d MMM yyyy")}
          </p>
        </div>
        <AdminActions carWashId={carWash.id} currentStatus={carWash.status} />
      </CardContent>
    </Card>
  );
}
