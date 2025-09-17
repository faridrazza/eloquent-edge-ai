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

    const { postContent, visualCount, visualStyle, contentType, postAnalysis } = await req.json();
    
    if (!postContent || !visualCount) {
      return new Response(
        JSON.stringify({ error: 'Post content and visual count are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Simple approach - let AI analyze the post content directly
    console.log(`Generating ${visualCount} visual prompts with ${visualStyle} style...`);
    console.log('Request payload:', { 
      postContent: postContent.substring(0, 100) + '...', 
      visualCount, 
      visualStyle, 
      contentType
    });

    // Simple, direct prompt generation - let AI analyze the post content
    const promptGenerationRequest = `
    You are a professional LinkedIn marketing expert. Analyze this post content and create ${visualCount} high-quality, engaging visual prompts for ${visualStyle} style.

    POST CONTENT:
    "${postContent}"

    VISUAL STYLE: ${visualStyle}
    ${visualStyle === 'carousel' ? 'CREATE CAROUSEL: Design for LinkedIn carousel posts with storytelling flow and progressive narrative that keeps users engaged.' : ''}
    ${visualStyle === 'infographic' ? 'CREATE INFOGRAPHIC: Data-focused design with charts, icons, and structured information.' : ''}
    ${visualStyle === 'quote_cards' ? 'CREATE QUOTE CARDS: Bold typography and minimal design for maximum impact.' : ''}
    ${visualStyle === 'mixed' ? 'CREATE MIXED STYLE: Balanced combination of visual and text elements.' : ''}

    INSTRUCTIONS:
    - Analyze the post content and extract key topics
    - Create ${visualCount} visuals that directly relate to specific points
    - Use engaging, professional design appropriate for ${visualStyle}
    - Make each visual represent a distinct concept from the post

    REQUIRED JSON FORMAT:
    {
      "visualPrompts": [
        {
          "order": 1,
          "title": "[Specific topic from the post]",
          "imagePrompt": "High-quality ${visualStyle} showing [specific concept], engaging design, professional aesthetic",
          "textOverlay": "[Key message from post]",
          "designNotes": "Professional ${visualStyle} design"
        }
      ]
    }

    Generate exactly ${visualCount} unique visuals. Return ONLY the JSON object.
    `;

    console.log('Sending request to OpenAI API...');
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
            content: 'You are a world-class LinkedIn marketing expert and professional visual designer with 10+ years of experience creating viral LinkedIn content. You understand LinkedIn algorithms, user psychology, and visual design principles. You specialize in creating high-converting carousel posts that drive engagement and establish thought leadership. Your visual prompts are legendary for producing professional, on-brand images that perfectly match post content and resonate with LinkedIn audiences. You always analyze the specific post content deeply and create visually compelling, relevant imagery that tells the story of the content.' 
          },
          { role: 'user', content: promptGenerationRequest }
        ],
        temperature: 0.4,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error response:', error);
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    console.log('OpenAI API response received:', { choices: data.choices?.length });
    const promptsResult = data.choices[0].message.content;
    console.log('Generated prompts result:', promptsResult.substring(0, 300) + '...');
    
    let visualPrompts;
    try {
      // Try to extract JSON from the response (in case it's wrapped in markdown)
      let jsonString = promptsResult.trim();
      
      // Remove markdown code block formatting if present
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to find JSON object in the text
      const jsonStart = jsonString.indexOf('{');
      const jsonEnd = jsonString.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonString = jsonString.substring(jsonStart, jsonEnd + 1);
      }
      
      console.log('Cleaned JSON string:', jsonString.substring(0, 200) + '...');
      visualPrompts = JSON.parse(jsonString);
      
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', promptsResult);
      console.error('Parse error:', parseError);
      
      // Simple fallback based on post content keywords
      console.log('Attempting simple fallback prompt generation...');
      
      const contentWords = postContent.toLowerCase();
      let fallbackTitle = "Professional Content";
      let fallbackImagePrompt = `High-quality ${visualStyle} design`;
      let fallbackTextOverlay = "Key Insight";
      
      if (contentWords.includes('sales')) {
        fallbackTitle = "Sales Strategy";
        fallbackImagePrompt += ", sales concepts, business growth";
        fallbackTextOverlay = "Sales Excellence";
      } else if (contentWords.includes('marketing')) {
        fallbackTitle = "Marketing Insights";
        fallbackImagePrompt += ", marketing concepts, digital strategy";
        fallbackTextOverlay = "Marketing Success";
      } else if (contentWords.includes('leadership')) {
        fallbackTitle = "Leadership Development";
        fallbackImagePrompt += ", leadership concepts, team management";
        fallbackTextOverlay = "Leadership Excellence";
      } else if (contentWords.includes('productivity')) {
        fallbackTitle = "Productivity Tips";
        fallbackImagePrompt += ", productivity concepts, time management";
        fallbackTextOverlay = "Boost Productivity";
      } else if (contentWords.includes('network')) {
        fallbackTitle = "Networking Strategy";
        fallbackImagePrompt += ", networking concepts, connections";
        fallbackTextOverlay = "Build Your Network";
      }
      
        visualPrompts = {
        visualPrompts: [{
          order: 1,
          title: fallbackTitle,
          imagePrompt: fallbackImagePrompt + ", engaging visual elements",
          textOverlay: fallbackTextOverlay,
          designNotes: `Professional ${visualStyle} design`
        }]
      };
      
      console.log('Using fallback prompts due to parsing error');
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
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      cause: error.cause
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate visual prompts',
        success: false,
        errorType: error.name,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});