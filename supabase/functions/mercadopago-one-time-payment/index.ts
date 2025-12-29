import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OneTimePaymentRequest {
  user_id: string;
  user_email: string;
  service_name?: string;
  amount?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Uses separate token for one-time payments (NOT subscriptions)
    const accessToken = Deno.env.get('MERCADOPAGO_ONE_TIME_TOKEN');
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ONE_TIME_TOKEN not configured');
    }

    const { 
      user_id, 
      user_email, 
      service_name = 'Programa personalizado',
      amount = 30000 
    }: OneTimePaymentRequest = await req.json();
    
    console.log(`Creating one-time payment for user ${user_id}, service: ${service_name}, amount: ${amount} CLP`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const baseUrl = supabaseUrl.replace('.supabase.co', '.lovable.app');

    // Create preference (Checkout Pro) in Mercado Pago
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            title: service_name,
            quantity: 1,
            unit_price: amount,
            currency_id: 'CLP',
          }
        ],
        payer: {
          email: user_email,
        },
        external_reference: user_id,
        back_urls: {
          success: `${baseUrl}/configuracion?payment=success`,
          failure: `${baseUrl}/configuracion?payment=failure`,
          pending: `${baseUrl}/configuracion?payment=pending`,
        },
        auto_return: 'approved',
        notification_url: `${supabaseUrl}/functions/v1/mercadopago-one-time-webhook`,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Mercado Pago error:', data);
      throw new Error(data.message || 'Failed to create payment preference');
    }

    console.log('Mercado Pago preference created:', data.id);

    return new Response(
      JSON.stringify({
        success: true,
        preference_id: data.id,
        init_point: data.init_point, // URL to redirect user to pay
        sandbox_init_point: data.sandbox_init_point, // Sandbox URL for testing
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error creating one-time payment:', error);
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
