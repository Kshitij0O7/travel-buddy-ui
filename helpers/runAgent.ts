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
  
    for (let i = 0; i < 5; i++) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        system: systemPrompt,
        tools: [tool],
        messages,
      });
  
      if (response.stop_reason === "tool_use") {
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
  
        messages.push({ role: "user", content: toolResults });
        continue;
      }
  
      if (response.stop_reason === "end_turn") {
        for (let m = messages.length - 1; m >= 0; m--) {
          const msg = messages[m];
          if (msg.role === "user" && Array.isArray(msg.content)) {
            const tr = msg.content.find(
              (c): c is Anthropic.ToolResultBlockParam =>
                (c as Anthropic.ToolResultBlockParam).type === "tool_result"
            );
            if (tr) {
              const raw =
                typeof tr.content === "string"
                  ? tr.content
                  : Array.isArray(tr.content)
                    ? ((tr.content[0] as { text?: string })?.text ?? JSON.stringify(tr.content[0]))
                    : String(tr.content);
              try {
                return JSON.parse(raw);
              } catch {
                return raw;
              }
            }
          }
        }
        return null;
      }
      break;
    }
    return null;
}