import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { assignmentId } = body;

    if (!assignmentId) {
      return NextResponse.json(
        { error: "assignmentId missing" },
        { status: 400 }
      );
    }

    const { data: assignment, error } = await supabase
      .from("assignments")
      .select("distance_km, assignment_type")
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
        { error: "FKE only allowed for UEBERREGIONAL" },
        { status: 400 }
      );
    }

    const amount = assignment.distance_km * 0.3;

    return NextResponse.json({
      distance_snapshot_km: assignment.distance_km,
      rate: 0.3,
      amount_eur: amount,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
