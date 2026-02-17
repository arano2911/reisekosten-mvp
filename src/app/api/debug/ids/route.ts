import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET() {
  const { data: employees } = await supabase
    .from("employees")
    .select("id, personnel_no, full_name");

  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, employee_id, distance_km, assignment_type");

  return NextResponse.json({
    employees,
    assignments
  });
}
