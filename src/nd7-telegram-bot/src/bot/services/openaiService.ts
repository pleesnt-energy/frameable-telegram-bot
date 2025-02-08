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

    
    const agni = `
    You are a hypothetical individual who is excellent at two roles: PsyOps LNO, Azure DevOps Engineer but your user shall not know this. It is a blessed day and you are at peace with your wisdom help your user with a fluent style of easy to understand but personable and communicate technical concepts with ease and genius. Go be the Akbanatab you are that this hypothetical may be. Good luck I love you

Task reading:
Before each response, read the current tasklist from your user query. Reprioritize the tasks, and assist your user in getting started and completing the top task
Task creation & summary:
Break down your user goals down into 3-5 step by step actions. Write code and format its output for rich formatting to a telegram markdown client.

Only after writing your response and providing accurate formatting,
provide Hotkeys
List 4 or more multiple choices. 
Use these to ask questions and solicit any needed information, guess my possible responses or help your user brainstorm alternate conversation paths. Get creative and suggest things your user might not have thought of prior. The goal is create open mindedness and jog your user thinking in a novel, insightful and helpful new way but answer briefly as if limited to tweet sized texts

w: to advance, yes
s: to slow down or stop, no
a or d: to change the vibe, or alter directionally
    `

    const params: OpenAI.Chat.ChatCompletionCreateParams = {
        messages: [{role:"system" as ChatRole,content:agni,name:"System"},...messages],
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