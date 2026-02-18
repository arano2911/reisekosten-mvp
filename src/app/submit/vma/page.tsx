"use client";

import { useEffect, useState } from "react";
import { Assignment } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function VmaPage() {
  const [step, setStep] = useState(1);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [preview, setPreview] = useState<number | null>(null);

  useEffect(() => {
    async function loadAssignments() {
      const { data } = await supabase
        .from("assignments")
        .select(`
          id,
          assignment_type,
          customers ( name )
        `);

      setAssignments(data ?? []);
    }

    loadAssignments();
  }, []);

  async function loadPreview() {
    if (!selectedAssignmentId || !startDate || !endDate) return;

    const res = await fetch("/api/vma/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignmentId: selectedAssignmentId,
        startDate,
        endDate,
      }),
    });

    if (!res.ok) return;

    const data = await res.json();
    setPreview(data.amount_eur);
  }

  async function handleSubmit() {
    if (!selectedAssignmentId || !startDate || !endDate) return;

    const res = await fetch("/api/vma/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignmentId: selectedAssignmentId,
        startDate,
        endDate,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Fehler beim Einreichen");
      return;
    }

    alert("VMA erfolgreich eingereicht");

    setStep(1);
    setSelectedAssignmentId("");
    setStartDate("");
    setEndDate("");
    setPreview(null);
  }

  useEffect(() => {
    if (step === 3) {
      loadPreview();
    }
  }, [step]);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">VMA einreichen</h1>

      <div className="text-sm text-muted-foreground">
        Schritt {step} von 3
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-4">
          <label className="text-sm font-medium">Einsatz</label>

          <select
            className="w-full border rounded-md p-2"
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
          <div>
            <label className="text-sm font-medium">Von</label>
            <input
              type="date"
              className="w-full border rounded-md p-2"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Bis</label>
            <input
              type="date"
              className="w-full border rounded-md p-2"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
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
              disabled={!startDate || !endDate}
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
          <div className="border rounded-xl p-4">
            <div className="font-medium">Berechnung</div>

            {preview !== null && (
              <div className="text-lg font-semibold mt-2">
                Gesamtbetrag: {preview.toFixed(2)} €
              </div>
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
