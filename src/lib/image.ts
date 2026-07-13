/** 圖片前處理：縮放壓縮後轉 base64，降低 API 傳輸量與費用 */

const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.85

export interface EncodedImage {
  base64: string // 不含 data: 前綴
  mimeType: string
}

export async function fileToEncodedImage(file: File): Promise<EncodedImage> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.round(img.naturalWidth * scale)
    const h = Math.round(img.naturalHeight * scale)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('無法建立 canvas')
    ctx.drawImage(img, 0, 0, w, h)

    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
    return { base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' }
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('圖片載入失敗'))
    img.src = url
  })
}
