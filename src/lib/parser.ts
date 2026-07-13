/** 貼上文字批次匯入的解析 */

const CJK_RE = /[㐀-䶿一-鿿豈-﫿]/

export interface ParsedLine {
  english: string
  chinese: string
}

/**
 * 解析單行「英文 + 中文」。
 * 依序嘗試：tab 分隔 → 逗號分隔 → 第一個 CJK 字元處切分。
 * 解析不出成對內容時回傳 null。
 */
export function parseLine(line: string): ParsedLine | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  // tab 分隔（TSV / Excel 貼上）
  if (trimmed.includes('\t')) {
    const [en, ...rest] = trimmed.split('\t')
    return makePair(en, rest.join(' '))
  }

  // 逗號分隔（僅當英文段不含 CJK 且逗號前有內容）
  const commaIdx = trimmed.search(/[,，]/)
  if (commaIdx > 0 && !CJK_RE.test(trimmed.slice(0, commaIdx))) {
    return makePair(trimmed.slice(0, commaIdx), trimmed.slice(commaIdx + 1))
  }

  // 第一個 CJK 字元處切分（「單字 中文」空白分隔也涵蓋在此）
  const cjkMatch = CJK_RE.exec(trimmed)
  if (cjkMatch && cjkMatch.index > 0) {
    return makePair(trimmed.slice(0, cjkMatch.index), trimmed.slice(cjkMatch.index))
  }

  return null
}

function makePair(en: string, zh: string): ParsedLine | null {
  const english = en.trim()
  const chinese = zh.trim()
  if (!english || !chinese) return null
  return { english, chinese }
}

/** 解析多行文字，回傳成功配對與失敗的行 */
export function parseText(text: string): { pairs: ParsedLine[]; failed: string[] } {
  const pairs: ParsedLine[] = []
  const failed: string[] = []
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue
    const p = parseLine(line)
    if (p) pairs.push(p)
    else failed.push(line.trim())
  }
  return { pairs, failed }
}

/** 解析純英文清單（每行一個單字/片語） */
export function parseEnglishList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !CJK_RE.test(l))
}
