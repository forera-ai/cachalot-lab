import { DEFAULT_ENDPOINT } from './runtime'

export type ApiExampleLanguage = 'curl' | 'python' | 'javascript'

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'"'"'`)}'`
}

export function apiExamples(endpoint: string | null, modelId: string | null) {
  const baseUrl = (endpoint || DEFAULT_ENDPOINT).replace(/\/+$/, '')
  const model = modelId || 'your-model-id'
  const url = `${baseUrl}/v1/chat/completions`
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
      'import json',
      'import os',
      'import urllib.request',
      '',
      `url = ${JSON.stringify(url)}`,
      `payload = {"model": ${JSON.stringify(model)}, "messages": [{"role": "user", "content": "Hello"}]}`,
      'headers = {"Content-Type": "application/json"}',
      'if api_key := os.getenv("CACHALOT_API_KEY"):',
      '    headers["Authorization"] = f"Bearer {api_key}"',
      'request = urllib.request.Request(',
      '    url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST"',
      ')',
      'with urllib.request.urlopen(request) as response:',
      '    print(json.dumps(json.load(response), indent=2))',
    ].join('\n'),
    javascript: [
      '// Node.js 18+ (save as example.mjs)',
      `const url = ${JSON.stringify(url)};`,
      `const model = ${JSON.stringify(model)};`,
      'const headers = { "Content-Type": "application/json" };',
      'if (process.env.CACHALOT_API_KEY) {',
      '  headers.Authorization = `Bearer ${process.env.CACHALOT_API_KEY}`;',
      '}',
      'const response = await fetch(url, {',
      '  method: "POST",',
      '  headers,',
      '  body: JSON.stringify({ model, messages: [{ role: "user", content: "Hello" }] }),',
      '});',
      'if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);',
      'console.log(await response.json());',
    ].join('\n'),
  } satisfies Record<ApiExampleLanguage, string>
}
