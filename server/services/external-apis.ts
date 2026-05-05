/**
 * External API Integration Service
 * Handles integration with ElevenLabs, image generation, and other external services
 */

import axios from 'axios';

// ElevenLabs Configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Image Generation Configuration (using Manus built-in)
const IMAGE_GEN_API_URL = process.env.BUILT_IN_FORGE_API_URL || '';
const IMAGE_GEN_API_KEY = process.env.BUILT_IN_FORGE_API_KEY || '';

/**
 * Generate narration using ElevenLabs API
 * @param text - Text to convert to speech
 * @param voiceId - ElevenLabs voice ID (default: "21m00Tcm4TlvDq8ikWAM" - Rachel)
 * @returns Audio URL or buffer
 */
export async function generateNarration(
  text: string,
  voiceId: string = '21m00Tcm4TlvDq8ikWAM'
): Promise<{ audioUrl: string; audioBuffer: Buffer }> {
  try {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    const response = await axios.post(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    const audioBuffer = Buffer.from(response.data);

    // In production, you would upload this to S3 and get a URL
    // For now, we return a placeholder URL
    const audioUrl = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;

    return { audioUrl, audioBuffer };
  } catch (error) {
    console.error('Error generating narration:', error);
    throw new Error('Failed to generate narration');
  }
}

/**
 * Generate storyboard image using Manus image generation API
 * @param prompt - Image generation prompt
 * @param referenceImageUrl - Optional reference image URL for consistency
 * @returns Image URL
 */
export async function generateStoryboardImage(
  prompt: string,
  referenceImageUrl?: string
): Promise<string> {
  try {
    if (!IMAGE_GEN_API_URL || !IMAGE_GEN_API_KEY) {
      throw new Error('Image generation API not configured');
    }

    // Using the built-in Manus image generation API
    const payload: any = {
      prompt: prompt,
      size: '1024x576', // 16:9 aspect ratio for video
      quality: 'hd',
    };

    if (referenceImageUrl) {
      payload.reference_image = referenceImageUrl;
    }

    const response = await axios.post(
      `${IMAGE_GEN_API_URL}/image/generate`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${IMAGE_GEN_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data?.url) {
      return response.data.url;
    }

    throw new Error('No image URL in response');
  } catch (error) {
    console.error('Error generating storyboard image:', error);
    throw new Error('Failed to generate storyboard image');
  }
}

/**
 * Get available ElevenLabs voices
 * @returns List of available voices
 */
export async function getAvailableVoices(): Promise<any[]> {
  try {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    const response = await axios.get(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    return response.data.voices || [];
  } catch (error) {
    console.error('Error fetching voices:', error);
    return [];
  }
}

/**
 * Validate external API credentials
 * @returns Object with validation status for each service
 */
export async function validateExternalAPIs(): Promise<{
  elevenlabs: boolean;
  imageGeneration: boolean;
}> {
  const result = {
    elevenlabs: false,
    imageGeneration: false,
  };

  // Check ElevenLabs
  if (ELEVENLABS_API_KEY) {
    try {
      const voices = await getAvailableVoices();
      result.elevenlabs = voices.length > 0;
    } catch (error) {
      console.warn('ElevenLabs validation failed:', error);
    }
  }

  // Check Image Generation
  if (IMAGE_GEN_API_URL && IMAGE_GEN_API_KEY) {
    result.imageGeneration = true; // Manus built-in is always available
  }

  return result;
}

/**
 * Mock video generation for development
 * In production, this would call Kling or similar API
 * @param prompt - Video generation prompt
 * @param durationSeconds - Duration of the video
 * @param referenceImageUrl - Optional reference image for consistency
 * @returns Video URL
 */
export async function generateVideoClip(
  prompt: string,
  durationSeconds: number,
  referenceImageUrl?: string
): Promise<string> {
  try {
    // TODO: Integrate with Kling API or similar video generation service
    // For now, return a placeholder
    console.log('Video generation requested:', {
      prompt,
      durationSeconds,
      referenceImageUrl,
    });

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Return a placeholder video URL
    return `https://placeholder-video.example.com/video-${Date.now()}.mp4`;
  } catch (error) {
    console.error('Error generating video clip:', error);
    throw new Error('Failed to generate video clip');
  }
}
