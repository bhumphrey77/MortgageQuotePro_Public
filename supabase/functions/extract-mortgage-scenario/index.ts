import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const EXTRACTION_SYSTEM_PROMPT = `You extract structured mortgage scenario data from a user's natural-language description.

Return ONLY fields the user explicitly stated. Never invent values. Numbers must be raw numbers (no $ or %). Rates and percentages are decimals-as-percent (e.g. 6.25 for 6.25%).

Handle these variants:
- "million dollar home" => purchasePrice 1000000
- "twenty percent down" => downPaymentPercent 20
- "$850k" => 850000, "$1.2M" => 1200000
- "6 and a quarter" or "six point two five" for rates => 6.25
- "30 year fixed" => loanTermYears 30

Transaction type detection (set transactionType when clearly implied):
- "refinance", "refi", "refinancing", "cash-out", "rate and term", "current loan", "existing mortgage balance" => "refinance"
- "buying", "purchasing", "closing on", "putting X down on", "home purchase" => "purchase"
- For refinance, treat the stated home value / appraised value as purchasePrice.

If the user gives BOTH a purchase price AND a loan amount (or percent), keep them both — don't pre-compute.

Income units — critical:
- If the user says the income is per month / a month / monthly / "I make $X a month" => return monthlyIncome (raw monthly number).
- If the user says per year / annually / a year / salary of / "I make $X a year" => return annualIncome.
- Never convert between the two. Only return the field that matches the phrasing. If the timeframe is ambiguous, prefer annualIncome only when the number is clearly a yearly salary (e.g. $120,000+ with no timeframe); otherwise omit both.

Property tax — critical:
- Trigger phrases: "tax", "taxes", "property tax", "property taxes", "annual tax", "annual property tax", "yearly tax", "tax bill", "tax rate".
- Dollar amounts => \`annualPropertyTax\` (always dollars-per-year):
  - "$6,000 a year in taxes" / "annual property tax is $6,000" => annualPropertyTax 6000
  - "$500 a month in taxes" / "taxes are $500 monthly" => annualPropertyTax 6000 (monthly × 12)
  - Bare "$6,000 property tax" with no timeframe => treat as annual => 6000
- Percentage/rate => \`annualPropertyTaxRate\` (raw percent, e.g. 1.25 for 1.25%):
  - "property tax rate is 1.25%" / "1.25% property tax" / "tax rate of 1.1 percent" => annualPropertyTaxRate 1.25
- Return only one of the two fields for tax — never both. If user gives a percent, OMIT annualPropertyTax. If user gives dollars, OMIT annualPropertyTaxRate.

Return valid JSON matching the requested schema. Omit fields the user didn't state.`;

const SchemaShape = {
  type: 'object',
  additionalProperties: false,
  properties: {
    transactionType: { type: 'string', enum: ['purchase', 'refinance'] },
    purchasePrice: { type: 'number' },
    loanAmount: { type: 'number' },
    downPayment: { type: 'number' },
    downPaymentPercent: { type: 'number' },
    interestRate: { type: 'number' },
    loanTermYears: { type: 'number' },
    annualPropertyTax: { type: 'number' },
    annualPropertyTaxRate: { type: 'number' },
    annualHomeInsurance: { type: 'number' },
    monthlyHoa: { type: 'number' },
    monthlyDebt: { type: 'number' },
    annualIncome: { type: 'number' },
    monthlyIncome: { type: 'number' },
    creditScore: { type: 'number' },
    propertyType: {
      type: 'string',
      enum: ['single_family', 'condo', 'townhouse', 'multi_family', 'manufactured'],
    },
    occupancy: {
      type: 'string',
      enum: ['primary', 'second_home', 'investment'],
    },
    extraMonthlyPayment: { type: 'number' },
    cashAvailable: { type: 'number' },
    desiredMonthlyPayment: { type: 'number' },
    notes: { type: 'string' },
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { text } = await req.json().catch(() => ({ text: '' }));
    if (!text || typeof text !== 'string' || text.trim().length < 3) {
      return new Response(JSON.stringify({ error: 'Missing or too-short text' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (text.length > 4000) {
      return new Response(JSON.stringify({ error: 'Text too long' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3.6-flash',
        messages: [
          { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'submitExtraction',
              description: 'Submit the extracted mortgage scenario fields.',
              parameters: SchemaShape,
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'submitExtraction' } },
      }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('AI gateway error', resp.status, errorText);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit — please slow down.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (resp.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Add credits in workspace billing.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      return new Response(JSON.stringify({ error: 'AI extraction failed', details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argStr = toolCall?.function?.arguments;
    let extracted: Record<string, unknown> = {};
    if (argStr) {
      try {
        extracted = JSON.parse(argStr);
      } catch (e) {
        console.error('Failed to parse tool args', e);
      }
    }

    return new Response(JSON.stringify({ extracted }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('extract-mortgage-scenario error', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
