import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateSubscriptionRequest {
  user_id: string;
  user_email: string;
  plan_id: string;
  plan: "globo" | "volea" | "bandeja" | "smash";
}

// Plan prices in CLP (Chilean Pesos)
const PLAN_PRICES: Record<string, { amount: number; months: number }> = {
  globo: { amount: 9990, months: 1 },
  volea: { amount: 26990, months: 3 },
  bandeja: { amount: 47990, months: 6 },
  smash: { amount: 79990, months: 12 },
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured');
    }

    const { user_id, user_email, plan }: CreateSubscriptionRequest = await req.json();
    
    console.log(`Creating Mercado Pago subscription for user ${user_id}, plan: ${plan}`);

    const planConfig = PLAN_PRICES[plan];
    if (!planConfig) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + planConfig.months);

    // Create preapproval WITHOUT plan_id - this generates init_point for checkout
    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payer_email: user_email,
        external_reference: `${user_id}|${plan}`,
        reason: `Just MUV - Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
        auto_recurring: {
          frequency: planConfig.months,
          frequency_type: "months",
          transaction_amount: planConfig.amount,
          currency_id: "CLP",
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        },
        back_url: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/configuracion?subscription=success`,
        status: 'pending',
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Mercado Pago error:', data);
      throw new Error(data.message || 'Failed to create subscription');
    }

    console.log('Mercado Pago subscription created:', data.id);

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: data.id,
        init_point: data.init_point, // URL to redirect user to pay
        status: data.status,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error creating Mercado Pago subscription:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
