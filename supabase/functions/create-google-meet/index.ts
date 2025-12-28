import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// The Just Muv calendar ID (contacto.justmuv@gmail.com)
const JUST_MUV_CALENDAR_ID = 'contacto.justmuv@gmail.com';

interface GoogleServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

interface CreateMeetRequest {
  appointmentId: string;
  professionalEmail: string;
  userEmail: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  summary: string;
  description?: string;
}

// Create JWT for Google API authentication with domain-wide delegation
async function createJWT(serviceAccount: GoogleServiceAccountKey, targetEmail: string): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    sub: targetEmail, // Impersonate the target user (Just Muv calendar owner)
    scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const signatureInput = `${headerB64}.${payloadB64}`;

  // Import the private key
  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  return `${signatureInput}.${signatureB64}`;
}

// Get access token using JWT
async function getAccessToken(serviceAccount: GoogleServiceAccountKey, targetEmail: string): Promise<string> {
  const jwt = await createJWT(serviceAccount, targetEmail);
  
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Token error:", error);
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Check if time slot is busy using freebusy API
async function checkBusy(
  accessToken: string,
  calendarId: string,
  startDateTime: string,
  endDateTime: string
): Promise<boolean> {
  const requestBody = {
    timeMin: startDateTime,
    timeMax: endDateTime,
    timeZone: 'America/Santiago',
    items: [{ id: calendarId }]
  };

  console.log("Checking freebusy:", JSON.stringify(requestBody, null, 2));

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/freeBusy',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("FreeBusy API error:", error);
    // If we can't check, proceed anyway but log the error
    return false;
  }

  const data = await response.json();
  const busy = data.calendars?.[calendarId]?.busy || [];
  console.log("Busy periods found:", busy.length);
  
  return busy.length > 0;
}

// Create Google Calendar event with Meet
async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: {
    summary: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    attendees: string[];
  }
): Promise<{ meetLink: string; eventId: string }> {
  const requestBody = {
    summary: event.summary,
    description: event.description || '',
    start: {
      dateTime: event.startDateTime,
      timeZone: 'America/Santiago'
    },
    end: {
      dateTime: event.endDateTime,
      timeZone: 'America/Santiago'
    },
    attendees: event.attendees.map(email => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: crypto.randomUUID(),
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 30 }
      ]
    }
  };

  console.log("Creating calendar event:", JSON.stringify(requestBody, null, 2));

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Calendar API error:", error);
    throw new Error(`Failed to create calendar event: ${error}`);
  }

  const eventData = await response.json();
  console.log("Calendar event created:", eventData.id);
  
  const meetLink = eventData.conferenceData?.entryPoints?.find(
    (ep: { entryPointType: string }) => ep.entryPointType === 'video'
  )?.uri || eventData.hangoutLink;

  if (!meetLink) {
    throw new Error('Failed to generate Google Meet link');
  }

  return { meetLink, eventId: eventData.id };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountKeyStr = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKeyStr) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not configured');
    }

    const serviceAccount: GoogleServiceAccountKey = JSON.parse(serviceAccountKeyStr);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: CreateMeetRequest = await req.json();
    console.log("Create Meet request:", JSON.stringify(body, null, 2));

    // Get access token (impersonating the Just Muv calendar owner)
    const accessToken = await getAccessToken(serviceAccount, JUST_MUV_CALENDAR_ID);
    console.log("Got access token for Just Muv calendar");

    // Format date/time for Google Calendar (ISO 8601 with timezone offset for Chile)
    const startDateTime = `${body.appointmentDate}T${body.startTime}:00-03:00`;
    const endDateTime = `${body.appointmentDate}T${body.endTime}:00-03:00`;

    // Check if the time slot is busy
    const isBusy = await checkBusy(accessToken, JUST_MUV_CALENDAR_ID, startDateTime, endDateTime);
    if (isBusy) {
      console.log("Time slot is busy, rejecting appointment");
      return new Response(JSON.stringify({ 
        error: 'El horario seleccionado ya no está disponible. Por favor elige otro horario.',
        code: 'SLOT_BUSY'
      }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create calendar event with Meet in the Just Muv calendar
    const { meetLink, eventId } = await createCalendarEvent(
      accessToken,
      JUST_MUV_CALENDAR_ID,
      {
        summary: body.summary,
        description: body.description,
        startDateTime,
        endDateTime,
        attendees: [body.professionalEmail, body.userEmail].filter(Boolean)
      }
    );

    console.log("Meet link created:", meetLink);

    // Update appointment with Meet link
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ 
        google_meet_link: meetLink,
        status: 'confirmed'
      })
      .eq('id', body.appointmentId);

    if (updateError) {
      console.error("Failed to update appointment:", updateError);
      throw updateError;
    }

    // Also update user_events metadata with Meet link
    const { data: appointment } = await supabase
      .from('appointments')
      .select('user_id, appointment_date')
      .eq('id', body.appointmentId)
      .single();

    if (appointment) {
      const { data: eventData } = await supabase
        .from('user_events')
        .select('id, metadata')
        .eq('user_id', appointment.user_id)
        .eq('event_date', appointment.appointment_date)
        .eq('type', 'profesional')
        .maybeSingle();

      if (eventData) {
        const currentMetadata = (eventData.metadata as Record<string, unknown>) || {};
        await supabase
          .from('user_events')
          .update({ 
            metadata: { ...currentMetadata, google_meet_link: meetLink, google_event_id: eventId }
          })
          .eq('id', eventData.id);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      meetLink,
      eventId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating Google Meet:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
