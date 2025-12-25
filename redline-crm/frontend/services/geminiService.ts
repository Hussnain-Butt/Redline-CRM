import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  // Access environment variable directly via import.meta.env for Vite compatibility
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '';
  if (!apiKey) {
    throw new Error('API key is missing. Please provide a valid API key.');
  }
  return new GoogleGenAI({ apiKey });
};

export const summarizeTranscript = async (transcript: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Summarize the following call transcript into 3 concise bullet points focusing on action items and customer sentiment:\n\n${transcript}`,
    });
    return response.text || "No summary available.";
  } catch (error) {
    console.error("AI Summary Error:", error);
    return "Failed to generate summary. Please check API Key.";
  }
};

export const generateEmailDraft = async (contactName: string, topic: string, tone: string = 'professional'): Promise<{subject: string, body: string}> => {
  try {
    const ai = getAI();
    const prompt = `Write a ${tone} email to ${contactName} regarding "${topic}". Return the response in JSON format with "subject" and "body" fields.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING }
          }
        }
      }
    });

    const jsonStr = response.text || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Email Draft Error:", error);
    return { subject: "Error", body: "Could not generate draft." };
  }
};

export const analyzeSentiment = async (text: string): Promise<'positive' | 'neutral' | 'negative'> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the sentiment of this text: "${text}". Return only one word: "positive", "neutral", or "negative".`,
    });
    const sentiment = response.text?.toLowerCase().trim();
    if (sentiment?.includes('positive')) return 'positive';
    if (sentiment?.includes('negative')) return 'negative';
    return 'neutral';
  } catch (error) {
    return 'neutral';
  }
};
