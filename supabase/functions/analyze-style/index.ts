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
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    const { posts, userId } = await req.json();
    
    if (!posts || !Array.isArray(posts) || posts.length < 3) {
      return new Response(
        JSON.stringify({ error: 'At least 3 posts are required for analysis' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Analyzing writing style for user: ${userId}`);

    // Prepare the analysis prompt
    const analysisPrompt = `
    Analyze these LinkedIn posts and extract detailed writing patterns. Return your analysis as a JSON object with the following structure:

    {
      "tone": "string describing overall tone (e.g., professional, casual, inspirational, humorous)",
      "common_topics": ["array of frequent topics/themes"],
      "post_structure_preferences": ["array of preferred structures like lists, stories, tips, questions"],
      "engagement_patterns": ["array of engagement techniques used"],
      "writing_style_markers": ["array of unique style characteristics"],
      "vocabulary_level": "string describing complexity level",
      "sentence_structure": "string describing typical sentence patterns",
      "use_of_emojis": "frequency and style of emoji usage",
      "call_to_action_style": "how the user typically engages audience",
      "personal_vs_professional": "balance between personal stories and professional content"
    }

    Posts to analyze:
    ${posts.map((post, i) => `Post ${i + 1}:\n${post}\n\n`).join('')}

    Provide only the JSON response, no additional text.
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
          { role: 'system', content: 'You are an expert content analyst who specializes in identifying writing patterns and styles. Return only valid JSON.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisResult = data.choices[0].message.content;
    
    let styleData;
    try {
      styleData = JSON.parse(analysisResult);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', analysisResult);
      throw new Error('Invalid response format from analysis');
    }

    // Add metadata
    styleData.analyzed_posts = posts;
    styleData.posts_count = posts.length;
    styleData.analysis_date = new Date().toISOString();

    console.log('Style analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        styleData,
        confidence_score: Math.min(0.7 + (posts.length * 0.05), 0.95) // Higher confidence with more posts
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-style function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to analyze writing style',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});