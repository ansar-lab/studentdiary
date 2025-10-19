import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key and remove any quotes that might be included from .env file
const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.toString().replace(/^["']|["']$/g, '');
if (!apiKey) {
  console.error('VITE_GEMINI_API_KEY is not defined. Please set it in your .env file.');
}

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

try {
  if (apiKey) {
    console.log('Initializing Gemini API with key:', apiKey.substring(0, 5) + '...');
    genAI = new GoogleGenerativeAI(apiKey);
    // Use Gemini 2.5 Flash model
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }
} catch (error) {
  console.error('Failed to initialize Gemini API:', error);
}

export async function getAISuggestions(context: { studentId: string; sessionId: string; subject?: string }) {
  const prompt = `Based on the student's attendance record for session ${context.sessionId} in subject ${context.subject || 'unknown'}, provide personalized suggestions to improve their learning or attendance habits. Keep it concise and helpful.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return { message: text };
  } catch (error) {
    console.error('Gemini API error:', error);
    return { message: 'Unable to generate suggestions at this time. Please check your connection.' };
  }
}

export async function chatWithAI(message: string) {
  const prompt = `You are a helpful AI assistant for students in a study nest app. Respond to: ${message}`;

  // Check if model is initialized
  if (!model) {
    console.error('Gemini model not initialized');
    return { 
      response: 'The AI service is currently unavailable. Please check your API key configuration in the .env file and ensure it is valid.',
      error: true 
    };
  }

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return { response: text };
  } catch (error: any) {
    console.error('Gemini API error:', error);
    // Provide more specific error messages
    if (error.message?.includes('API_KEY') || error.message?.includes('key')) {
      return { 
        response: 'There seems to be an issue with the API key. Please check that your VITE_GEMINI_API_KEY in the .env file is valid and has no restrictions.',
        error: true 
      };
    } else if (error.message?.includes('quota')) {
      return { 
        response: 'API quota exceeded. Please try again later or check your usage limits.',
        error: true 
      };
    } else if (error.message?.includes('network')) {
      return { 
        response: 'Network error. Please check your internet connection.',
        error: true 
      };
    } else {
      return { 
        response: 'Sorry, I encountered an error. Please try again later.',
        error: true 
      };
    }
  }
}
