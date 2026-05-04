import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock, Phone } from "lucide-react";
import Link from "next/link";

export default async function CarWashesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  const { data: carWashes } = await supabase
    .from("car_washes")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar profile={profile} />

      <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Find a car wash</h1>
          <p className="text-slate-500">Browse available car washes and book your slot online.</p>
        </div>

        {!carWashes || carWashes.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-lg">No car washes listed yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {carWashes.map((cw) => (
              <Card key={cw.id} className="overflow-hidden hover:shadow-lg transition-shadow group flex flex-col">
                <div className="aspect-video overflow-hidden bg-slate-200">
                  {cw.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cw.image_url}
                      alt={cw.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-5xl">🚗</div>
                  )}
                </div>
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="font-semibold text-slate-900 text-lg leading-tight">{cw.name}</h2>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium text-slate-700">4.8</span>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    <p className="text-sm text-slate-500 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {cw.address}, {cw.city}
                    </p>
                    {cw.phone && (
                      <p className="text-sm text-slate-500 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        {cw.phone}
                      </p>
                    )}
                  </div>

                  {cw.description && (
                    <p className="text-sm text-slate-600 line-clamp-2 mb-3 flex-1">{cw.description}</p>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Open today
                    </Badge>
                    <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50">
                      Slots available
                    </Badge>
                  </div>

                  <Button className="w-full mt-auto" render={<Link href={`/car-washes/${cw.id}`} />}>
                    View &amp; Book
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
