import Anthropic from "@anthropic-ai/sdk";
import { executeTool } from "./executeTool";

export async function runSubAgent(
    systemPrompt: string,
    userMessage: string,
    tool: Anthropic.Tool,
    anthropic: Anthropic
  ): Promise<unknown> {
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: userMessage },
    ];
  
    // Max 3 iterations to prevent runaway credit usage if an LLM get confused
    const maxLoops = 3; 

    for (let i = 0; i < maxLoops; i++) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        system: systemPrompt,
        tools: [tool],
        messages,
      });

      console.log(`[${tool.name}] API Request ID: ${response._request_id} | Stop Reason: ${response.stop_reason}`);
  
      // Scenario A: Claude wants to use a tool
      if (response.stop_reason === "tool_use") {
        // Essential: You must push Claude's tool_use request to history first
        messages.push({ role: "assistant", content: response.content });
  
        const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
          response.content
            .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")
            .map(async (b) => ({
              type: "tool_result" as const,
              tool_use_id: b.id,
              content: await executeTool(b.name, b.input as Record<string, unknown>),
            }))
        );
  
        // Append results as a user turn and continue the loop
        messages.push({ role: "user", content: toolResults });
        continue;
      }
  
      // Scenario B: Claude is completely finished and returning the final processed answer
      if (response.stop_reason === "end_turn") {
        // Find the text or structured blocks from the CURRENT fresh response
        const textBlock = response.content.find((b) => b.type === "text");
        
        if (textBlock && "text" in textBlock) {
          try {
            return JSON.parse(textBlock.text);
          } catch {
            return textBlock.text; // Return raw string if it's not JSON
          }
        }
        
        // If it responded directly with a structure or content blocks
        return response.content; 
      }

      break;
    }
    return null;
}