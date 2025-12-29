import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const contentType = req.headers.get('content-type') || '';

    let appointmentId: string | null = null;
    let paymentId: string | null = null;
    let paymentStatus: string | null = null;

    // Handle MercadoPago webhook
    if (contentType.includes('application/json')) {
      const body = await req.json();
      console.log("Webhook received:", JSON.stringify(body, null, 2));

      if (body.type === 'payment') {
        // Get payment details from MercadoPago (uses one-time token)
        const mercadoPagoToken = Deno.env.get('MERCADOPAGO_ONE_TIME_TOKEN');
        if (!mercadoPagoToken) {
          throw new Error('MERCADOPAGO_ONE_TIME_TOKEN not configured');
        }

        const paymentResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${body.data.id}`,
          {
            headers: { 'Authorization': `Bearer ${mercadoPagoToken}` }
          }
        );

        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          console.log("MercadoPago payment data:", JSON.stringify(paymentData, null, 2));

          appointmentId = paymentData.external_reference;
          paymentId = paymentData.id.toString();
          paymentStatus = paymentData.status;
        }
      }
    }

    // Handle PayPal IPN or return
    const paypalOrderId = url.searchParams.get('token');
    if (paypalOrderId) {
      console.log("PayPal order callback:", paypalOrderId);

      const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID');
      const paypalSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');

      if (paypalClientId && paypalSecret) {
        // Get access token
        const authResponse = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${paypalClientId}:${paypalSecret}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'grant_type=client_credentials'
        });

        if (authResponse.ok) {
          const authData = await authResponse.json();

          // Capture the order
          const captureResponse = await fetch(
            `https://api-m.paypal.com/v2/checkout/orders/${paypalOrderId}/capture`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${authData.access_token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (captureResponse.ok) {
            const captureData = await captureResponse.json();
            console.log("PayPal capture:", JSON.stringify(captureData, null, 2));

            appointmentId = captureData.purchase_units?.[0]?.reference_id;
            paymentId = captureData.id;
            paymentStatus = captureData.status === 'COMPLETED' ? 'approved' : 'pending';
          }
        }
      }
    }

    // Process approved payment
    if (appointmentId && paymentStatus === 'approved') {
      console.log(`Processing approved payment for appointment: ${appointmentId}`);

      // Get appointment details for creating Meet
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select(`
          *,
          professional:professionals(name, title)
        `)
        .eq('id', appointmentId)
        .single();

      if (fetchError || !appointment) {
        console.error("Appointment not found:", fetchError);
        throw new Error('Appointment not found');
      }

      // Get user email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, name')
        .eq('user_id', appointment.user_id)
        .single();

      // Update payment status
      await supabase
        .from('appointments')
        .update({
          payment_status: 'paid',
          payment_id: paymentId
        })
        .eq('id', appointmentId);

      // Create user_event for calendar (if not exists)
      const { data: existingEvent } = await supabase
        .from('user_events')
        .select('id')
        .eq('user_id', appointment.user_id)
        .eq('type', 'profesional')
        .contains('metadata', { appointment_id: appointmentId })
        .maybeSingle();

      if (!existingEvent) {
        await supabase
          .from('user_events')
          .insert({
            user_id: appointment.user_id,
            type: 'profesional',
            status: 'scheduled',
            event_date: appointment.appointment_date,
            time_start: appointment.start_time,
            time_end: appointment.end_time,
            title: `Cita con ${appointment.professional?.name || 'Profesional'}`,
            metadata: {
              professional_id: appointment.professional_id,
              professional_name: appointment.professional?.name,
              appointment_id: appointmentId
            }
          });
      }

      // Trigger Google Meet creation
      const meetResponse = await fetch(`${supabaseUrl}/functions/v1/create-google-meet`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId,
          professionalEmail: 'isabel@justmuv.cl', // Professional's email for calendar
          userEmail: profile?.email || '',
          appointmentDate: appointment.appointment_date,
          startTime: appointment.start_time,
          endTime: appointment.end_time,
          summary: `Cita personalizada - ${profile?.name || 'Cliente'}`,
          description: `Objetivo: ${appointment.consultation_goal}\nCondición: ${appointment.injury_condition}`
        })
      });

      if (!meetResponse.ok) {
        const meetError = await meetResponse.text();
        console.error("Failed to create Meet:", meetError);
        // Don't throw - payment is still successful, Meet can be added manually
      } else {
        const meetData = await meetResponse.json();
        console.log("Meet created:", meetData.meetLink);
      }

      console.log(`Payment confirmed for appointment: ${appointmentId}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
