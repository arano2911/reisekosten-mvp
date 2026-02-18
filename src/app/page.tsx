"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
const STATUS_META: Record<
  string,
  { label: string; color: string }
> = {
  SUBMITTED: {
    label: "Eingereicht",
    color: "bg-gray-100 text-gray-700",
  },
  IN_REVIEW: {
    label: "In Prüfung",
    color: "bg-orange-100 text-orange-700",
  },
  APPROVED: {
    label: "Genehmigt",
    color: "bg-green-100 text-green-700",
  },
  EXPORTED: {
    label: "Exportiert",
    color: "bg-blue-100 text-blue-700",
  },
};


type StatusCounts = {
  SUBMITTED: number;
  IN_REVIEW: number;
  APPROVED: number;
  EXPORTED: number;
};

type Receipt = {
  id: string;
  type: string;
  travel_date: string;
  calculated_amount_cents: number;
  status: string;
};

export default function DashboardPage() {
  const [counts, setCounts] = useState<StatusCounts>({
    SUBMITTED: 0,
    IN_REVIEW: 0,
    APPROVED: 0,
    EXPORTED: 0,
  });

  const [recent, setRecent] = useState<Receipt[]>([]);

  const employeeId = "88077353-8452-4879-b80e-eba1d1c5bcf2";

  useEffect(() => {
    async function loadDashboard() {
      // 1️⃣ Status Counts
      const { data } = await supabase
        .from("receipts")
        .select("status")
        .eq("employee_id", employeeId);

      if (data) {
        const newCounts: StatusCounts = {
          SUBMITTED: 0,
          IN_REVIEW: 0,
          APPROVED: 0,
          EXPORTED: 0,
        };

        data.forEach((r) => {
          if (newCounts[r.status as keyof StatusCounts] !== undefined) {
            newCounts[r.status as keyof StatusCounts]++;
          }
        });

        setCounts(newCounts);
      }

      // 2️⃣ Letzte Einreichungen
      const { data: recentData } = await supabase
        .from("receipts")
        .select("id, type, travel_date, calculated_amount_cents, status")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentData) {
        setRecent(recentData);
      }
    }

    loadDashboard();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatusCard label="Eingereicht" value={counts.SUBMITTED} />
        <StatusCard label="In Prüfung" value={counts.IN_REVIEW} />
        <StatusCard label="Genehmigt" value={counts.APPROVED} />
        <StatusCard label="Exportiert" value={counts.EXPORTED} />
      </div>

      {/* Recent List */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Letzte Einreichungen
        </h2>

        {recent.map((r) => (
          <div
            key={r.id}
            className="border rounded-xl p-4 flex justify-between items-center"
          >
            <div>
              <div className="font-medium">{r.type}</div>
              <div className="text-sm text-muted-foreground">
                {r.travel_date}
              </div>
            </div>

            <div className="text-right">
              <div className="font-medium">
                {(r.calculated_amount_cents / 100).toFixed(2)} €
              </div>
              <div
  className={`text-xs px-2 py-1 rounded-full inline-block ${
    STATUS_META[r.status]?.color || "bg-gray-100 text-gray-700"
  }`}
>
  {STATUS_META[r.status]?.label || r.status}
</div>

            </div>
          </div>
        ))}

        {recent.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Noch keine Einreichungen.
          </div>
        )}
      </div>
    </div>
  );
}

function StatusCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
