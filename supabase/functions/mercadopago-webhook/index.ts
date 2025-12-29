import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Plan duration mapping
const PLAN_DURATIONS: Record<string, number> = {
  globo: 1,
  volea: 3,
  bandeja: 6,
  smash: 12,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured');
    }

    const body = await req.json();
    console.log('Mercado Pago webhook received:', JSON.stringify(body, null, 2));

    const { type, data } = body;

    // Handle subscription_preapproval events
    if (type === 'subscription_preapproval') {
      const preapprovalId = data.id;
      
      // Fetch full preapproval details
      const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      
      const preapproval = await response.json();
      console.log('Preapproval details:', JSON.stringify(preapproval, null, 2));

      // Parse external_reference: "user_id|plan"
      const externalRef = preapproval.external_reference || '';
      const [userId, planFromRef] = externalRef.split('|');
      const status = preapproval.status;
      
      if (!userId) {
        console.error('No user_id (external_reference) in preapproval');
        return new Response(JSON.stringify({ received: true }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // Map Mercado Pago status to our status
      let dbStatus: 'activa' | 'cancelada' | 'vencida' | 'pago_fallido';
      switch (status) {
        case 'authorized':
        case 'active':
          dbStatus = 'activa';
          break;
        case 'paused':
        case 'cancelled':
          dbStatus = 'cancelada';
          break;
        case 'pending':
          // Still pending payment, don't update yet
          console.log('Subscription pending, waiting for payment');
          return new Response(JSON.stringify({ received: true }), { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        default:
          dbStatus = 'vencida';
      }

      // Fetch existing subscription to get plan info
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Use plan from external_reference, fallback to existing or default
      const plan = planFromRef || existingSub?.plan || 'globo';
      const duration = PLAN_DURATIONS[plan] || 1;

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + duration);

      if (existingSub) {
        // Update existing subscription
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: dbStatus,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            auto_renew: status !== 'cancelled' && status !== 'paused',
            provider: 'mercado_pago',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) {
          console.error('Error updating subscription:', error);
          throw error;
        }
        console.log(`Updated subscription for user ${userId} to status ${dbStatus}`);
      } else {
        // Create new subscription
        const { error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            plan,
            status: dbStatus,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            auto_renew: true,
            provider: 'mercado_pago',
          });

        if (error) {
          console.error('Error creating subscription:', error);
          throw error;
        }
        console.log(`Created subscription for user ${userId}`);
      }
    }

    // Handle payment events
    if (type === 'payment') {
      const paymentId = data.id;
      
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      
      const payment = await response.json();
      console.log('Payment details:', JSON.stringify(payment, null, 2));

      // Parse external_reference: "user_id|plan"
      const externalRef = payment.external_reference || '';
      const [userId] = externalRef.split('|');
      
      if (userId && payment.status === 'rejected') {
        // Payment failed - mark subscription as past_due
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'pago_fallido',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('status', 'activa');

        if (error) {
          console.error('Error marking subscription as past_due:', error);
        } else {
          console.log(`Marked subscription as past_due for user ${userId}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
