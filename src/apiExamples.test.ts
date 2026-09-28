import { describe, expect, it } from 'vitest'

import { apiExamples } from './apiExamples'

describe('API examples', () => {
  it('uses the connected endpoint and model in each client', () => {
    const examples = apiExamples('http://127.0.0.1:9010/', 'my-model')

    for (const example of Object.values(examples)) {
      expect(example).toContain('http://127.0.0.1:9010/v1/chat/completions')
      expect(example).toContain('my-model')
      expect(example).toContain('CACHALOT_API_KEY')
    }
    expect(examples.curl).toContain(`-d '{"model":"my-model"`)
  })

  it('keeps quoted model IDs inside the curl JSON argument', () => {
    const model = `model'; echo injected; # "quoted"`
    const examples = apiExamples(null, model)

    expect(examples.curl).toContain(
      `-d '{"model":"model'"'"'; echo injected; # \\"quoted\\""`,
    )
    expect(examples.python).toContain(JSON.stringify(model))
    expect(examples.javascript).toContain(JSON.stringify(model))
  })
})
