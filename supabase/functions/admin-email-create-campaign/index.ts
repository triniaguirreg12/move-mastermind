import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateCampaignRequest {
  subject: string;
  preheader?: string;
  body: string;
  body_format?: "markdown" | "html";
  cta_text?: string;
  cta_url?: string;
  audience_type: "single" | "selected" | "filtered";
  filters?: {
    country?: string;
    plan?: string;
    subscription_status?: string;
  };
  selected_user_ids?: string[];
  is_test?: boolean;
  name?: string;
  scheduled_at?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to check auth
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

    // Use service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: CreateCampaignRequest = await req.json();
    console.log("Creating campaign with body:", JSON.stringify(body, null, 2));

    const {
      subject,
      preheader,
      body: emailBody,
      body_format = "markdown",
      cta_text,
      cta_url,
      audience_type,
      filters,
      selected_user_ids,
      is_test = false,
      name,
      scheduled_at,
    } = body;

    // Validate required fields
    if (!subject || !emailBody || !audience_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: subject, body, audience_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get recipients based on audience type
    let recipientQuery = supabase
      .from("profiles")
      .select("user_id, email, name, country");

    // Get opt-out users
    const { data: optOutUsers } = await supabase
      .from("user_email_preferences")
      .select("user_id")
      .eq("opt_out", true);
    
    const optOutUserIds = new Set(optOutUsers?.map(u => u.user_id) || []);

    let recipients: { user_id: string; email: string; name: string; country: string | null }[] = [];

    if (audience_type === "single" && selected_user_ids?.length === 1) {
      const { data } = await recipientQuery.eq("user_id", selected_user_ids[0]);
      recipients = data || [];
    } else if (audience_type === "selected" && selected_user_ids?.length) {
      const { data } = await recipientQuery.in("user_id", selected_user_ids);
      recipients = data || [];
    } else if (audience_type === "filtered") {
      // Apply filters
      if (filters?.country) {
        recipientQuery = recipientQuery.eq("country", filters.country);
      }
      
      // For plan/subscription filters, we need to join with subscriptions
      if (filters?.plan || filters?.subscription_status) {
        // Get user_ids with matching subscriptions
        let subQuery = supabase
          .from("subscriptions")
          .select("user_id")
          .in("status", ["activa", "cancelada"]);
        
        if (filters.plan) {
          subQuery = subQuery.eq("plan", filters.plan);
        }
        
        const { data: subUsers } = await subQuery;
        const subscribedUserIds = subUsers?.map(s => s.user_id) || [];
        
        if (filters.subscription_status === "active" && subscribedUserIds.length > 0) {
          recipientQuery = recipientQuery.in("user_id", subscribedUserIds);
        } else if (filters.subscription_status === "none") {
          // Get all profiles and filter out subscribed ones
          const { data: allProfiles } = await recipientQuery;
          recipients = (allProfiles || []).filter(p => !subscribedUserIds.includes(p.user_id));
        } else if (subscribedUserIds.length > 0) {
          recipientQuery = recipientQuery.in("user_id", subscribedUserIds);
        }
      }
      
      if (recipients.length === 0) {
        const { data } = await recipientQuery;
        recipients = data || [];
      }
    }

    // Filter out opt-out users
    recipients = recipients.filter(r => !optOutUserIds.has(r.user_id));

    console.log(`Found ${recipients.length} recipients after filtering opt-outs`);

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ error: "No recipients found after applying filters and opt-outs", total_recipients: 0 }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .insert({
        created_by_admin_id: user.id,
        name,
        subject,
        preheader,
        body: emailBody,
        body_format,
        cta_text,
        cta_url,
        audience_type,
        filters_json: filters || null,
        selected_user_ids_json: selected_user_ids || null,
        total_recipients: recipients.length,
        is_test,
        status: scheduled_at ? "queued" : "queued",
        scheduled_at: scheduled_at || null,
      })
      .select()
      .single();

    if (campaignError) {
      console.error("Error creating campaign:", campaignError);
      return new Response(
        JSON.stringify({ error: "Failed to create campaign", details: campaignError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Campaign created:", campaign.id);

    // Get subscription info for each recipient for variable replacement
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("user_id, plan")
      .in("user_id", recipients.map(r => r.user_id))
      .in("status", ["activa", "cancelada"]);

    const subByUser = new Map(subscriptions?.map(s => [s.user_id, s.plan]) || []);

    // Create email messages for each recipient
    const emailMessages = recipients.map(recipient => ({
      campaign_id: campaign.id,
      user_id: recipient.user_id,
      email_to: recipient.email,
      status: "queued" as const,
    }));

    const { error: messagesError } = await supabase
      .from("email_messages")
      .insert(emailMessages);

    if (messagesError) {
      console.error("Error creating messages:", messagesError);
      // Rollback campaign
      await supabase.from("email_campaigns").delete().eq("id", campaign.id);
      return new Response(
        JSON.stringify({ error: "Failed to create email messages", details: messagesError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Created ${emailMessages.length} email messages`);

    return new Response(
      JSON.stringify({
        success: true,
        campaign_id: campaign.id,
        total_recipients: recipients.length,
        status: campaign.status,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in admin-email-create-campaign:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
