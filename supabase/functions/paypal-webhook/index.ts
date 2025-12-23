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

async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log('PayPal webhook received:', JSON.stringify(body, null, 2));

    const eventType = body.event_type;
    const resource = body.resource;

    // Get user_id from custom_id
    const userId = resource?.custom_id;

    if (!userId) {
      console.log('No user_id (custom_id) in webhook payload');
      return new Response(JSON.stringify({ received: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Fetch existing subscription to get plan info
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const plan = existingSub?.plan || 'globo';
    const duration = PLAN_DURATIONS[plan] || 1;

    switch (eventType) {
      // Subscription activated (first payment successful)
      case 'BILLING.SUBSCRIPTION.ACTIVATED': {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + duration);

        if (existingSub) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'activa',
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
              auto_renew: true,
              provider: 'paypal',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);
        } else {
          await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              plan,
              status: 'activa',
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
              auto_renew: true,
              provider: 'paypal',
            });
        }
        console.log(`Subscription activated for user ${userId}`);
        break;
      }

      // Subscription renewed (recurring payment successful)
      case 'PAYMENT.SALE.COMPLETED': {
        if (existingSub) {
          const newEndDate = new Date(existingSub.end_date);
          newEndDate.setMonth(newEndDate.getMonth() + duration);

          await supabase
            .from('subscriptions')
            .update({
              status: 'activa',
              end_date: newEndDate.toISOString(),
              auto_renew: true,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);
          console.log(`Subscription renewed for user ${userId}, new end_date: ${newEndDate.toISOString()}`);
        }
        break;
      }

      // Subscription cancelled by user
      case 'BILLING.SUBSCRIPTION.CANCELLED': {
        await supabase
          .from('subscriptions')
          .update({
            auto_renew: false,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
        console.log(`Subscription cancelled for user ${userId}`);
        break;
      }

      // Subscription suspended (payment issues)
      case 'BILLING.SUBSCRIPTION.SUSPENDED': {
        await supabase
          .from('subscriptions')
          .update({
            status: 'pago_fallido',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
        console.log(`Subscription suspended for user ${userId}`);
        break;
      }

      // Payment failed
      case 'PAYMENT.SALE.DENIED':
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED': {
        await supabase
          .from('subscriptions')
          .update({
            status: 'pago_fallido',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('status', 'activa');
        console.log(`Payment failed for user ${userId}`);
        break;
      }

      // Subscription expired
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        await supabase
          .from('subscriptions')
          .update({
            status: 'vencida',
            auto_renew: false,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
        console.log(`Subscription expired for user ${userId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
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
