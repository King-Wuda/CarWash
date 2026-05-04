"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { CalendarCheck, Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import type { CarWash, Service, Slot } from "@/lib/supabase/types";
import type { User } from "@supabase/supabase-js";

interface Props {
  carWash: CarWash;
  services: Service[];
  slots: Slot[];
  user: User | null;
}

export function BookingPanel({ carWash, services, slots, user }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<"service" | "slot" | "details" | "done">("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleColour, setVehicleColour] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const slotsByDate = slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    if (!acc[slot.slot_date]) acc[slot.slot_date] = [];
    acc[slot.slot_date].push(slot);
    return acc;
  }, {});

  const availableDates = Object.keys(slotsByDate).sort();

  async function handleBook() {
    if (!user || !selectedService || !selectedSlot) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("bookings")
      .insert({
        customer_id: user.id,
        car_wash_id: carWash.id,
        service_id: selectedService.id,
        slot_id: selectedSlot.id,
        total_price: selectedService.price,
        vehicle_make: vehicleMake || null,
        vehicle_model: vehicleModel || null,
        vehicle_colour: vehicleColour || null,
        vehicle_plate: vehiclePlate || null,
        notes: notes || null,
      });

    setSubmitting(false);

    if (error) {
      toast.error("Booking failed. Please try again.");
      return;
    }

    setStep("done");
    toast.success("Booking confirmed!");
  }

  if (!user) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Book a slot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-slate-500 text-sm">Sign in to book your car wash slot.</p>
          <Button className="w-full gap-2" render={<Link href={`/login?next=/car-washes/${carWash.id}`} />}>
            <LogIn className="h-4 w-4" /> Sign in to book
          </Button>
          <p className="text-xs text-muted-foreground">
            No account?{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">Sign up free</Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  if (step === "done") {
    return (
      <Card className="shadow-md border-green-200 bg-green-50">
        <CardContent className="p-6 text-center space-y-4">
          <CalendarCheck className="h-12 w-12 text-green-600 mx-auto" />
          <div>
            <h3 className="font-bold text-green-800 text-lg">Booking confirmed!</h3>
            <p className="text-green-700 text-sm mt-1">
              Arrive at your slot time and drive straight in — no queue.
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 text-left space-y-2 text-sm border border-green-200">
            <p><span className="text-slate-500">Service:</span> <strong>{selectedService?.name}</strong></p>
            <p><span className="text-slate-500">Date:</span> <strong>{selectedSlot && format(parseISO(selectedSlot.slot_date), "EEEE d MMMM")}</strong></p>
            <p><span className="text-slate-500">Time:</span> <strong>{selectedSlot?.start_time.slice(0, 5)}</strong></p>
            <p><span className="text-slate-500">Total:</span> <strong>R{selectedService?.price.toFixed(0)} (pay at car wash)</strong></p>
          </div>
          <Button className="w-full" variant="outline" onClick={() => router.push("/bookings")}>
            View my bookings
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">Book a slot</CardTitle>
        <div className="flex gap-1 mt-1">
          {["service", "slot", "details"].map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${
                ["service", "slot", "details"].indexOf(step) >= i ? "bg-blue-600" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Step 1: Service */}
        {step === "service" && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">1. Choose a service</p>
            {services.length === 0 ? (
              <p className="text-slate-500 text-sm">No services available.</p>
            ) : (
              services.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => { setSelectedService(svc); setStep("slot"); }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedService?.id === svc.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300 bg-white"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{svc.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">~{svc.duration_minutes} min</p>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">R{svc.price.toFixed(0)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Step 2: Slot */}
        {step === "slot" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">2. Pick a time slot</p>
              <button onClick={() => setStep("service")} className="text-xs text-blue-600 hover:underline">
                Change service
              </button>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-sm border">
              <span className="text-slate-500">Service: </span>
              <strong>{selectedService?.name}</strong>
              <span className="text-slate-500 ml-2">R{selectedService?.price.toFixed(0)}</span>
            </div>

            {availableDates.length === 0 ? (
              <p className="text-slate-500 text-sm py-2">No slots available in the next 7 days.</p>
            ) : (
              availableDates.map((date) => {
                const daySlots = slotsByDate[date].filter((s) => s.bookings_count < s.capacity);
                if (daySlots.length === 0) return null;
                return (
                  <div key={date}>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      {format(parseISO(date), "EEEE, d MMM")}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {daySlots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => { setSelectedSlot(slot); setStep("details"); }}
                          className={`p-2 text-sm rounded-lg border text-center transition-colors ${
                            selectedSlot?.id === slot.id
                              ? "border-blue-500 bg-blue-50 font-semibold text-blue-700"
                              : "border-slate-200 hover:border-blue-300 bg-white"
                          }`}
                        >
                          {slot.start_time.slice(0, 5)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Step 3: Details */}
        {step === "details" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">3. Your vehicle details</p>
              <button onClick={() => setStep("slot")} className="text-xs text-blue-600 hover:underline">
                Change slot
              </button>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-sm border space-y-1">
              <p><span className="text-slate-500">Service: </span><strong>{selectedService?.name}</strong></p>
              <p>
                <span className="text-slate-500">When: </span>
                <strong>
                  {selectedSlot && format(parseISO(selectedSlot.slot_date), "EEE d MMM")} at {selectedSlot?.start_time.slice(0, 5)}
                </strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Make</Label>
                <Input placeholder="Toyota" value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Model</Label>
                <Input placeholder="Corolla" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Colour</Label>
                <Input placeholder="White" value={vehicleColour} onChange={(e) => setVehicleColour(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Number plate</Label>
                <Input placeholder="CA 123-456" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea
                placeholder="Any special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-sm resize-none"
              />
            </div>

            <div className="border-t pt-3 space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span>Total (pay at car wash)</span>
                <span className="text-lg font-bold">R{selectedService?.price.toFixed(0)}</span>
              </div>
              <Badge variant="outline" className="text-xs w-full justify-center text-slate-500">
                No payment required now — pay when you arrive
              </Badge>
              <Button className="w-full" onClick={handleBook} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm booking
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
