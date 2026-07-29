/**
 * Splits the biography page's markdown body into its three visual parts: the always-visible
 * intro paragraph, the paragraphs behind "read more", and the two blog panels.
 *
 * Deliberately NOT a general markdown renderer — the body's shape is fully known (paragraphs
 * separated by blank lines, panels introduced by "## Heading", each panel holding an optional
 * lead line and a list of "- [text](url)" links) because this project's own generator produced
 * it. A hand-rolled parser matching that exact shape is simpler and more auditable than pulling
 * in a markdown-to-AST dependency to parse three fixed patterns.
 */

export interface BiographyPanel {
  title: string
  lead?: string
  links: { text: string; href: string }[]
}

export interface ParsedBiography {
  intro: string
  readMore: string[]
  panels: BiographyPanel[]
}

const LINK_LINE = /^-\s*\[([^\]]+)\]\(([^)]+)\)$/

export function parseBiography(body: string): ParsedBiography {
  const [narrative, ...panelChunks] = body.trim().split(/\n(?=## )/)

  const paragraphs = narrative
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
  const [intro, ...readMore] = paragraphs

  const panels = panelChunks.map((chunk) => {
    const lines = chunk
      .replace(/^##\s*/, '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    const [title, ...rest] = lines
    const links: BiographyPanel['links'] = []
    let lead: string | undefined
    for (const line of rest) {
      const m = LINK_LINE.exec(line)
      if (m) links.push({ text: m[1], href: m[2] })
      else lead = line.replace(/^[“"]|[”"]$/g, '')
    }
    return { title, lead, links }
  })

  return { intro: intro ?? '', readMore, panels }
}
