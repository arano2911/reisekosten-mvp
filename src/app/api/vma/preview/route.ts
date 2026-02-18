import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function POST(req: Request) {
  try {
    const { assignmentId, startDate, endDate } = await req.json();

    if (!assignmentId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    // Assignment prüfen
    const { data: assignment, error } = await supabase
      .from("assignments")
      .select("assignment_type")
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

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return NextResponse.json(
        { error: "End date before start date" },
        { status: 400 }
      );
    }

    const diffTime = end.getTime() - start.getTime();
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // 🔧 Dummy VMA-Rate (später 2F)
    const vmaRate = 28; // oder 14

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

    return NextResponse.json({
      total_days: totalDays,
      rate: vmaRate,
      amount_eur: amount,
    });

  } catch {
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
