import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple HTML response
function htmlResponse(title: string, message: string, success: boolean): Response {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
    }
    .icon.success { background: #d4edda; color: #155724; }
    .icon.error { background: #f8d7da; color: #721c24; }
    h1 { font-size: 24px; margin-bottom: 12px; color: #333; }
    p { color: #666; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon ${success ? 'success' : 'error'}">${success ? '✓' : '✕'}</div>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>
  `;
  
  return new Response(html, {
    status: success ? 200 : 400,
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return htmlResponse(
        "Enlace inválido",
        "No se encontró un token válido en el enlace. Por favor, usa el enlace completo del correo.",
        false
      );
    }

    // Decode and validate token
    let tokenData: { user_id: string; ts: number };
    try {
      tokenData = JSON.parse(atob(token));
    } catch {
      return htmlResponse(
        "Enlace inválido",
        "El token de desuscripción no es válido. Por favor, usa el enlace del correo.",
        false
      );
    }

    if (!tokenData.user_id) {
      return htmlResponse(
        "Enlace inválido",
        "El token no contiene información de usuario válida.",
        false
      );
    }

    // Check if token is too old (30 days)
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - tokenData.ts > thirtyDaysMs) {
      return htmlResponse(
        "Enlace expirado",
        "Este enlace de desuscripción ha expirado. Por favor, usa el enlace de un correo más reciente.",
        false
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing unsubscribe for user: ${tokenData.user_id}`);

    // Check if preference exists
    const { data: existing } = await supabase
      .from("user_email_preferences")
      .select("id, opt_out")
      .eq("user_id", tokenData.user_id)
      .maybeSingle();

    if (existing) {
      if (existing.opt_out) {
        return htmlResponse(
          "Ya estás desuscrito",
          "Ya no recibes correos de marketing de Just Muv.",
          true
        );
      }

      // Update existing
      const { error } = await supabase
        .from("user_email_preferences")
        .update({
          opt_out: true,
          opt_out_at: new Date().toISOString(),
        })
        .eq("user_id", tokenData.user_id);

      if (error) {
        console.error("Error updating preference:", error);
        return htmlResponse(
          "Error",
          "No pudimos procesar tu solicitud. Por favor, intenta de nuevo más tarde.",
          false
        );
      }
    } else {
      // Create new preference
      const { error } = await supabase
        .from("user_email_preferences")
        .insert({
          user_id: tokenData.user_id,
          opt_out: true,
          opt_out_at: new Date().toISOString(),
        });

      if (error) {
        console.error("Error creating preference:", error);
        return htmlResponse(
          "Error",
          "No pudimos procesar tu solicitud. Por favor, intenta de nuevo más tarde.",
          false
        );
      }
    }

    console.log(`User ${tokenData.user_id} unsubscribed successfully`);

    return htmlResponse(
      "¡Listo!",
      "Ya no recibirás correos de marketing de Just Muv. Si cambias de opinión, puedes volver a suscribirte desde tu configuración de cuenta.",
      true
    );

  } catch (error) {
    console.error("Error in email-unsubscribe:", error);
    return htmlResponse(
      "Error",
      "Ocurrió un error inesperado. Por favor, intenta de nuevo más tarde.",
      false
    );
  }
});
