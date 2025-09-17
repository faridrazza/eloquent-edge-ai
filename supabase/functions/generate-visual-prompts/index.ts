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

    const { postContent, visualCount, visualStyle, contentType } = await req.json();
    
    if (!postContent || !visualCount) {
      return new Response(
        JSON.stringify({ error: 'Post content and visual count are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Generating ${visualCount} visual prompts with ${visualStyle} style...`);

    const styleGuidelines = {
      infographic: "Clean, data-focused design with charts, icons, and structured layouts. Professional color scheme with blues, whites, and accent colors. Modern typography and clear information hierarchy.",
      quote_cards: "Bold, eye-catching design focused on text. Minimal background elements, strong typography, inspiring color gradients or solid backgrounds. Emphasis on readability and impact.",
      mixed: "Combination of infographic elements and quote card aesthetics. Balanced visual hierarchy with both textual and graphical elements."
    };

    const promptGenerationRequest = `
    Create ${visualCount} detailed visual prompts for ${visualStyle} style LinkedIn carousel images based on this post content.

    Post Content:
    "${postContent}"

    Content Type: ${contentType}
    Visual Style: ${visualStyle}
    Style Guidelines: ${styleGuidelines[visualStyle] || styleGuidelines.mixed}

    For each visual, return a JSON object with this structure:
    {
      "visualPrompts": [
        {
          "order": number,
          "title": "string (brief title for this visual)",
          "imagePrompt": "detailed prompt for image generation AI",
          "textOverlay": "main text to overlay on the image",
          "designNotes": "specific design instructions"
        }
      ]
    }

    Guidelines for image prompts:
    - Be specific about design style, colors, layout
    - Include relevant icons, charts, or graphics based on content
    - Specify text placement and hierarchy
    - Mention professional LinkedIn aesthetic
    - Keep prompts under 200 characters each
    - First visual should be an eye-catching intro/title slide
    - Subsequent visuals should cover individual points/tips/steps

    Return only the JSON response.
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
          { 
            role: 'system', 
            content: 'You are an expert visual designer who creates detailed prompts for AI image generation. Focus on LinkedIn-appropriate professional designs. Return only valid JSON.' 
          },
          { role: 'user', content: promptGenerationRequest }
        ],
        temperature: 0.4,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const promptsResult = data.choices[0].message.content;
    
    let visualPrompts;
    try {
      visualPrompts = JSON.parse(promptsResult);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', promptsResult);
      throw new Error('Invalid response format from prompt generation');
    }

    console.log('Visual prompts generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        visualPrompts: visualPrompts.visualPrompts || visualPrompts,
        metadata: {
          visualCount,
          visualStyle,
          contentType
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-visual-prompts function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate visual prompts',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});