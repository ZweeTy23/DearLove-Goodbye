import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Missing Supabase credentials in environment variables.");
      return NextResponse.json({ files: [] });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // List all objects in 'musica' bucket
    const { data, error } = await supabase.storage.from("musica").list("", {
      limit: 500,
      sortBy: { column: "name", order: "asc" }
    });

    if (error) {
      throw error;
    }

    // Extract filenames (filter out default empty placeholders)
    const files = data
      ? data.map((item) => item.name).filter((name) => name !== ".emptyFolderPlaceholder")
      : [];

    return NextResponse.json({ files });
  } catch (error: any) {
    console.error("Error listing music from Supabase Storage:", error);
    return NextResponse.json({ files: [], error: error.message });
  }
}
