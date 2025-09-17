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
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!geminiApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { postId, userId, visualPrompts, jobId } = await req.json();
    
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
    const results = [];
    
    for (let i = 0; i < visualPrompts.length; i++) {
      const prompt = visualPrompts[i];
      const visualId = createdVisuals[i].id;
      
      try {
        console.log(`Generating visual ${i + 1}/${visualPrompts.length}: ${prompt.title}`);
        
        // For now, we'll use a mock image service
        // In production, you would integrate with Gemini's image generation API
        const mockImageUrl = `https://picsum.photos/1080/1080?random=${Date.now()}-${i}`;
        
        // Update the visual entry with the generated image
        const { error: updateError } = await supabase
          .from('generated_visuals')
          .update({
            image_url: mockImageUrl,
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
          imageUrl: mockImageUrl,
          prompt: prompt.imagePrompt,
          textOverlay: prompt.textOverlay,
          status: 'completed'
        });

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));

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