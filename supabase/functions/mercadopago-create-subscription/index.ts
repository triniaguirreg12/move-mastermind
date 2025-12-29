import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateSubscriptionRequest {
  user_id: string;
  user_email: string;
  plan: "globo" | "volea" | "bandeja" | "smash";
}

// Configuración de planes - precios y frecuencias que coinciden con los planes en MP
const PLAN_CONFIG: Record<string, { 
  amount: number; 
  frequency: number; 
  frequency_type: string;
  reason: string;
}> = {
  globo: { 
    amount: 19990, 
    frequency: 1, 
    frequency_type: "months",
    reason: "Just MUV - Plan Globo (1 mes)"
  },
  volea: { 
    amount: 49990, 
    frequency: 3, 
    frequency_type: "months",
    reason: "Just MUV - Plan Volea (3 meses)"
  },
  bandeja: { 
    amount: 89990, 
    frequency: 6, 
    frequency_type: "months",
    reason: "Just MUV - Plan Bandeja (6 meses)"
  },
  smash: { 
    amount: 159990, 
    frequency: 12, 
    frequency_type: "months",
    reason: "Just MUV - Plan Smash (12 meses)"
  },
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

    const planConfig = PLAN_CONFIG[plan];
    if (!planConfig) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    // Build the base URL for redirects
    const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || '';
    
    // Para obtener init_point (checkout redirect), NO usamos preapproval_plan_id
    // Creamos una suscripción pendiente con auto_recurring inline
    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payer_email: user_email,
        external_reference: `${user_id}|${plan}`,
        reason: planConfig.reason,
        auto_recurring: {
          frequency: planConfig.frequency,
          frequency_type: planConfig.frequency_type,
          transaction_amount: planConfig.amount,
          currency_id: "CLP",
        },
        // back_url se usa para volver a la app después del checkout
        // Mercado Pago añade el parámetro preapproval_id automáticamente
        back_url: `${baseUrl}/configuracion?subscription_result=pending`,
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
