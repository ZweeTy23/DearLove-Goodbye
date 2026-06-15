import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import GalleryClient from "@/components/GalleryClient";

export const revalidate = 0; // Disable caching to always show freshly uploaded media

export default async function Page() {
  let media = [];
  let errorMsg = null;

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("media")
      .select("*")
      .order("captured_at", { ascending: false });

    if (error) {
      console.error("Supabase query error:", error.message);
      errorMsg = error.message;
    } else {
      media = data || [];
    }
  } catch (e: any) {
    console.error("Failed to connect to Supabase database:", e);
    errorMsg = e.message;
  }

  // If there's an error connecting (e.g. table doesn't exist yet)
  if (errorMsg) {
    return (
      <div className="container" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="glass" style={{ padding: "40px", maxWidth: "600px", textAlign: "center" }}>
          <h2 style={{ color: "var(--danger)", marginBottom: "16px" }}>Error de Conexión</h2>
          <p style={{ marginBottom: "24px" }}>
            No se pudo conectar con la base de datos de Supabase. Esto suele pasar porque la tabla <code>media</code> aún no ha sido creada o porque las variables de entorno son incorrectas.
          </p>
          <div style={{ textAlign: "left", background: "rgba(0,0,0,0.3)", padding: "16px", borderRadius: "10px", fontFamily: "var(--font-mono)", fontSize: "0.85rem", marginBottom: "24px" }}>
            Detalle del error:<br />
            <span style={{ color: "var(--text-secondary)" }}>{errorMsg}</span>
          </div>
          <h4 style={{ marginBottom: "12px" }}>Pasos para solucionar:</h4>
          <ol style={{ textAlign: "left", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.95rem" }}>
            <li>Asegúrate de haber copiado y ejecutado las consultas del archivo <code>supabase_schema.sql</code> en el SQL Editor de tu Dashboard de Supabase.</li>
            <li>Verifica que tu archivo <code>.env.local</code> tiene la URL y la llave pública correctas.</li>
            <li>Ejecuta el script de subida <code>node scripts/upload.js</code> para poblar la base de datos con tus fotos.</li>
          </ol>
        </div>
      </div>
    );
  }

  return <GalleryClient initialMedia={media} />;
}
