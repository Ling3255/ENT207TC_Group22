import OpenAI from "openai";

const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL || "https://api.deepseek.com";

let _client: OpenAI | null = null;

export function getAIConfig() {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || "https://api.deepseek.com";
  const model = process.env.OPENAI_MODEL || "deepseek-chat";
  return { apiKey, baseURL, model };
}

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    if (!apiKey) {
      throw new Error(
        "DEEPSEEK_API_KEY or OPENAI_API_KEY environment variable is not set"
      );
    }
    _client = new OpenAI({
      apiKey,
      baseURL,
      dangerouslyAllowBrowser: false,
    });
  }
  return _client;
}

export async function* chatCompletionStream(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): AsyncGenerator<string> {
  const client = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || options?.model || "deepseek-chat";

  const stream = await client.chat.completions.create({
    model,
    messages,
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 2048,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) yield content;
  }
}

export async function chatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
) {
  const client = getOpenAIClient();
  const model =
    process.env.OPENAI_MODEL || options?.model || "deepseek-chat";
  const response = await client.chat.completions.create({
    model,
    messages,
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 2048,
  });

  const choice = response.choices[0];
  console.log(
    "[chatCompletion] model:",
    model,
    "finish_reason:",
    choice?.finish_reason,
    "content:",
    JSON.stringify(choice?.message?.content)?.slice(0, 200)
  );

  if (choice?.finish_reason === "content_filter") {
    throw new Error("内容被模型过滤，请尝试简化简历内容");
  }
  if (!choice?.message?.content) {
    throw new Error(
      "AI 未返回任何内容（finish_reason: " + choice?.finish_reason + "）"
    );
  }
  return choice.message.content;
}
