import { DEFAULT_ENDPOINT } from './runtime'

export type ApiExampleLanguage = 'curl' | 'python' | 'javascript'

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'"'"'`)}'`
}

export function apiExamples(endpoint: string | null, modelId: string | null) {
  const baseUrl = (endpoint || DEFAULT_ENDPOINT).replace(/\/+$/, '')
  const model = modelId || 'your-model-id'
  const url = `${baseUrl}/v1/chat/completions`
  const apiBaseUrl = `${baseUrl}/v1`
  const payload = {
    model,
    messages: [{ role: 'user', content: 'Hello' }],
  }

  return {
    curl: [
      '# If needed, add -H "Authorization: Bearer $CACHALOT_API_KEY".',
      `curl ${shellQuote(url)} \\`,
      `  -H 'Content-Type: application/json' \\`,
      `  -d ${shellQuote(JSON.stringify(payload))}`,
    ].join('\n'),
    python: [
      '# Install once: pip install openai',
      'import os',
      'from openai import OpenAI',
      '',
      'client = OpenAI(',
      `    base_url=${JSON.stringify(apiBaseUrl)},`,
      '    api_key=os.getenv("CACHALOT_API_KEY", "local"),',
      ')',
      'response = client.chat.completions.create(',
      `    model=${JSON.stringify(model)},`,
      '    messages=[{"role": "user", "content": "Hello"}],',
      ')',
      'print(response.choices[0].message.content)',
    ].join('\n'),
    javascript: [
      '// Install once: npm install openai (save as example.mjs)',
      'import OpenAI from "openai";',
      '',
      'const client = new OpenAI({',
      `  baseURL: ${JSON.stringify(apiBaseUrl)},`,
      '  apiKey: process.env.CACHALOT_API_KEY ?? "local",',
      '});',
      'const response = await client.chat.completions.create({',
      `  model: ${JSON.stringify(model)},`,
      '  messages: [{ role: "user", content: "Hello" }],',
      '});',
      'console.log(response.choices[0].message.content);',
    ].join('\n'),
  } satisfies Record<ApiExampleLanguage, string>
}
