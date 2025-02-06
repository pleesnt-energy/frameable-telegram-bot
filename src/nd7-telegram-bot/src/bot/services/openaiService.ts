import { OpenAI } from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

/**
 * Communicate with OpenAI Chat API using the current chat history.
 * @param chatHistory Array of [role, content] tuples (e.g., [['user', 'message'], ['assistant', 'response']]).
 * @returns The assistant's response text.
 */
export async function fetchOpenAIResponse(chatHistory: [role: string, content: string][]): Promise<string> {
  const requestBody = {
    model: "gpt-4", // Use latest model
    messages: chatHistory.map(([role, content]) => ({ role, content })), // Map tuples to API format
  };

//   const response = await openai.chat.completions.create(requestBody);

//   // Extract the assistant's response
//   return response.data.choices[0].message.content;
  return "yayb";
}