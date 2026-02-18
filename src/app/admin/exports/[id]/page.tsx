"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Receipt = {
  id: string;
  type: string;
  travel_date: string;
  calculated_amount_cents: number;
  status: string;
};

export default function ExportDetailPage() {
  const params = useParams();
  const batchId = params?.id as string;

  const [receipts, setReceipts] = useState<Receipt[]>([]);

  useEffect(() => {
    async function loadDetails() {
      const res = await fetch("/api/admin/exports/detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId }),
      });

      if (!res.ok) return;

      const data = await res.json();
      setReceipts(data);
    }

    if (batchId) {
      loadDetails();
    }
  }, [batchId]);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">
        Export-Detail
      </h1>

      <div className="text-sm text-muted-foreground">
        Batch-ID: {batchId}
      </div>

      <div className="space-y-3">
        {receipts.map((r) => (
          <div
            key={r.id}
            className="border rounded-xl p-4 flex justify-between"
          >
            <div>
              <div className="font-medium">
                {r.type}
              </div>
              <div className="text-sm text-muted-foreground">
                {r.travel_date}
              </div>
            </div>

            <div className="text-right">
              <div className="font-medium">
                {(r.calculated_amount_cents / 100).toFixed(2)} €
              </div>
              <div className="text-xs text-muted-foreground">
                {r.status}
              </div>
            </div>
          </div>
        ))}

        {receipts.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Keine Einträge gefunden.
          </div>
        )}
      </div>
    </div>
  );
}
