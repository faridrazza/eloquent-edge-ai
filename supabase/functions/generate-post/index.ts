import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openAIApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { prompt, userId, usePersonalStyle = false } = await req.json();
    
    if (!prompt || !userId) {
      return new Response(
        JSON.stringify({ error: 'Prompt and userId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Generating post for user: ${userId}, prompt: ${prompt.substring(0, 50)}...`);

    let styleContext = "";
    let postStructure = "generic_tips";

    // If personal style is requested, fetch user's style data
    if (usePersonalStyle) {
      const { data: userStyle } = await supabase
        .from('user_styles')
        .select('style_data')
        .eq('user_id', userId)
        .single();

      if (userStyle?.style_data) {
        const style = userStyle.style_data;
        styleContext = `
        User's Writing Style Profile:
        - Tone: ${style.tone}
        - Common Topics: ${style.common_topics?.join(', ')}
        - Structure Preferences: ${style.post_structure_preferences?.join(', ')}
        - Engagement Patterns: ${style.engagement_patterns?.join(', ')}
        - Style Markers: ${style.writing_style_markers?.join(', ')}
        - Vocabulary Level: ${style.vocabulary_level}
        - Emoji Usage: ${style.use_of_emojis}
        - Call to Action Style: ${style.call_to_action_style}
        `;
        postStructure = "personal_experience";
      }
    }

    const systemPrompt = usePersonalStyle && styleContext ? 
      `You are a professional LinkedIn ghostwriter who writes in the user's specific style. Create sophisticated, professional LinkedIn posts that match the user's writing patterns exactly. Write like a senior executive or thought leader - no emojis, no markdown symbols, no asterisks, no dashes for formatting. Use clean, professional prose.` :
      `You are a professional LinkedIn ghostwriter and thought leader. Write sophisticated, executive-level LinkedIn posts that establish authority and credibility. Write in clean, professional prose without any emojis, symbols, or markdown formatting. Focus on substance, insights, and professional value.`;

    // Extract specific style instructions from the prompt
    const promptLower = prompt.toLowerCase();
    let specificInstructions = "";
    
    if (promptLower.includes("ghostwriter") || promptLower.includes("ghost writer")) {
      specificInstructions += "\n- Write in a professional ghostwriter style: authoritative, polished, and engaging";
    }
    
    if (promptLower.includes("story") || promptLower.includes("storytelling")) {
      specificInstructions += "\n- Use storytelling format: start with a hook, include personal narrative, and end with a lesson or insight";
      specificInstructions += "\n- Make it personal and relatable, showing vulnerability and growth";
    }
    
    if (promptLower.includes("viral") || promptLower.includes("followers")) {
      specificInstructions += "\n- Focus on growth strategies and actionable insights";
      specificInstructions += "\n- Use specific numbers and concrete examples";
    }

    const contentPrompt = `
    Create a professional LinkedIn post about: "${prompt}"

    ${styleContext}

    PROFESSIONAL WRITING REQUIREMENTS:
    - Write as a senior executive, thought leader, or industry expert
    - Use sophisticated, professional language that establishes credibility
    - NO emojis, NO symbols, NO asterisks (*), NO dashes (---), NO markdown formatting
    - Write in clean, readable prose with proper paragraphs
    - Focus on insights, strategy, and professional value
    - Include 3-5 relevant hashtags at the end (simple format: #HashtagName)
    - Length: 150-300 words
    - End with a thoughtful question to encourage professional discussion
    ${usePersonalStyle ? '- Mirror the user\'s professional tone and expertise level' : ''}
    ${specificInstructions}

    FORMATTING STYLE:
    - Use simple paragraph breaks for readability
    - If listing points, use simple numbered format (1. 2. 3.) or natural paragraph flow
    - Write like you would in a professional business communication
    - No decorative elements, symbols, or visual formatting

    TONE: Professional, authoritative, insightful, and engaging without being flashy

    Return only the clean, professional post content ready for LinkedIn publication.
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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: contentPrompt }
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log('Post generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        generatedContent,
        postStructure,
        prompt
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-post function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate post',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});