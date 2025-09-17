import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    const { postContent } = await req.json();
    
    if (!postContent) {
      return new Response(
        JSON.stringify({ error: 'Post content is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Analyzing post structure for visual recommendations...');

    const analysisPrompt = `
    Analyze this LinkedIn post and determine the optimal visual strategy. Return a JSON object with this exact structure:

    {
      "content_type": "string (list|tips|story|process|quote|announcement|question)",
      "recommended_visual_count": number,
      "visual_breakdown": ["array of strings describing each visual"],
      "visual_style_recommendation": "string (infographic|quote_cards|mixed)",
      "key_points": ["array of main points to visualize"],
      "primary_topic": "string describing the main topic",
      "estimated_credits": number
    }

    Post content:
    "${postContent}"

    Guidelines:
    - If it's a list/tips format, recommend 1 intro + 1 per tip (max 8 total)
    - If it's a story, recommend 3-5 key moment visuals
    - If it's a single concept/quote, recommend 1-2 visuals
    - If it's a process, recommend 1 per step + overview
    - estimated_credits should equal recommended_visual_count

    Provide only the JSON response.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert visual content strategist. Analyze content and recommend optimal visual breakdowns for LinkedIn carousels. Return only valid JSON.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisResult = data.choices[0].message.content;
    
    let structureData;
    try {
      structureData = JSON.parse(analysisResult);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', analysisResult);
      throw new Error('Invalid response format from analysis');
    }

    console.log('Post structure analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis: structureData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-post-structure function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to analyze post structure',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});