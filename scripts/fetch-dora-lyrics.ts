import { load } from 'cheerio'
import { Database } from 'bun:sqlite'

const BASE_URL = 'https://musprofile.com'
const ARTIST_URL = `${BASE_URL}/dora/texts`
const DB_PATH = 'dora.db'

interface RawSong {
  title: string
  lyrics: string[]
}

let stats = { fetched: 0, skipped: 0, errors: 0, slugs: 0 }

async function fetchWithRetry(url: string, retries = 3): Promise<string | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DoraBot/1.0)' },
        signal: AbortSignal.timeout(15000),
      })
      if (res.ok) return await res.text()
    } catch {}
    await new Promise((r) => setTimeout(r, 2000 * (i + 1)))
  }
  return null
}

function parseTitle(html: string): string | null {
  const $ = load(html)
  const h1 = $('h1[itemprop="name"]').first().text().trim()
  if (!h1) return null
  return h1.replace(/^Дора\s*[-–—]\s*/, '').trim()
}

function parseLyrics(html: string): string[] {
  const $ = load(html)
  const lines: string[] = []

  $('.text-song p').each((_, p) => {
    const html = $(p).html() || ''
    const parts = html.split(/<br\s*\/?>/i)
    for (const part of parts) {
      const clean = $(`<div>${part}</div>`).text().trim()
      if (clean) lines.push(clean)
    }
  })

  return lines
}

function normalizeKey(title: string): string {
  let t = title

  // remove English translations in parens but keep feat/ft
  t = t.replace(/\((?!\s*(?:feat|ft)\s?)[a-zA-Z\s\-'',.!?0-9]+\)/g, '')

  // remove version markers
  t = t.replace(
    /\(?(?:акустическая\s+версия|acoustic\s+version|live|cover|snippet|instrumental|новогодняя\s+версия|version|remix)\)?/gi,
    '',
  )

  // remove square brackets
  t = t.replace(/\[[^\]]*\]/g, '')

  // remove asterisks, stray punctuation
  t = t.replace(/[*]+/g, '')

  // strip ALL spaces to catch "дорадура" vs "дора дура"
  t = t.replace(/\s+/g, '').toLocaleLowerCase()
  return t
}

function shouldExclude(title: string): boolean {
  const lower = title.toLocaleLowerCase()
  if (lower.includes('snippet')) return true
  if (lower.includes('поздравлени')) return true
  if (lower.includes('skit')) return true
  if (lower.includes('unreleased')) return true
  if (lower.includes('cover')) return true
  if (lower.length < 2) return true
  if (lower.startsWith('*') || lower.endsWith('*')) return true
  return false
}

function scoreSong(song: RawSong): number {
  let score = 100
  const lower = song.title.toLocaleLowerCase()

  if (lower.includes('cover')) score -= 50
  if (lower.includes('snippet')) score -= 40
  if (lower.includes('live')) score -= 20
  if (lower.includes('acoustic')) score -= 15
  if (lower.includes('акустическая')) score -= 15
  if (lower.includes('remix')) score -= 10
  if (lower.includes('instrumental')) score -= 10

  score -= song.title.length * 0.1
  score += Math.min(song.lyrics.length * 0.5, 20)

  return score
}

function dedupSongs(songs: RawSong[]): RawSong[] {
  const groups = new Map<string, RawSong[]>()

  for (const song of songs) {
    const key = normalizeKey(song.title)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(song)
  }

  const result: RawSong[] = []

  for (const [, group] of groups) {
    if (group.length === 0) continue
    let best = group[0]!
    let bestScore = scoreSong(best)

    for (let i = 1; i < group.length; i++) {
      const s = scoreSong(group[i]!)
      if (s > bestScore) {
        best = group[i]!
        bestScore = s
      }
    }

    result.push(best)
  }

  return result
}

async function getSlugs(): Promise<string[]> {
  const html = await fetchWithRetry(ARTIST_URL)
  if (!html) throw new Error('Failed to fetch artist page')

  const $ = load(html)
  const slugs = new Set<string>()

  $('a[href^="/dora/texts/"]').each((_, el) => {
    const href = $(el).attr('href')
    if (href) {
      const slug = href.replace('/dora/texts/', '')
      if (slug && !slug.includes('/')) slugs.add(encodeURIComponent(slug))
    }
  })

  return [...slugs]
}

async function main() {
  console.log('Fetching song list...')
  const slugs = await getSlugs()
  stats.slugs = slugs.length
  console.log(`Found ${slugs.length} slugs`)

  const allSongs: RawSong[] = []

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i]
    const url = `${BASE_URL}/dora/texts/${slug}`

    const html = await fetchWithRetry(url)
    if (!html) {
      stats.errors++
      printProgress(i)
      continue
    }

    const title = parseTitle(html)
    if (!title || shouldExclude(title)) {
      stats.skipped++
      printProgress(i)
      continue
    }

    const lyrics = parseLyrics(html)
    if (lyrics.length === 0) {
      stats.skipped++
      printProgress(i)
      continue
    }

    // exclude scrap entries with almost no lyrics
    if (lyrics.length < 3) {
      stats.skipped++
      printProgress(i)
      continue
    }

    allSongs.push({ title, lyrics })
    stats.fetched++
    printProgress(i)

    await new Promise((r) => setTimeout(r, 400))
  }

  console.log('\n')

  console.log(`Deduplicating... (before: ${allSongs.length})`)
  const deduped = dedupSongs(allSongs)
  console.log(`After dedup: ${deduped.length}`)

  console.log('Creating database...')
  const db = new Database(DB_PATH)

  db.run(`
    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL UNIQUE
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS lyrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      song_id INTEGER NOT NULL REFERENCES songs(id),
      line TEXT NOT NULL
    )
  `)

  db.run('CREATE INDEX IF NOT EXISTS idx_lyrics_line ON lyrics(line)')

  const insertSong = db.prepare('INSERT OR IGNORE INTO songs (title) VALUES (?)')
  const insertLine = db.prepare('INSERT INTO lyrics (song_id, line) VALUES (?, ?)')

  const insertAll = db.transaction((songs: RawSong[]) => {
    for (const song of songs) {
      const result = insertSong.run(song.title)
      if (result.lastInsertRowid) {
        const songId = Number(result.lastInsertRowid)
        for (const line of song.lyrics) {
          insertLine.run(songId, line)
        }
      }
    }
  })

  insertAll(deduped)

  const songCount = db.query('SELECT COUNT(*) as c FROM songs').get() as { c: number }
  const lineCount = db.query('SELECT COUNT(*) as c FROM lyrics').get() as { c: number }

  console.log(`Database ready: ${songCount.c} songs, ${lineCount.c} lines`)
  db.close()
}

function printProgress(i: number) {
  const { slugs, fetched, skipped, errors } = stats
  process.stdout.write(
    `\r${i + 1}/${slugs} | fetched: ${fetched} | skip: ${skipped} | err: ${errors}`,
  )
}

main().catch((e) => {
  console.error('\nFatal:', e)
  process.exit(1)
})
