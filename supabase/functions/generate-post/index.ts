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
      `You are a LinkedIn content creator who writes in the user's specific style. Create engaging LinkedIn posts that match the user's writing patterns exactly.` :
      `You are a professional LinkedIn content creator. Create engaging, professional LinkedIn posts that drive engagement and provide value.`;

    const contentPrompt = `
    Create a LinkedIn post about: "${prompt}"

    ${styleContext}

    Requirements:
    - Write in an engaging, professional tone ${usePersonalStyle ? 'that matches the user\'s style above' : ''}
    - Include relevant emojis where appropriate ${usePersonalStyle && styleContext.includes('emoji') ? '(match the user\'s emoji style)' : ''}
    - Add appropriate hashtags (3-5 relevant hashtags)
    - Make it 150-300 words
    - Include a call-to-action question or engagement prompt
    - Structure the content for readability (use line breaks, bullet points if needed)
    ${usePersonalStyle ? '- Mirror the user\'s tone, vocabulary level, and engagement style' : ''}

    Return only the post content, ready to be published on LinkedIn.
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