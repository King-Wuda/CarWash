import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, MapPin, Clock, Star, ArrowRight, CheckCircle } from "lucide-react";

export default async function HomePage() {
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
    .limit(3);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar profile={profile} />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white py-24 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-4 bg-blue-500/30 text-white border-blue-400 hover:bg-blue-500/30">
            Skip the queue. Book in advance.
          </Badge>
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Your car wash slot,<br />booked and waiting.
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            No more sitting in queues on a Saturday morning. Browse car washes near you,
            pick a time, and drive straight in — no waiting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-blue-700 hover:bg-blue-50 font-semibold text-base px-8"
              render={<Link href="/car-washes" />}
            >
              Find a car wash <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            {!user && (
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-base px-8"
                render={<Link href="/signup" />}
              >
                Create free account
              </Button>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
          <svg viewBox="0 0 1440 60" className="w-full fill-white">
            <path d="M0,60 C480,0 960,0 1440,60 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">How it works</h2>
            <p className="text-slate-500 text-lg">Three steps and your car wash is sorted.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <MapPin className="h-8 w-8 text-blue-600" />,
                step: "1",
                title: "Find a car wash",
                desc: "Browse car washes near you. See services, prices, and available slots.",
              },
              {
                icon: <CalendarCheck className="h-8 w-8 text-blue-600" />,
                step: "2",
                title: "Book your slot",
                desc: "Pick the service you need and choose a time that works for you.",
              },
              {
                icon: <Clock className="h-8 w-8 text-blue-600" />,
                step: "3",
                title: "Arrive and drive in",
                desc: "Pull up at your booked time and go straight in — no queue, no wait.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-widest">
                  Step {item.step}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured car washes */}
      {carWashes && carWashes.length > 0 && (
        <section className="py-20 px-4 bg-slate-50">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-1">Featured car washes</h2>
                <p className="text-slate-500">Top-rated, queue-free spots near you.</p>
              </div>
              <Button
                variant="ghost"
                className="text-blue-600 hover:text-blue-700"
                render={<Link href="/car-washes" />}
              >
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {carWashes.map((cw) => (
                <Card key={cw.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="aspect-video overflow-hidden bg-slate-200">
                    {cw.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cw.image_url}
                        alt={cw.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-4xl">🚗</div>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-slate-900 text-lg leading-tight">{cw.name}</h3>
                      <div className="flex items-center gap-1 text-amber-500 shrink-0 ml-2">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium text-slate-700">4.8</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mb-3">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {cw.address}, {cw.city}
                    </p>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">{cw.description}</p>
                    <Button className="w-full" render={<Link href={`/car-washes/${cw.id}`} />}>
                      Book a slot
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Value props for owners */}
      <section className="py-20 px-4 bg-white">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Why car wash owners love WashSlot
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              "No upfront cost — we earn when you earn",
              "Manage your schedule from any phone or laptop",
              "Reduce no-shows with confirmed bookings",
              "See your full day's bookings at a glance",
              "Customers arrive on time, every time",
              "Free to list — pay only 10% per booking",
            ].map((point) => (
              <div key={point} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-slate-700">{point}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button size="lg" render={<Link href="/signup?role=owner" />}>
              List your car wash — it&apos;s free
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 px-4 mt-auto bg-slate-900 text-slate-400">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-white font-semibold">
            <span>🚗</span> WashSlot
          </div>
          <p>© {new Date().getFullYear()} WashSlot. South Africa.</p>
          <div className="flex gap-6">
            <Link href="/car-washes" className="hover:text-white transition-colors">Find car washes</Link>
            <Link href="/signup?role=owner" className="hover:text-white transition-colors">For owners</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
