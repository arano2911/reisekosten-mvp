import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { calculateDistance } from "@/lib/distance";

export async function GET() {
  const { data: assignments, error } = await supabase
    .from("assignments")
    .select(`
      id,
      employees(street, zip, city),
      customers(street, zip, city)
    `)
    .is("distance_km", null);

  if (error) {
    return NextResponse.json({ error: error.message });
  }

  for (const a of assignments || []) {
    const employeeAddress = `${a.employees.street}, ${a.employees.zip} ${a.employees.city}`;
    const customerAddress = `${a.customers.street}, ${a.customers.zip} ${a.customers.city}`;

    const km = await calculateDistance(employeeAddress, customerAddress);

    const assignmentType = km > 80 ? "UEBERREGIONAL" : "REGIONAL";

    await supabase
      .from("assignments")
      .update({
        distance_km: km,
        assignment_type: assignmentType
      })
      .eq("id", a.id);
  }

  return NextResponse.json({ updated: assignments?.length || 0 });
}
