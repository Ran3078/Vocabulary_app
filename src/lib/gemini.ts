import type { EncodedImage } from './image'

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export interface ExtractedItem {
  english: string
  chinese: string
  pos?: string
}

/** Gemini responseSchema：{ items: [{ english, chinese, pos }] } */
const ITEMS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          english: { type: 'STRING', description: '英文單字或片語' },
          chinese: { type: 'STRING', description: '繁體中文意思，多義以；分隔' },
          pos: { type: 'STRING', description: '詞性，如 n. v. adj. adv. phr.，沒有則空字串' }
        },
        required: ['english', 'chinese']
      }
    }
  },
  required: ['items']
} as const

interface GeminiPart {
  text?: string
  inline_data?: { mime_type: string; data: string }
}

async function callGemini(
  apiKey: string,
  model: string,
  parts: GeminiPart[],
  useSchema: boolean
): Promise<string> {
  if (!apiKey) throw new Error('尚未設定 Gemini API key，請先到「設定」頁填入')
  const res = await fetch(`${API_BASE}/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: useSchema
        ? { responseMimeType: 'application/json', responseSchema: ITEMS_SCHEMA, temperature: 0.1 }
        : { temperature: 0.1 }
    })
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    let msg = `Gemini API 錯誤 (HTTP ${res.status})`
    try {
      const err = JSON.parse(body)
      if (err?.error?.message) msg += `：${err.error.message}`
    } catch {
      /* 保留預設訊息 */
    }
    if (res.status === 400 && body.includes('API key not valid')) msg = 'API key 無效，請檢查設定'
    if (res.status === 429) msg = 'API 額度已達上限，請稍後再試'
    throw new Error(msg)
  }
  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? '')
    .join('')
  if (!text) throw new Error('Gemini 未回傳內容（可能被安全機制擋下），請重試')
  return text
}

function parseItems(text: string): ExtractedItem[] {
  const data = JSON.parse(text)
  const items = Array.isArray(data) ? data : data?.items
  if (!Array.isArray(items)) throw new Error('LLM 回傳格式不正確')
  return items
    .filter((it) => it && typeof it.english === 'string' && typeof it.chinese === 'string')
    .map((it) => ({
      english: it.english.trim(),
      chinese: it.chinese.trim(),
      pos: typeof it.pos === 'string' && it.pos.trim() ? it.pos.trim() : undefined
    }))
    .filter((it) => it.english && it.chinese)
}

const IMAGE_PROMPT = `你是把手寫英文單字筆記轉成單字卡的助手。圖片是筆記本頁面，內容為「英文單字/片語 + 中文意思」的對照清單。請抽取所有配對，遵守以下規則：

1. 頁面可能是左右兩欄排版：每一欄是各自獨立的清單。請先由上到下讀完左欄，再由上到下讀右欄，絕對不可把左欄的英文配到右欄的中文。
2. 英文可能是多字片語（如 get rid of、court of appeal、cut jobs），必須完整保留。
3. chinese 一律輸出繁體中文；同一個字的多個意思用「；」分隔。
4. 詞性標註（n. v. adj. adv. phr. 等，包含寫在中文旁邊括號裡的）放到 pos 欄位，不要留在 chinese 裡。
5. 被劃掉、塗黑修改的字請忽略，只取最終版本。
6. 說明性筆記（如字首規則「in => 不、非、無」、文法說明）本身不要輸出；但筆記中有中文對照的例字（如 irregular 不規則的、illegal 非法的）要各自輸出成一筆。
7. 手寫可能有筆誤或連筆，請輸出校正後最合理的英文拼字（如 dectronic → electronic）。
8. 同一行若寫了兩組配對（如「suffer 遭受  nasal 鼻腔」），要拆成兩筆。
9. 只有英文沒有中文對照（或只有中文）的行不要輸出。
10. 括號中的同義字補充（如 anxious (nervous)）：英文取主要單字，同義字可附在 chinese 末尾以「同 nervous」形式保留，或省略。

請輸出 JSON。`

export async function extractFromImage(
  apiKey: string,
  model: string,
  image: EncodedImage
): Promise<ExtractedItem[]> {
  const text = await callGemini(
    apiKey,
    model,
    [{ text: IMAGE_PROMPT }, { inline_data: { mime_type: image.mimeType, data: image.base64 } }],
    true
  )
  return parseItems(text)
}

export async function fillChinese(
  apiKey: string,
  model: string,
  words: string[]
): Promise<ExtractedItem[]> {
  const prompt = `以下是英文單字/片語清單（每行一個）。請為每一個提供台灣常用的繁體中文意思（常見多義用「；」分隔，最多 3 個意思）與詞性（n. v. adj. adv. phr. 等；多詞性可併列如 n./v.）。每個輸入單字各輸出一筆，english 欄位照抄輸入。請輸出 JSON。

${words.join('\n')}`
  const text = await callGemini(apiKey, model, [{ text: prompt }], true)
  return parseItems(text)
}

/** 測試 API key 是否可用 */
export async function testConnection(apiKey: string, model: string): Promise<string> {
  const text = await callGemini(apiKey, model, [{ text: '請只回覆兩個字：成功' }], false)
  return text.trim()
}
