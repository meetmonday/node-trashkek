import { Database } from 'bun:sqlite'
import { format, bold, italic, spoiler } from 'gramio'

import type { BotType } from '..'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  AESTHETICS ENGINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const POOL = [
  '✧', '✩', '✦', '⋆', '☆', '✿', '❀', '♡', '🎀', '⊹',
  '˚', '·', '☪', '♪', '❁', '✾', '✨', '🌸', '💕', '♥',
  '❃', '✶', '✷', '✹',
]

const BORDERS = [
  '🌸 ✩ ⋆ ✩ 🌸',
  '✧ ˚ · 🎀 · ˚ ✧',
  '🎀 ✿ ⊹ ✿ 🎀',
  '✦ ⋆ ✧ ⋆ ✦',
  '♡ ⋆｡°✩°｡⋆ ♡',
  '💕 ˚ · . · ˚ 💕',
  '✿ ✾ ❀ ✾ ✿',
  '☆ ✧ ⋆ ✧ ☆',
  '🎀 ˚ · . · ˚ 🎀',
  '🌸 ♡ ⋆ ♡ 🌸',
  '♡ ˚ ｡ ⋆ ｡ ˚ ♡',
  '✧ ˚ . ─ . ˚ ✧',
  '💗 ⋆ ✩ ⋆ 💗',
  '✿ ˚ ♡ ˚ ✿',
]

const HEADS = [
  '✩ ♡  𝘥𝘰𝘳𝘢  ♡ ✩',
  '♡  дорочка  ♡',
  '🎀  𝘥𝘰𝘳𝘢  🎀',
  '♡  𝒹𝑜𝓇𝒶  ♡',
  '✩  𝘥𝘰𝘳𝘰𝘤𝘩𝘬𝘢  ✩',
  '♡ ⋆  𝘥𝘰𝘳𝘢  ⋆ ♡',
  '💕  𝘥𝘰𝘳𝘢  💕',
  '♡  𝘥𝘰𝘳𝘢  ♡',
  '🌸  𝘥𝘰𝘳𝘢  🌸',
  '✿  𝘥𝘰𝘳𝘢  ✿',
  '🎀 ⋆  𝘥𝘰𝘳𝘢  ⋆ 🎀',
  '♡  ⋆｡°✩°｡⋆  ♡',
  '💗  𝘥𝘰𝘳𝘢  💗',
]

const QUOTES: [string, string][] = [
  ['✿ «', '» ✿'],
  ['🎀 «', '» 🎀'],
  ['💕 «', '» 💕'],
  ['🌸 «', '» 🌸'],
  ['♡ «', '» ♡'],
  ['⊹ «', '» ⊹'],
  ['✩ «', '» ✩'],
  ['✦ «', '» ✦'],
  ['💗 «', '» 💗'],
]

const FOOTERS = [
  '⋆｡°✩  ♡  ✩°｡⋆',
  '🎀 ˚ · ♡ · ˚ 🎀',
  '♡  ∞  ♡',
  '💕 ✿ 🎀 🌸',
  '˚ · . 🎀 . · ˚',
  '✿ ♡ ⋆ ♡ ✿',
  '🎀  𝘥𝘰𝘳𝘢  𝘨𝘢𝘯𝘨  🎀',
  '🌸  слушай дорачку  🌸',
  '♡ ⋆｡°✩  ✩°｡⋆ ♡',
  '✿ 🎀 💕 ♡ ✿',
  '⊹ ˚ . 🎀 . ˚ ⊹',
  '☆ ˚ ♡ ˚ ☆',
  '💕  𝘴𝘸𝘦𝘦𝘵  𝘥𝘰𝘳𝘢  💕',
  '🌸  кьют-рок  🌸',
  '🎀  𝘴𝘭𝘢𝘺  🎀',
]

// ─── helpers ───

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function frills(n = 3): string {
  const a: string[] = []
  for (let i = 0; i < n; i++) a.push(pick(POOL))
  return a.join(' ')
}

// ─── layouts ───

