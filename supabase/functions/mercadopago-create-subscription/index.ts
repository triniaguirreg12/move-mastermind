import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateSubscriptionRequest {
  user_id: string;
  user_email: string;
  plan_id: string; // preapproval_plan_id de Mercado Pago
  plan: "globo" | "volea" | "bandeja" | "smash";
}

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

    const { user_id, user_email, plan_id, plan }: CreateSubscriptionRequest = await req.json();
    
    console.log(`Creating Mercado Pago subscription for user ${user_id}, plan: ${plan}, plan_id: ${plan_id}`);

    if (!plan_id) {
      throw new Error('plan_id (preapproval_plan_id) is required');
    }

    // Crear suscripción usando el plan existente en Mercado Pago
    // Al usar preapproval_plan_id, MP genera automáticamente el init_point
    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        preapproval_plan_id: plan_id,
        payer_email: user_email,
        external_reference: `${user_id}|${plan}`,
        back_url: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/configuracion?subscription=success`,
        status: 'pending',
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Mercado Pago error:', data);
      throw new Error(data.message || JSON.stringify(data) || 'Failed to create subscription');
    }

    console.log('Mercado Pago subscription created:', data.id, 'init_point:', data.init_point);

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: data.id,
        init_point: data.init_point,
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
