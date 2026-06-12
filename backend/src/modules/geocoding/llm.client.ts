import { config } from '../../app/config/index.js';
import { logger } from '../../shared/logger/logger.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * OpenAI-compatible chat completion (hackathon LiteLLM gateway).
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const { llmBaseUrl, llmApiKey, llmModel } = config.geocoding;

  if (!llmApiKey) {
    throw new Error('GEOCODING_LLM_API_KEY is not set');
  }

  const url = `${llmBaseUrl.replace(/\/$/, '')}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${llmApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: llmModel,
      messages,
      temperature: options?.temperature ?? 0.1,
      max_tokens: options?.maxTokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error('GeocodingLLM', `API error ${response.status}`, body.slice(0, 200));
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('LLM returned empty content');
  }

  return content.trim();
}
