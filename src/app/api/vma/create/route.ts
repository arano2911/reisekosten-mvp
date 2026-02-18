import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function POST(req: Request) {
  try {
    const { assignmentId, startDate, endDate } = await req.json();

    const employeeId = "88077353-8452-4879-b80e-eba1d1c5bcf2"; // Dummy

    if (!assignmentId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    // 1️⃣ Datumsobjekte zuerst erzeugen
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return NextResponse.json(
        { error: "End date before start date" },
        { status: 400 }
      );
    }

    // 2️⃣ Assignment laden
    const { data: assignment, error } = await supabase
      .from("assignments")
      .select("assignment_type, start_date, end_date")
      .eq("id", assignmentId)
      .single();

    if (error || !assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    if (assignment.assignment_type !== "UEBERREGIONAL") {
      return NextResponse.json(
        { error: "VMA only allowed for UEBERREGIONAL" },
        { status: 400 }
      );
    }

    // 3️⃣ Zeitraum innerhalb Einsatz prüfen
    const assignmentStart = new Date(assignment.start_date);
    const assignmentEnd = new Date(assignment.end_date);

    if (start < assignmentStart || end > assignmentEnd) {
      return NextResponse.json(
        { error: "VMA Zeitraum außerhalb Einsatzzeitraum" },
        { status: 400 }
      );
    }

    // 4️⃣ Überschneidung prüfen
    const { data: existingVma } = await supabase
      .from("receipts")
      .select("calculation_snapshot")
      .eq("employee_id", employeeId)
      .eq("type", "VMA")
      .eq("assignment_id", assignmentId);

    if (existingVma && existingVma.length > 0) {
      for (const r of existingVma) {
        const snap = r.calculation_snapshot;
        if (!snap?.start_date || !snap?.end_date) continue;

        const existingStart = new Date(snap.start_date);
        const existingEnd = new Date(snap.end_date);

        const overlap =
          start <= existingEnd && end >= existingStart;

        if (overlap) {
          return NextResponse.json(
            {
              error:
                "VMA Zeitraum überschneidet sich mit bestehender Einreichung",
            },
            { status: 400 }
          );
        }
      }
    }

    // 5️⃣ Tage berechnen
    const diffTime = end.getTime() - start.getTime();
    const totalDays =
      Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // 🔧 Dummy VMA-Rate (später 2F)
    const vmaRate = 28;

    let amount = 0;

    if (vmaRate === 14) {
      amount = totalDays * 14;
    }

    if (vmaRate === 28) {
      if (totalDays === 1) {
        amount = 14;
      } else {
        amount = 14 + 14 + (totalDays - 2) * 28;
      }
    }

    const amountCents = Math.round(amount * 100);

    const calculationSnapshot = {
      start_date: startDate,
      end_date: endDate,
      total_days: totalDays,
      rate: vmaRate,
      amount_cents: amountCents,
      calculated_at: new Date().toISOString(),
      rule_version: "VMA_v1",
    };

    // 6️⃣ Insert
    const { error: insertError } = await supabase
      .from("receipts")
      .insert({
        employee_id: employeeId,
        assignment_id: assignmentId,
        type: "VMA",
        travel_date: startDate,
        calculated_amount_cents: amountCents,
        status: "SUBMITTED",
        calculation_snapshot: calculationSnapshot,
      });

    if (insertError) {
      return NextResponse.json(
        { error: "Insert failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch {
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
