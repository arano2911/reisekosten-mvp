import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function POST(req: Request) {
  try {
    const { month, type } = await req.json();

    if (!month) {
      return NextResponse.json(
        { error: "Month missing" },
        { status: 400 }
      );
    }

    // Monat als Date (1. des Monats)
    const monthStart = new Date(`${month}-01`);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    let query = supabase
      .from("receipts")
      .select("*")
      .eq("status", "APPROVED")
      .gte("travel_date", monthStart.toISOString())
      .lt("travel_date", monthEnd.toISOString());

    if (type && type !== "ALL") {
      query = query.eq("type", type);
    }

    const { data: receipts, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to load receipts" },
        { status: 500 }
      );
    }

    if (!receipts || receipts.length === 0) {
      return NextResponse.json(
        { error: "No receipts to export" },
        { status: 400 }
      );
    }

    // 1️⃣ Batch anlegen
    const { data: batch, error: batchError } = await supabase
      .from("export_batches")
      .insert({
        batch_month: monthStart.toISOString().split("T")[0], // YYYY-MM-DD
        created_by: "admin",
        type: type || "ALL",
      })
      .select()
      .single();

    if (batchError || !batch) {
      return NextResponse.json(
        { error: "Failed to create batch" },
        { status: 500 }
      );
    }

    const batchId = batch.id;

    // 2️⃣ Receipts updaten
    const receiptIds = receipts.map((r) => r.id);

    await supabase
      .from("receipts")
      .update({
        status: "EXPORTED",
        export_batch_id: batchId,
        exported_at: new Date().toISOString(),
      })
      .in("id", receiptIds);

    // 3️⃣ CSV generieren
    const header =
      "personnel_no,travel_date,type,amount_eur,assignment_id,receipt_id\n";

    const rows = receipts
      .map((r) => {
        const amount =
          (r.calculated_amount_cents / 100).toFixed(2);

        return [
          "PERSONAL_NO", // später aus employees joinen
          r.travel_date,
          r.type,
          amount,
          r.assignment_id,
          r.id,
        ].join(",");
      })
      .join("\n");

    const csv = header + rows;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=export_${month}.csv`,
      },
    });

  } catch {
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
