import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      assignmentId,
      travelDate,
      travelDirection,
    } = body;
    
    const employeeId = "88077353-8452-4879-b80e-eba1d1c5bcf2";
    

    if (!assignmentId || !employeeId || !travelDate || !travelDirection) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1️⃣ Assignment laden
    const { data: assignment, error: assignmentError } = await supabase
      .from("assignments")
      .select("distance_km, assignment_type")
      .eq("id", assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    if (assignment.assignment_type !== "UEBERREGIONAL") {
      return NextResponse.json(
        { error: "FKE only allowed for UEBERREGIONAL" },
        { status: 400 }
      );
    }

    // 2️⃣ Monatslimit prüfen (max 4 FKE pro Monat)
    const monthStart = new Date(travelDate);
    monthStart.setDate(1);

    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const { count, error: countError } = await supabase
      .from("receipts")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", employeeId)
      .eq("type", "FKE")
      .gte("travel_date", monthStart.toISOString())
      .lt("travel_date", monthEnd.toISOString());

    if (countError) {
      return NextResponse.json(
        { error: "Failed to check monthly limit" },
        { status: 500 }
      );
    }

    if ((count ?? 0) >= 4) {
      return NextResponse.json(
        { error: "Monthly FKE limit reached (max 4)" },
        { status: 400 }
      );
    }

    // 3️⃣ Betrag berechnen
    const distance = Number(assignment.distance_km);
    const rate = 0.3;
    const amountCents = Math.round(distance * rate * 100);

    // 4️⃣ Snapshot erstellen
    const calculationSnapshot = {
      distance_km: distance,
      rate_eur: rate,
      amount_cents: amountCents,
      assignment_type: assignment.assignment_type,
      calculated_at: new Date().toISOString(),
      rule_version: "FKE_v1",
    };

    // 5️⃣ Insert in receipts
    const { error: insertError } = await supabase
      .from("receipts")
      .insert({
        employee_id: employeeId,
        assignment_id: assignmentId,
        type: "FKE",
        travel_date: travelDate,
        travel_direction: travelDirection,
        distance_snapshot_km: distance,
        calculated_amount_cents: amountCents,
        status: "SUBMITTED",
        calculation_snapshot: calculationSnapshot,
      });

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to insert receipt" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (e) {
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
