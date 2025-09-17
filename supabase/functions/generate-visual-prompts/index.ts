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

    console.log(`Generating ${visualCount} visual prompts with ${visualStyle} style...`);
    console.log('Request payload:', { 
      postContent: postContent.substring(0, 100) + '...', 
      visualCount, 
      visualStyle, 
      contentType,
      hasPostAnalysis: !!postAnalysis
    });

    // Extract key information from post analysis if available
    const keyPoints = postAnalysis?.key_points || [];
    const primaryTopic = postAnalysis?.primary_topic || 'professional development';
    const contentTypeDetected = postAnalysis?.content_type || contentType;

    const styleGuidelines = {
      infographic: "Professional LinkedIn carousel design with clean typography, corporate blue color scheme (#0077B5), white backgrounds, modern icons, structured layouts with clear information hierarchy, charts and data visualizations where relevant. Focus on professional credibility and expertise.",
      quote_cards: "Bold LinkedIn quote card design with strong typography, professional color gradients (blue to white), minimal background elements, emphasis on readability and impact. Include subtle LinkedIn branding elements and professional aesthetic.",
      mixed: "Combination of infographic elements and quote card aesthetics. Balanced visual hierarchy with both textual and graphical elements, maintaining LinkedIn's professional standards."
    };

    // Smart content extraction for better prompt generation
    const extractContentStrategy = (content: string): { topics: string[], strategies: string[], keywords: string[] } => {
      const contentLower = content.toLowerCase();
      const topics: string[] = [];
      const strategies: string[] = [];
      const keywords: string[] = [];
      
      // Extract numbered points or strategies
      const numberedPoints = content.match(/\d+[\.\)]\s*([^\n]+)/g) || [];
      numberedPoints.forEach(point => {
        const cleanPoint = point.replace(/^\d+[\.\)]\s*/, '').trim();
        strategies.push(cleanPoint);
      });
      
      // Extract bullet points
      const bulletPoints = content.match(/[•\-]\s*([^\n]+)/g) || [];
      bulletPoints.forEach(point => {
        const cleanPoint = point.replace(/^[•\-]\s*/, '').trim();
        strategies.push(cleanPoint);
      });
      
      // Extract topic keywords from content
      const topicKeywords = [
        'sales', 'marketing', 'leadership', 'productivity', 'networking', 'branding',
        'growth', 'strategy', 'client', 'business', 'revenue', 'team', 'communication',
        'linkedin', 'profile', 'content', 'engagement', 'authority', 'expertise',
        'personal brand', 'thought leadership', 'industry expert', 'professional development'
      ];
      
      topicKeywords.forEach(keyword => {
        if (contentLower.includes(keyword)) {
          keywords.push(keyword);
          if (!topics.includes(keyword)) topics.push(keyword);
        }
      });
      
      return { topics, strategies: strategies.slice(0, visualCount), keywords };
    };
    
    const contentAnalysis = extractContentStrategy(postContent);
    console.log('Content analysis results:', contentAnalysis);

    // Enhanced prompt generation with professional LinkedIn expert approach
    const promptGenerationRequest = `
    As a world-class LinkedIn marketing expert, analyze this post content and create ${visualCount} highly-specific, engaging visual prompts for ${visualStyle} style LinkedIn carousel images.

    POST CONTENT TO ANALYZE:
    "${postContent}"

    EXTRACTED CONTENT ANALYSIS:
    - Content Type: ${contentType}
    - Visual Style: ${visualStyle}
    - Primary Topic: ${primaryTopic}
    - Key Points: ${postAnalysis?.key_points?.join(', ') || 'Extract from content'}
    - Extracted Topics: ${contentAnalysis.topics.join(', ')}
    - Specific Strategies Found: ${contentAnalysis.strategies.join(' | ')}
    - Content Keywords: ${contentAnalysis.keywords.join(', ')}

    YOUR MISSION:
    Study this post content like a LinkedIn expert and create visuals that:
    1. DIRECTLY relate to the specific strategies mentioned (use exact strategy text as titles)
    2. Use professional business imagery that LinkedIn users recognize
    3. Include relevant icons and visual metaphors for each concept
    4. Create scroll-stopping visuals that drive engagement
    5. Match LinkedIn's professional aesthetic perfectly
    6. Use the extracted strategies as visual titles when possible

    CRITICAL REQUIREMENTS:
    - Extract EXACT topics from the post (e.g., "High-Paying Clients", "LinkedIn Strategy", "Profile Optimization")
    - Create titles that match the specific tips/strategies mentioned
    - Generate imagePrompts with precise business imagery for each concept
    - Use LinkedIn corporate blue (#0077B5) and professional color schemes
    - Each visual must tell the story of that specific tip/strategy

    SMART TITLE GENERATION RULES:
    - Use extracted strategies as titles when available: ${contentAnalysis.strategies.slice(0, visualCount).map((s, i) => `${i + 1}. "${s}"`).join(', ')}
    - If no strategies found, create topic-specific titles using extracted keywords
    - Make titles actionable and specific to the post content
    - Each title must relate directly to a specific point mentioned in the post

    REQUIRED JSON FORMAT:
    {
      "visualPrompts": [
        {
          "order": 1,
          "title": "[Use extracted strategy text or create specific title from post content - NO generic titles]",
          "imagePrompt": "Professional LinkedIn-style infographic with corporate blue (#0077B5) colors, showing [specific business concept from post], modern clean design, professional icons for [specific strategy from post], high-quality business photography style, thought leadership aesthetic, visual elements representing: [exact concept from post content]",
          "textOverlay": "[Key phrase directly extracted from the original post content]",
          "designNotes": "LinkedIn corporate branding, professional typography, mobile-optimized design, content-specific imagery"
        }
      ]
    }

    EXAMPLES OF CONTENT-SPECIFIC IMAGERY:
    - If post mentions "Profile Optimization" → Show LinkedIn profile interface, professional headshots, optimization graphics
    - If post mentions "Client Acquisition" → Show business handshakes, deal closing imagery, growth charts
    - If post mentions "Content Strategy" → Show content creation, publishing workflow, engagement metrics
    - If post mentions "Networking" → Show professional networking events, connection building, relationship graphics

    VISUAL PROMPT REQUIREMENTS:
    - Each imagePrompt must be 300-500 characters with specific business imagery
    - Avoid generic stock photos - use concept-specific professional visuals
    - Include relevant business icons and infographic elements
    - Mention specific colors, layouts, and LinkedIn aesthetic
    - Focus on visual storytelling that matches the post content exactly

    Generate exactly ${visualCount} visuals that a LinkedIn marketing expert would create. Return ONLY the JSON object.
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
      
      // Fallback: Try to create a simple structure based on the post content
      console.log('Attempting fallback prompt generation...');
      
      // Extract key words from post content for more relevant fallback
      const contentWords = postContent.toLowerCase();
      let fallbackTitle = "Professional LinkedIn Post";
      let fallbackImagePrompt = "Professional LinkedIn infographic with blue corporate colors (#0077B5), clean typography, modern business icons";
      let fallbackTextOverlay = "Professional Content";
      
      // Make fallback more content-specific using smart content analysis
      const contentAnalysis = extractContentStrategy(postContent);
      
      if (contentAnalysis.strategies.length > 0) {
        fallbackTitle = contentAnalysis.strategies[0];
        fallbackImagePrompt += `, visual representation of: ${contentAnalysis.strategies[0]}`;
        fallbackTextOverlay = contentAnalysis.strategies[0].substring(0, 50);
      } else if (contentWords.includes('sales')) {
        fallbackTitle = "Sales Strategy";
        fallbackImagePrompt += ", sales performance charts, business growth icons";
        fallbackTextOverlay = "Sales Excellence";
      } else if (contentWords.includes('marketing')) {
        fallbackTitle = "Marketing Insights";
        fallbackImagePrompt += ", marketing funnel diagrams, digital marketing icons";
        fallbackTextOverlay = "Marketing Success";
      } else if (contentWords.includes('leadership')) {
        fallbackTitle = "Leadership Development";
        fallbackImagePrompt += ", leadership symbols, team management icons";
        fallbackTextOverlay = "Leadership Excellence";
      } else if (contentWords.includes('productivity')) {
        fallbackTitle = "Productivity Tips";
        fallbackImagePrompt += ", productivity charts, time management icons";
        fallbackTextOverlay = "Boost Productivity";
      } else if (contentWords.includes('network')) {
        fallbackTitle = "Networking Strategy";
        fallbackImagePrompt += ", networking diagrams, connection icons";
        fallbackTextOverlay = "Build Your Network";
      } else {
        // Use primary topic if available
        if (primaryTopic && primaryTopic !== 'professional development') {
          fallbackTitle = primaryTopic.charAt(0).toUpperCase() + primaryTopic.slice(1);
          fallbackImagePrompt += `, ${primaryTopic} related icons and imagery`;
          fallbackTextOverlay = fallbackTitle;
        }
      }
      
      visualPrompts = {
        visualPrompts: [{
          order: 1,
          title: fallbackTitle,
          imagePrompt: fallbackImagePrompt + ", thought leadership visual elements",
          textOverlay: fallbackTextOverlay,
          designNotes: "Corporate blue and white color scheme, professional fonts"
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