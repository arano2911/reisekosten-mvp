"use client";

import { useEffect, useState } from "react";
import { Assignment } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function FkePage() {
  const [step, setStep] = useState(1);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>("");
  const [travelDate, setTravelDate] = useState<string>("");
  const [direction, setDirection] = useState<"OUTBOUND" | "RETURN" | "">("");
  const [preview, setPreview] = useState<{
    distance_snapshot_km: number;
    rate: number;
    amount_eur: number;
  } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Load assignments
  useEffect(() => {
    async function loadAssignments() {
      const { data, error } = await supabase
        .from("assignments")
        .select(`
          id,
          distance_km,
          assignment_type,
          customers ( name )
        `)
        .order("start_date", { ascending: true });

      if (error) {
        console.error("loadAssignments error:", error.message);
        return;
      }

      setAssignments(data ?? []);
    }

    loadAssignments();
  }, []);

  // Preview calculation
  async function loadPreview() {
    if (!selectedAssignmentId) return;

    setLoadingPreview(true);

    const res = await fetch("/api/fke/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignmentId: selectedAssignmentId,
      }),
    });

    if (!res.ok) {
      setLoadingPreview(false);
      return;
    }

    const data = await res.json();
    setPreview(data);
    setLoadingPreview(false);
  }

  // Submit FKE
  async function handleSubmit() {
    if (!selectedAssignmentId || !travelDate || !direction) return;

    const res = await fetch("/api/fke/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignmentId: selectedAssignmentId,
        travelDate,
        travelDirection: direction,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Fehler beim Einreichen");
      return;
    }

    alert("FKE erfolgreich eingereicht");

    // Reset wizard
    setStep(1);
    setSelectedAssignmentId("");
    setTravelDate("");
    setDirection("");
    setPreview(null);
  }

  // Trigger preview when entering step 3
  useEffect(() => {
    if (step === 3) {
      loadPreview();
    }
  }, [step]);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">FKE einreichen</h1>

      <div className="text-sm text-muted-foreground">
        Schritt {step} von 3
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Einsatz</label>

            <select
              className="w-full border rounded-md p-2 bg-background"
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
            >
              <option value="">Bitte wählen</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.customers?.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={() => setStep(2)}
            disabled={!selectedAssignmentId}
            className="w-full"
          >
            Weiter
          </Button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Datum</label>
            <input
              type="date"
              className="w-full border rounded-md p-2 bg-background"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Richtung</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDirection("OUTBOUND")}
                className={`flex-1 border rounded-md p-2 ${
                  direction === "OUTBOUND"
                    ? "border-black font-medium"
                    : "border-muted"
                }`}
              >
                Hin
              </button>

              <button
                type="button"
                onClick={() => setDirection("RETURN")}
                className={`flex-1 border rounded-md p-2 ${
                  direction === "RETURN"
                    ? "border-black font-medium"
                    : "border-muted"
                }`}
              >
                Rück
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              Zurück
            </Button>

            <Button
              onClick={() => setStep(3)}
              disabled={!travelDate || !direction}
              className="flex-1"
            >
              Weiter
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="border rounded-xl p-4 space-y-2">
            <div className="font-medium">Berechnung</div>

            {loadingPreview && (
              <div className="text-sm text-muted-foreground">
                Berechne...
              </div>
            )}

            {preview && (
              <>
                <div className="text-sm">
                  Distanz: {preview.distance_snapshot_km} km
                </div>
                <div className="text-sm">
                  Satz: {preview.rate} €
                </div>
                <div className="text-lg font-semibold">
                  Betrag: {preview.amount_eur.toFixed(2)} €
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              className="flex-1"
            >
              Zurück
            </Button>

            <Button
              onClick={handleSubmit}
              className="flex-1"
            >
              Einreichen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
