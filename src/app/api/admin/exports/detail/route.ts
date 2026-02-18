import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function POST(req: Request) {
  const { batchId } = await req.json();

  if (!batchId) {
    return NextResponse.json([], { status: 400 });
  }

  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("export_batch_id", batchId)
    .order("travel_date", { ascending: true });

  if (error) {
    return NextResponse.json([], { status: 500 });
  }

  return NextResponse.json(data);
}
