import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Missing Supabase credentials in environment variables.");
      return NextResponse.json({ files: [] });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Helper to check if string looks like hex and decode it
    const decodeHex = (name: string): string => {
      const base = name.replace(/\.[^/.]+$/, "");
      if (/^[0-9a-fA-F]+$/.test(base) && base.length % 2 === 0) {
        try {
          const decoded = Buffer.from(base, "hex").toString("utf8");
          if (!/[\x00-\x1F\x7F]/.test(decoded)) {
            return decoded.toLowerCase();
          }
        } catch {}
      }
      return name.toLowerCase();
    };

    // Deduplicate: if both hex-encoded and plain-text files exist for the same song, keep the hex-encoded one.
    const deduplicatedMap = new Map<string, string>(); // decodedName -> originalFileName
    files.forEach((file) => {
      const decoded = decodeHex(file);
      const isHex = file !== decodeHex(file);
      if (deduplicatedMap.has(decoded)) {
        const existingFile = deduplicatedMap.get(decoded)!;
        const existingIsHex = existingFile !== decodeHex(existingFile);
        if (isHex && !existingIsHex) {
          deduplicatedMap.set(decoded, file);
        }
      } else {
        deduplicatedMap.set(decoded, file);
      }
    });

    const finalFiles = Array.from(deduplicatedMap.values());

    return NextResponse.json({ files: finalFiles });
  } catch (error: any) {
    console.error("Error listing music from Supabase Storage:", error);
    return NextResponse.json({ files: [], error: error.message });
  }
}
