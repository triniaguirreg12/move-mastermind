import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// The Just Muv calendar ID
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

interface CheckAvailabilityRequest {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

// Create JWT for Google API authentication (service account, no impersonation)
async function createJWT(serviceAccount: GoogleServiceAccountKey): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const signatureInput = `${headerB64}.${payloadB64}`;

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
async function getAccessToken(serviceAccount: GoogleServiceAccountKey): Promise<string> {
  const jwt = await createJWT(serviceAccount);
  
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

// Get busy periods from Google Calendar for a date range
async function getBusyPeriods(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<{ start: string; end: string }[]> {
  const requestBody = {
    timeMin,
    timeMax,
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
    throw new Error(`FreeBusy API error: ${error}`);
  }

  const data = await response.json();
  console.log("FreeBusy response:", JSON.stringify(data, null, 2));
  
  const busy = data.calendars?.[calendarId]?.busy || [];
  console.log("Busy periods found:", busy.length, busy);
  
  return busy;
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
    const body: CheckAvailabilityRequest = await req.json();
    
    console.log("Check availability request:", JSON.stringify(body, null, 2));

    // Validate input
    if (!body.date || !body.startTime || !body.endTime) {
      throw new Error('Missing required fields: date, startTime, endTime');
    }

    // Get access token
    const accessToken = await getAccessToken(serviceAccount);
    console.log("Got access token for service account");

    // Format times for Google Calendar API (ISO 8601)
    // Chile uses -03:00 in summer (CLST) and -04:00 in winter (CLT)
    // For simplicity, we'll use the timezone name and let Google handle it
    const timeMin = `${body.date}T${body.startTime}:00-03:00`;
    const timeMax = `${body.date}T${body.endTime}:00-03:00`;

    // Get busy periods from Google Calendar
    const busyPeriods = await getBusyPeriods(
      accessToken,
      JUST_MUV_CALENDAR_ID,
      timeMin,
      timeMax
    );

    // Extract busy time slots (just the times, in HH:mm format)
    const busySlots = busyPeriods.map(period => {
      // Parse the ISO datetime and extract time in local timezone
      const startDate = new Date(period.start);
      const endDate = new Date(period.end);
      
      // Format as HH:mm in Chile timezone
      const startHours = startDate.getUTCHours() - 3; // Adjust for Chile timezone
      const startMins = startDate.getUTCMinutes();
      const endHours = endDate.getUTCHours() - 3;
      const endMins = endDate.getUTCMinutes();
      
      return {
        start: `${String(startHours).padStart(2, '0')}:${String(startMins).padStart(2, '0')}`,
        end: `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`
      };
    });

    console.log("Busy slots formatted:", busySlots);

    return new Response(JSON.stringify({ 
      success: true,
      busySlots,
      rawPeriods: busyPeriods
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      busySlots: [] // Return empty array so frontend can still work
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
