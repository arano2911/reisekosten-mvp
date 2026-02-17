import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

function euroToCents(eur: number) {
  return Math.round(eur * 100);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employee_id, assignment_id, travel_date, travel_direction } = body;

    if (!employee_id || !assignment_id || !travel_date || !travel_direction) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: assignment, error: aErr } = await supabase
      .from("assignments")
      .select("start_date, end_date, distance_km, assignment_type")
      .eq("id", assignment_id)
      .single();

    if (aErr || !assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 400 }
      );
    }

    if (assignment.assignment_type !== "UEBERREGIONAL") {
      return NextResponse.json(
        { error: "FKE only allowed for UEBERREGIONAL assignments" },
        { status: 400 }
      );
    }

    if (!assignment.distance_km) {
      return NextResponse.json(
        { error: "Distance not calculated" },
        { status: 400 }
      );
    }

    // Monatslimit prüfen (max 4)
    const monthPrefix = travel_date.slice(0, 7); // YYYY-MM
    const monthStart = `${monthPrefix}-01`;
    const monthEnd = `${monthPrefix}-31`;

    const { count, error: cErr } = await supabase
      .from("receipts")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", employee_id)
      .eq("type", "FKE")
      .gte("travel_date", monthStart)
      .lte("travel_date", monthEnd);

    if (cErr) {
      return NextResponse.json({ error: cErr.message }, { status: 400 });
    }

    if ((count ?? 0) >= 4) {
      return NextResponse.json(
        { error: "Monthly limit of 4 trips reached" },
        { status: 400 }
      );
    }

    const distanceKm = Number(assignment.distance_km);
    const amountCents = euroToCents(distanceKm * 0.30);

    const outsideAssignment =
      travel_date < assignment.start_date ||
      travel_date > assignment.end_date;

    const { data: created, error: rErr } = await supabase
      .from("receipts")
      .insert({
        employee_id,
        assignment_id,
        type: "FKE",
        travel_date,
        travel_direction,
        distance_snapshot_km: distanceKm,
        calculated_amount_cents: amountCents,
        status: "SUBMITTED",
      })
      .select("*")
      .single();

    if (rErr) {
      return NextResponse.json({ error: rErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      amount_eur: (amountCents / 100).toFixed(2),
      warn_outside_assignment: outsideAssignment,
      monthly_count_after_insert: (count ?? 0) + 1
    });

  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 400 }
    );
  }
}
