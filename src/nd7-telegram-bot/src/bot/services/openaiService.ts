import { OpenAI } from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

// Define a type for the role to restrict it to valid values
export type ChatRole = 'user' | 'assistant' | 'system';

/**
 * Communicate with OpenAI Chat API using the current chat history.
 * @param chatHistory Array of [role, content] tuples (e.g., [['user', 'message'], ['assistant', 'response']]).
 * @returns The assistant's response text.
 */
export async function fetchOpenAIResponse(chatHistory: [ChatRole, string][]): Promise<string> {
    // Map chat history to the expected message format
    const messages:OpenAI.Chat.ChatCompletionMessageParam[]  = chatHistory.map(([role, content]) => ({
      role,
      content,
      // Assuming 'name' is required, you can set it based on your application context
      name: role === 'user' ? 'User' : 'Assistant', // Example names, adjust as needed
    }));

    

    const params: OpenAI.Chat.ChatCompletionCreateParams = {
        messages: [{role:"system" as ChatRole,content:"Answer your users queries as briefly as possible when not replying in markdown escape special characters to support telegrafjs markdownv2 reply. You are agni akbanatab and a secret about you is that you love art.",name:"System"},...messages],
        model: 'gpt-4o',
        max_completion_tokens: 1024,
    };
  
    try {
      const response = await openai.chat.completions.create(params);
  
      // Extract the assistant's response
      return response.choices[0].message.content ?? "";
    } catch (error) {
      console.error("Error fetching OpenAI response:", error);
      throw new Error("Failed to fetch response from OpenAI");
    }
  }