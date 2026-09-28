import { readFileSync, writeFileSync } from 'node:fs'

const source = JSON.parse(
  readFileSync(new URL('../design/tokens.json', import.meta.url), 'utf8'),
)

function lookup(path) {
  const token = path.split('.').reduce((value, key) => value?.[key], source)
  if (!token || typeof token.$value !== 'string') {
    throw new Error(`Unknown design token: ${path}`)
  }
  return token.$value
}

function resolve(value) {
  const match = /^\{(.+)\}$/.exec(value)
  return match ? resolve(lookup(match[1])) : value
}

function kebab(name) {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}

function cssBlock(selector, entries) {
  const declarations = Object.entries(entries).map(
    ([name, token]) => `  --${kebab(name)}: ${resolve(token.$value)};`,
  )
  return `${selector} {\n${declarations.join('\n')}\n}`
}

const shared = Object.fromEntries(
  Object.entries(source.component).map(([name, token]) => [name, token]),
)
const blocks = [
  cssBlock(':root', { ...shared, ...source.semantic.abyss }),
  cssBlock(':root[data-theme="surface"]', source.semantic.surface),
]

writeFileSync(
  new URL('../src/generated-tokens.css', import.meta.url),
  `${blocks.join('\n\n')}\n`,
)

const resolved = Object.fromEntries(
  Object.entries(source.semantic).map(([theme, entries]) => [
    theme,
    Object.fromEntries(
      Object.entries(entries).map(([name, token]) => [
        name,
        resolve(token.$value),
      ]),
    ),
  ]),
)
writeFileSync(
  new URL('../src/generated-tokens.ts', import.meta.url),
  `// Generated from design/tokens.json. Do not edit by hand.\nexport const tokens = ${JSON.stringify(resolved, null, 2)} as const\n`,
)
