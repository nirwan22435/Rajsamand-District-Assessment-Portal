import { GoogleGenAI, Type } from '@google/genai';

export const handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const params = JSON.parse(event.body || '{}');
    const { fileData, mimeType, rawText, subject, targetBlock, defaultTimeLimit } = params;

    if (!fileData && !rawText) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Please upload a PDF, image, document or enter question paper text.' }),
      };
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'GEMINI_API_KEY is not configured on the server environment.' }),
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are an expert Educational Assessment Specialist for Rajsamand District Education Department, Rajasthan.
Your task is to analyze the uploaded question paper (PDF document, image, or text) and convert all questions into a clean, well-structured Multiple Choice Question (MCQ) format.
Rules:
1. Extract every valid question accurately.
2. Ensure each question has exactly 4 distinct options (A, B, C, D). If options are missing in the raw text, generate plausible educational options based on standard syllabus.
3. Identify or infer the correct option index (0 for Option A, 1 for Option B, 2 for Option C, 3 for Option D).
4. Provide a short, informative explanation for why the answer is correct.
5. Provide a realistic title, estimated duration in minutes (e.g. 30, 45, 60), total marks, and subject classification.`;

    const promptText = `Convert the following test paper content into structured editable MCQs for Rajsamand District Assessment Portal.
Subject: ${subject || 'General Assessment'}
Target District Block: ${targetBlock || 'District-Wide (Rajsamand)'}
Default Time Limit: ${defaultTimeLimit || 30} minutes

Raw Text Content (if provided):
${rawText || 'N/A'}`;

    let contents;
    if (fileData) {
      const cleanBase64 = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
      contents = {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || 'application/pdf',
            },
          },
          {
            text: promptText,
          },
        ],
      };
    } else {
      contents = promptText;
    }

    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    let response = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                testTitle: { type: Type.STRING, description: 'Title of the assessment paper' },
                subject: { type: Type.STRING, description: 'Subject or category name' },
                timeLimitMinutes: { type: Type.INTEGER, description: 'Recommended test duration in minutes' },
                totalMarks: { type: Type.INTEGER, description: 'Total maximum marks for the test' },
                passingMarks: { type: Type.INTEGER, description: 'Passing threshold marks' },
                instructions: { type: Type.STRING, description: 'General instructions for candidates' },
                questions: {
                  type: Type.ARRAY,
                  description: 'List of parsed MCQ questions',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING, description: 'Unique question identifier' },
                      questionText: { type: Type.STRING, description: 'Question stem / problem description' },
                      options: {
                        type: Type.ARRAY,
                        description: 'Array of exactly 4 choices',
                        items: { type: Type.STRING },
                      },
                      correctOptionIndex: {
                        type: Type.INTEGER,
                        description: '0-based index of the correct answer (0, 1, 2, or 3)',
                      },
                      explanation: { type: Type.STRING, description: 'Educational solution explanation' },
                      marks: { type: Type.INTEGER, description: 'Marks allocated for this question' },
                    },
                    required: ['questionText', 'options', 'correctOptionIndex', 'explanation'],
                  },
                },
              },
              required: ['testTitle', 'subject', 'timeLimitMinutes', 'totalMarks', 'questions'],
            },
          },
        });
        if (response) break;
      } catch (err) {
        lastError = err;
        console.warn(`[Netlify parse-test-paper] Model ${modelName} attempt failed:`, err);
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('All Gemini AI model attempts failed to respond.');
    }

    const parsedJson = JSON.parse(response.text);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: parsedJson }),
    };
  } catch (err) {
    console.error('Error in netlify parse-test-paper function:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Failed to extract questions from uploaded file.' }),
    };
  }
};
