import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET() {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message });
  }

  return NextResponse.json({ success: true, data });
}
