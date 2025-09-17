import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Log request for debugging
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment variables check:', {
      hasGeminiKey: !!geminiApiKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });

    if (!geminiApiKey || !supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', {
        geminiApiKey: geminiApiKey ? 'present' : 'missing',
        supabaseUrl: supabaseUrl ? 'present' : 'missing', 
        supabaseServiceKey: supabaseServiceKey ? 'present' : 'missing'
      });
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error - missing environment variables',
          success: false 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { postId, userId, visualPrompts, jobId, postContent } = await req.json();
    
    if (!postId || !userId || !visualPrompts || !Array.isArray(visualPrompts)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Starting visual generation for post: ${postId}, job: ${jobId}`);
    console.log('Visual prompts received:', visualPrompts.length, 'prompts');
    console.log('Post content available:', !!postContent);
    console.log('First prompt sample:', visualPrompts[0]);

    // Create database entries for each visual
    const visualEntries = visualPrompts.map((prompt, index) => ({
      post_id: postId,
      user_id: userId,
      prompt_used: prompt.imagePrompt,
      generation_order: prompt.order || index + 1,
      status: 'generating'
    }));

    const { data: createdVisuals, error: insertError } = await supabase
      .from('generated_visuals')
      .insert(visualEntries)
      .select();

    if (insertError) {
      console.error('Error creating visual entries:', insertError);
      throw new Error('Failed to create visual entries');
    }

    // Generate visuals using Gemini (or placeholder for now)
    const results: any[] = [];
    
    for (let i = 0; i < visualPrompts.length; i++) {
      const prompt = visualPrompts[i];
      const visualId = createdVisuals[i].id;
      
      try {
        console.log(`Generating visual ${i + 1}/${visualPrompts.length}: ${prompt.title}`);
        
        // Update status to generating
        await supabase
          .from('generated_visuals')
          .update({ status: 'generating' })
          .eq('id', visualId);
        
        // Generate image using Gemini 2.5 Flash Image (Nano Banana) with new SDK
        let imageUrl: string | null = null;
        
        try {
          const genAI = new GoogleGenerativeAI(geminiApiKey);
          
          console.log(`Generating REAL image for visual ${i + 1} with Gemini Nano Banana`);
          
          // Enhanced prompt that includes post content context for better relevance
          let enhancedPrompt = prompt.imagePrompt;
          if (postContent) {
            enhancedPrompt = `Create a professional LinkedIn carousel image: ${prompt.imagePrompt}

Based on this post content: "${postContent.substring(0, 200)}..."

Make the image directly relate to the specific strategies and concepts mentioned in the post. Use professional business aesthetics with LinkedIn blue (#0077B5) colors, modern typography, and clean design suitable for LinkedIn professionals.`;
          }
          
          console.log('Enhanced prompt for Gemini:', enhancedPrompt.substring(0, 150) + '...');
          
          // Use the correct model for image generation
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });
          
          const result = await model.generateContent([enhancedPrompt]);
          const response = await result.response;
          
          console.log('Gemini API response received for visual', i + 1);
          
          // Check if we got image data in the response
          if (response.candidates && response.candidates[0] && response.candidates[0].content) {
            const parts = response.candidates[0].content.parts;
            
            for (const part of parts) {
              if (part.inlineData && part.inlineData.data) {
                // Convert base64 to blob and upload to storage
                const base64Data = part.inlineData.data;
                const mimeType = part.inlineData.mimeType || 'image/png';
                
                console.log(`Received image data of type: ${mimeType}, size: ${base64Data.length} characters`);
                
                // Upload to Supabase Storage
                const fileName = `visual_${postId}_${visualId}_${Date.now()}.png`;
                
                // Convert base64 to Uint8Array for Deno
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let j = 0; j < binaryString.length; j++) {
                  bytes[j] = binaryString.charCodeAt(j);
                }
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                  .from('generated-visuals')
                  .upload(fileName, bytes, {
                    contentType: mimeType,
                    upsert: true
                  });
                
                if (uploadError) {
                  console.error('Error uploading image to storage:', uploadError);
                  throw new Error('Failed to upload generated image');
                }
                
                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                  .from('generated-visuals')
                  .getPublicUrl(fileName);
                
                imageUrl = publicUrl;
                console.log(`REAL IMAGE generated and uploaded successfully: ${imageUrl}`);
                break;
              }
            }
          }
          
          if (!imageUrl) {
            console.warn('No image data received from Gemini API - this should not happen with correct API usage');
            throw new Error('No image generated by Gemini API');
          }
          
        } catch (geminiError) {
          console.error('Gemini API error - REAL image generation failed:', geminiError);
          console.error('Error details:', geminiError.message);
          
          // If real image generation fails, we should fail the visual
          throw new Error(`Failed to generate real image with Gemini: ${geminiError.message}`);
        }
        
        // Update the visual entry with the generated image
        const { error: updateError } = await supabase
          .from('generated_visuals')
          .update({
            image_url: imageUrl,
            status: 'completed'
          })
          .eq('id', visualId);

        if (updateError) {
          console.error(`Error updating visual ${visualId}:`, updateError);
          throw new Error(`Failed to update visual ${visualId}`);
        }

        results.push({
          id: visualId,
          order: prompt.order || i + 1,
          title: prompt.title,
          imageUrl: imageUrl,
          prompt: prompt.imagePrompt,
          textOverlay: prompt.textOverlay,
          status: 'completed'
        });

        // Small delay between generations to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (visualError) {
        console.error(`Error generating visual ${i + 1}:`, visualError);
        
        // Mark visual as failed
        await supabase
          .from('generated_visuals')
          .update({ status: 'failed' })
          .eq('id', visualId);

        results.push({
          id: visualId,
          order: prompt.order || i + 1,
          title: prompt.title,
          status: 'failed',
          error: visualError.message
        });
      }
    }

    // Track usage
    await supabase
      .from('usage_tracking')
      .insert({
        user_id: userId,
        action_type: 'visual_generation',
        credits_used: visualPrompts.length
      });

    // Update user credits
    await supabase.rpc('decrement_credits', {
      user_id: userId,
      credit_amount: visualPrompts.length
    });

    console.log('Visual generation completed');

    return new Response(
      JSON.stringify({ 
        success: true,
        jobId,
        results,
        totalGenerated: results.filter(r => r.status === 'completed').length,
        totalFailed: results.filter(r => r.status === 'failed').length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-visuals function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate visuals',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});