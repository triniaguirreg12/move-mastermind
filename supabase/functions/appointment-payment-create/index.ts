import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  appointmentId: string;
  paymentMethod: 'mercadopago' | 'paypal';
  successUrl: string;
  cancelUrl: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: PaymentRequest = await req.json();
    console.log("Payment request:", JSON.stringify(body, null, 2));

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        professional:professionals(name, title)
      `)
      .eq('id', body.appointmentId)
      .single();

    if (appointmentError || !appointment) {
      throw new Error('Appointment not found');
    }

    const priceAmount = appointment.price_amount;
    const professionalName = appointment.professional?.name || 'Profesional';

    if (body.paymentMethod === 'mercadopago') {
      // Mercado Pago - Single payment (uses separate token from subscriptions)
      const mercadoPagoToken = Deno.env.get('MERCADOPAGO_ONE_TIME_TOKEN');
      if (!mercadoPagoToken) {
        throw new Error('MERCADOPAGO_ONE_TIME_TOKEN not configured');
      }

      const preferenceData = {
        items: [{
          title: `Cita personalizada con ${professionalName}`,
          description: `Sesión de kinesiología - ${appointment.appointment_date} ${appointment.start_time}`,
          quantity: 1,
          unit_price: priceAmount,
          currency_id: 'CLP'
        }],
        back_urls: {
          success: body.successUrl,
          failure: body.cancelUrl,
          pending: body.cancelUrl
        },
        auto_return: 'approved',
        external_reference: body.appointmentId,
        notification_url: `${supabaseUrl}/functions/v1/appointment-payment-webhook`,
        statement_descriptor: 'JUST MUV'
      };

      console.log("Creating MercadoPago preference:", JSON.stringify(preferenceData, null, 2));

      const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mercadoPagoToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferenceData)
      });

      if (!mpResponse.ok) {
        const error = await mpResponse.text();
        console.error("MercadoPago error:", error);
        throw new Error(`MercadoPago error: ${error}`);
      }

      const mpData = await mpResponse.json();
      console.log("MercadoPago preference created:", mpData.id);

      return new Response(JSON.stringify({
        success: true,
        paymentUrl: mpData.init_point,
        preferenceId: mpData.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } else if (body.paymentMethod === 'paypal') {
      // PayPal - Single payment order
      const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID');
      const paypalSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
      
      if (!paypalClientId || !paypalSecret) {
        throw new Error('PayPal credentials not configured');
      }

      // Get PayPal access token
      const authResponse = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${paypalClientId}:${paypalSecret}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      if (!authResponse.ok) {
        const error = await authResponse.text();
        console.error("PayPal auth error:", error);
        throw new Error(`PayPal auth error: ${error}`);
      }

      const authData = await authResponse.json();
      const accessToken = authData.access_token;

      // Convert CLP to USD (approximate)
      const usdAmount = (priceAmount / 900).toFixed(2);

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: body.appointmentId,
          description: `Cita personalizada con ${professionalName}`,
          amount: {
            currency_code: 'USD',
            value: usdAmount
          }
        }],
        application_context: {
          brand_name: 'Just Muv',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: body.successUrl,
          cancel_url: body.cancelUrl
        }
      };

      console.log("Creating PayPal order:", JSON.stringify(orderData, null, 2));

      const orderResponse = await fetch('https://api-m.paypal.com/v2/checkout/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.text();
        console.error("PayPal order error:", error);
        throw new Error(`PayPal order error: ${error}`);
      }

      const order = await orderResponse.json();
      console.log("PayPal order created:", order.id);

      const approveLink = order.links.find((l: { rel: string }) => l.rel === 'approve')?.href;

      return new Response(JSON.stringify({
        success: true,
        paymentUrl: approveLink,
        orderId: order.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('Invalid payment method');

  } catch (error) {
    console.error('Error creating payment:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
