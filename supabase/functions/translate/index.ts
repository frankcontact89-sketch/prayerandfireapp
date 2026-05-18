import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter: 20 requests per minute per IP
const RATE_LIMIT = 20;
const WINDOW_MS = 60_000;
const ipHits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  ipHits.set(ip, hits);
  return hits.length > RATE_LIMIT;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    if (isRateLimited(ip)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please slow down.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { text, targetLang } = await req.json();

    if (!text || !targetLang || typeof text !== 'string' || text.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Invalid input' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Translation service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const langNames: Record<string, string> = {
      en: 'English', es: 'Spanish', pt: 'Portuguese', fr: 'French',
      de: 'German', it: 'Italian', ru: 'Russian', zh: 'Chinese',
      ja: 'Japanese', ko: 'Korean', ar: 'Arabic', hi: 'Hindi',
    };
    const targetName = langNames[targetLang] || targetLang;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: `You are a translator. Translate the user's text to ${targetName}. Return ONLY the translated text with no explanations, quotes, or extra words.` },
          { role: 'user', content: String(text) },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `Translation failed (${response.status})`);
    }
    const translatedText = data.choices?.[0]?.message?.content?.trim() ?? text;

    return new Response(
      JSON.stringify({ translatedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Translation error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
