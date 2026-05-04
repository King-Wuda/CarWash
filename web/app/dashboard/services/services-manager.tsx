"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Clock } from "lucide-react";
import type { Service } from "@/lib/supabase/types";

interface Props {
  carWashId: string;
  initialServices: Service[];
}

export function ServicesManager({ carWashId, initialServices }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [services, setServices] = useState(initialServices);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const p = parseFloat(price);
    if (isNaN(p) || p <= 0) { toast.error("Enter a valid price."); return; }

    setSaving(true);
    const { data, error } = await supabase
      .from("services")
      .insert({ car_wash_id: carWashId, name, description: description || null, price: p, duration_minutes: parseInt(duration) })
      .select()
      .single();
    setSaving(false);

    if (error) {
      toast.error("Failed to add service.");
    } else {
      setServices((prev) => [...prev, data]);
      setName(""); setDescription(""); setPrice(""); setDuration("30");
      setShowForm(false);
      toast.success("Service added.");
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const { error } = await supabase.from("services").delete().eq("id", id);
    setDeletingId(null);
    if (error) {
      toast.error("Failed to delete.");
    } else {
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast.success("Service removed.");
    }
  }

  return (
    <div className="space-y-4">
      {services.length === 0 && !showForm && (
        <p className="text-slate-400 text-sm text-center py-8">No services yet. Add your first one.</p>
      )}

      {services.map((svc) => (
        <Card key={svc.id}>
          <CardContent className="p-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-semibold text-slate-900">{svc.name}</p>
              {svc.description && <p className="text-sm text-slate-500 mt-0.5">{svc.description}</p>}
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1.5">
                <Clock className="h-3 w-3" /> ~{svc.duration_minutes} min
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-lg text-slate-900">R{svc.price.toFixed(0)}</p>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-1 h-7 px-2"
                onClick={() => handleDelete(svc.id)}
                disabled={deletingId === svc.id}
              >
                {deletingId === svc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {showForm ? (
        <Card>
          <CardContent className="p-5">
            <form onSubmit={handleAdd} className="space-y-4">
              <h3 className="font-semibold text-slate-900">New service</h3>
              <div className="space-y-1.5">
                <Label className="text-sm">Service name</Label>
                <Input placeholder="e.g. Full Valet" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Description (optional)</Label>
                <Textarea placeholder="What's included..." rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Price (R)</Label>
                  <Input type="number" placeholder="150" min={0} step={0.01} value={price} onChange={(e) => setPrice(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Duration (mins)</Label>
                  <Input type="number" placeholder="30" min={5} step={5} value={duration} onChange={(e) => setDuration(e.target.value)} required />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save service
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add service
        </Button>
      )}
    </div>
  );
}