function layoutA(o: { border: string; head: string; q: [string, string]; line: string; title: string; footer: string }) {
  return format`
${bold(`${frills(2)}   ${o.border}   ${frills(2)}`)}
${bold(`  ${o.head}  `)}
${bold(`${frills(2)}   ${o.border}   ${frills(2)}`)}

${italic(`${o.q[0]} ${o.line} ${o.q[1]}`)}

— ${bold(o.title)}

${italic(o.footer)}
`
}

function layoutB(o: { border: string; head: string; q: [string, string]; line: string; title: string; footer: string }) {
  return format`
${bold(o.border)}
${bold(o.head)}
${bold(o.border)}

${italic(`${o.q[0]} ${o.line} ${o.q[1]}`)}

— ${bold(o.title)}

${italic(o.footer)}
${bold(frills(3))}
`
}

function layoutC(o: { border: string; head: string; q: [string, string]; line: string; title: string; footer: string }) {
  return format`
${bold(`🎀  ${o.border}  🎀`)}
${bold(`♡  ${o.head}  ♡`)}
${bold(`🎀  ${o.border}  🎀`)}

${italic(`${o.q[0]} ${o.line} ${o.q[1]}`)}

— ${bold(o.title)}

${italic(`🎀  ${o.footer}  🎀`)}
`
}

function layoutD(o: { border: string; head: string; q: [string, string]; line: string; title: string; footer: string }) {
  return format`

╭${'─'.repeat(28)}╮
│  ${bold(o.border)}  │
│  ${bold(o.head)}  │
│  ${bold(o.border)}  │
╰${'─'.repeat(28)}╯

${italic(`${o.q[0]} ${o.line} ${o.q[1]}`)}

— ${bold(o.title)}

${bold(`♡ ${frills(2)} ${o.footer} ${frills(2)} ♡`)}
`
}

function layoutE(o: { border: string; head: string; q: [string, string]; line: string; title: string; footer: string }) {
  return format`
${bold(`${frills(2)}  ${o.border}  ${frills(2)}`)}

${bold(`     ${o.head}     `)}

${bold(`${frills(2)}  ${o.border}  ${frills(2)}`)}

${italic(`${o.q[0]} ${o.line} ${o.q[1]}`)}

— ${bold(o.title)}
`
}

const LAYOUTS = [layoutA, layoutB, layoutC, layoutD, layoutE]

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  DB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let dbInstance: Database | null = null

function getDb(): Database {
  if (!dbInstance) {
    dbInstance = new Database('dora.db', { readonly: true })
  }
  return dbInstance
}

function randomLine(): { line: string; title: string } | null {
  const db = getDb()
  const row = db
    .query(
      `SELECT lyrics.line as line, songs.title as title
       FROM lyrics JOIN songs ON lyrics.song_id = songs.id
       ORDER BY RANDOM() LIMIT 1`,
    )
    .get() as { line: string; title: string } | undefined
  return row || null
}

function searchLine(query: string): { line: string; title: string } | null {
  const db = getDb()
  const row = db
    .query(
      `SELECT lyrics.line as line, songs.title as title
       FROM lyrics JOIN songs ON lyrics.song_id = songs.id
       WHERE lyrics.line LIKE ?
       ORDER BY RANDOM() LIMIT 1`,
    )
    .get(`%${query}%`) as { line: string; title: string } | undefined
  return row || null
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function card(line: string, title: string) {
  const layout = pick(LAYOUTS)
  return layout({
    border: pick(BORDERS),
    head: pick(HEADS),
    q: pick(QUOTES),
    line,
    title,
    footer: pick(FOOTERS),
  })
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  COMMAND
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const handler = (ctx: any) => {
  const query = ctx.args?.trim()

  if (!query) {
    const result = randomLine()
    if (!result) {
      ctx.send(spoiler('нету нихуя'))
      return
    }
    ctx.send(card(result.line, result.title))
    return
  }

  const result = searchLine(query)
  if (!result) {
    const random = randomLine()
    if (!random) {
      ctx.send(spoiler('нету нихуя'))
      return
    }
    ctx.send(card(random.line, random.title))
    return
  }

  ctx.send(card(result.line, result.title))
}

export default (bot: BotType) =>
  bot.command('dora', (context) => handler(context))
