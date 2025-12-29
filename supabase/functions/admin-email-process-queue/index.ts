import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =================================================================
// EMAIL PROVIDER INTERFACE - Replace DummyProvider with real one
// =================================================================

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
  tags?: string[];
}

interface SendEmailResult {
  messageId: string;
  success: boolean;
  error?: string;
}

interface EmailProvider {
  name: string;
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
}

// Dummy provider - simulates sending without actually sending
class DummyEmailProvider implements EmailProvider {
  name = "dummy";

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    console.log(`[DummyEmailProvider] Would send email to: ${params.to}`);
    console.log(`[DummyEmailProvider] Subject: ${params.subject}`);
    console.log(`[DummyEmailProvider] Body length: ${params.html.length} chars`);
    
    // Return fake success
    return {
      messageId: `dummy-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      success: true,
    };
  }
}

// =================================================================
// To add a real provider, create a class like this:
// 
// class ResendProvider implements EmailProvider {
//   name = "resend";
//   private apiKey: string;
//   
//   constructor(apiKey: string) {
//     this.apiKey = apiKey;
//   }
//   
//   async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
//     // Implement actual Resend API call
//   }
// }
// =================================================================

// Rate limiting - basic in-memory counter
const rateLimitWindow = 60000; // 1 minute
let requestCount = 0;
let windowStart = Date.now();
const maxRequestsPerWindow = 100;

function checkRateLimit(): boolean {
  const now = Date.now();
  if (now - windowStart > rateLimitWindow) {
    windowStart = now;
    requestCount = 0;
  }
  requestCount++;
  return requestCount <= maxRequestsPerWindow;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limit check
  if (!checkRateLimit()) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { campaign_id } = await req.json();

    if (!campaign_id) {
      return new Response(
        JSON.stringify({ error: "campaign_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing queue for campaign: ${campaign_id}`);

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: "Campaign not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (campaign.status !== "queued") {
      return new Response(
        JSON.stringify({ error: `Campaign is not in queued status. Current status: ${campaign.status}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update campaign to sending
    await supabase
      .from("email_campaigns")
      .update({ status: "sending", started_at: new Date().toISOString() })
      .eq("id", campaign_id);

    // Get queued messages
    const { data: messages, error: messagesError } = await supabase
      .from("email_messages")
      .select("*, profiles:user_id(name, country)")
      .eq("campaign_id", campaign_id)
      .eq("status", "queued");

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      await supabase
        .from("email_campaigns")
        .update({ status: "failed" })
        .eq("id", campaign_id);
      
      return new Response(
        JSON.stringify({ error: "Failed to fetch messages" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${messages?.length || 0} messages to process`);

    // Initialize provider - currently using DummyProvider
    const provider: EmailProvider = new DummyEmailProvider();

    // Get subscription info for variable replacement
    const userIds = messages?.map(m => m.user_id) || [];
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("user_id, plan")
      .in("user_id", userIds)
      .in("status", ["activa", "cancelada"]);

    const subByUser = new Map(subscriptions?.map(s => [s.user_id, s.plan]) || []);

    // Plan display names
    const planNames: Record<string, string> = {
      globo: "Globo",
      volea: "Volea",
      bandeja: "Bandeja",
      smash: "Smash",
    };

    let sentCount = 0;
    let failedCount = 0;

    // Process each message
    for (const message of messages || []) {
      try {
        // Get profile info
        const profile = message.profiles as any;
        const firstName = profile?.name?.split(" ")[0] || "Usuario";
        const planKey = subByUser.get(message.user_id) || "";
        const planName = planNames[planKey] || "Gratis";
        const country = profile?.country || "";

        // Replace variables in body
        let processedBody = campaign.body
          .replace(/\{first_name\}/g, firstName)
          .replace(/\{plan_name\}/g, planName)
          .replace(/\{country\}/g, country);

        // Add CTA if present
        if (campaign.cta_text && campaign.cta_url) {
          processedBody += `\n\n<a href="${campaign.cta_url}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">${campaign.cta_text}</a>`;
        }

        // Generate unsubscribe token (simple base64 for now - in production use JWT)
        const unsubToken = btoa(JSON.stringify({ user_id: message.user_id, ts: Date.now() }));
        const unsubUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/email-unsubscribe?token=${encodeURIComponent(unsubToken)}`;
        
        // Add unsubscribe footer
        processedBody += `
          <hr style="margin-top:40px;border:none;border-top:1px solid #eee;">
          <p style="font-size:12px;color:#666;text-align:center;margin-top:20px;">
            ¿No quieres recibir más correos? <a href="${unsubUrl}" style="color:#666;">Darte de baja</a>
          </p>
        `;

        // Send via provider
        const result = await provider.sendEmail({
          to: message.email_to,
          subject: campaign.subject,
          html: processedBody,
          tags: [campaign_id, campaign.is_test ? "test" : "production"],
        });

        if (result.success) {
          await supabase
            .from("email_messages")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              provider_name: provider.name,
              provider_message_id: result.messageId,
            })
            .eq("id", message.id);
          sentCount++;
        } else {
          await supabase
            .from("email_messages")
            .update({
              status: "failed",
              error_message: result.error || "Unknown error",
              provider_name: provider.name,
            })
            .eq("id", message.id);
          failedCount++;
        }
      } catch (error: unknown) {
        console.error(`Error processing message ${message.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await supabase
          .from("email_messages")
          .update({
            status: "failed",
            error_message: errorMessage,
          })
          .eq("id", message.id);
        failedCount++;
      }
    }

    // Update campaign status
    const finalStatus = failedCount === messages?.length ? "failed" : "sent";
    await supabase
      .from("email_campaigns")
      .update({
        status: finalStatus,
        finished_at: new Date().toISOString(),
      })
      .eq("id", campaign_id);

    console.log(`Campaign ${campaign_id} processed. Sent: ${sentCount}, Failed: ${failedCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        campaign_id,
        sent_count: sentCount,
        failed_count: failedCount,
        status: finalStatus,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in admin-email-process-queue:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
