"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { format, addDays, parseISO } from "date-fns";

interface Props {
  carWashId: string;
}

export function AddSlotsForm({ carWashId }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const today = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("17:00");
  const [intervalMins, setIntervalMins] = useState("30");
  const [capacity, setCapacity] = useState("1");
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    const interval = parseInt(intervalMins);
    const cap = parseInt(capacity);
    if (isNaN(interval) || interval < 15 || isNaN(cap) || cap < 1) {
      toast.error("Invalid interval or capacity.");
      return;
    }

    const slots = [];
    let current = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);

    while (current < end) {
      const next = new Date(current.getTime() + interval * 60 * 1000);
      if (next > end) break;
      slots.push({
        car_wash_id: carWashId,
        slot_date: date,
        start_time: format(current, "HH:mm:ss"),
        end_time: format(next, "HH:mm:ss"),
        capacity: cap,
      });
      current = next;
    }

    if (slots.length === 0) {
      toast.error("No slots generated. Check your times.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("slots").upsert(slots, {
      onConflict: "car_wash_id,slot_date,start_time",
      ignoreDuplicates: true,
    });
    setLoading(false);

    if (error) {
      toast.error("Failed to add slots: " + error.message);
    } else {
      toast.success(`${slots.length} slots added for ${format(parseISO(date), "d MMM")}`);
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add slots for a day</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm">Date</Label>
          <Input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Opens at</Label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Closes at</Label>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Slot interval (mins)</Label>
            <Input
              type="number"
              value={intervalMins}
              min={15}
              step={15}
              onChange={(e) => setIntervalMins(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Capacity per slot</Label>
            <Input
              type="number"
              value={capacity}
              min={1}
              max={20}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-slate-500">
          This will generate slots every {intervalMins} minutes from {startTime} to {endTime}.
        </p>
        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Generate slots
        </Button>
      </CardContent>
    </Card>
  );
}
