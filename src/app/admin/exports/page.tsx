"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Batch = {
  id: string;
  batch_month: string;
  type: string;
  created_at: string;
};

export default function AdminExportsPage() {
  const [month, setMonth] = useState("");
  const [type, setType] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);

  async function loadBatches() {
    const res = await fetch("/api/admin/exports/list");
    if (!res.ok) return;
    const data = await res.json();
    setBatches(data);
  }

  useEffect(() => {
    loadBatches();
  }, []);

  async function handleExport() {
    if (!month) return;

    setLoading(true);

    const res = await fetch("/api/admin/exports/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, type }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Export fehlgeschlagen");
      setLoading(false);
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `export_${month}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setLoading(false);
    loadBatches();
  }

  return (
    <div className="p-4 space-y-8">
      <h1 className="text-xl font-semibold">
        Admin – Export
      </h1>

      {/* Export Form */}
      <div className="space-y-4 border rounded-xl p-4">
        <div>
          <label className="text-sm font-medium">
            Monat
          </label>
          <input
            type="month"
            className="w-full border rounded-md p-2"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Typ
          </label>
          <select
            className="w-full border rounded-md p-2"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="ALL">Alle</option>
            <option value="FKE">FKE</option>
            <option value="VMA">VMA</option>
          </select>
        </div>

        <Button
          onClick={handleExport}
          disabled={!month || loading}
          className="w-full"
        >
          {loading ? "Export läuft..." : "Export starten"}
        </Button>
      </div>

      {/* Export History */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          Export-Historie
        </h2>

        {batches.map((b) => (
          <a
            key={b.id}
            href={`/admin/exports/${b.id}`}
            className="block border rounded-xl p-4 hover:bg-gray-50 transition"
          >
            <div className="font-medium">
              {b.batch_month}
            </div>
            <div className="text-sm text-muted-foreground">
              Typ: {b.type}
            </div>
            <div className="text-xs text-muted-foreground">
              Erstellt: {new Date(b.created_at).toLocaleString()}
            </div>
          </a>
        ))}

        {batches.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Noch keine Exporte.
          </div>
        )}
      </div>
    </div>
  );
}
