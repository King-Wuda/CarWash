import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import { ServicesManager } from "./services-manager";
import { ArrowLeft } from "lucide-react";

export default async function ServicesPage() {
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

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("car_wash_id", carWash.id)
    .order("price", { ascending: true });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar profile={profile} />
      <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
            <ArrowLeft className="h-4 w-4 mr-1" />Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Services &amp; pricing</h1>
        </div>
        <ServicesManager carWashId={carWash.id} initialServices={services ?? []} />
      </div>
    </div>
  );
}
