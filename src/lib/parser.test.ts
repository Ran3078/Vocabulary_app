import { describe, it, expect } from 'vitest'
import { parseLine, parseText, parseEnglishList } from './parser'

describe('parseLine', () => {
  it('tab 分隔', () => {
    expect(parseLine('get rid of\t丟掉；處理掉')).toEqual({ english: 'get rid of', chinese: '丟掉；處理掉' })
  })

  it('逗號分隔', () => {
    expect(parseLine('collapse,塌陷')).toEqual({ english: 'collapse', chinese: '塌陷' })
    expect(parseLine('collapse，塌陷')).toEqual({ english: 'collapse', chinese: '塌陷' })
  })

  it('空白 + 第一個 CJK 字元切分', () => {
    expect(parseLine('surgery 手術')).toEqual({ english: 'surgery', chinese: '手術' })
    expect(parseLine('court of Appeal 上訴法院')).toEqual({ english: 'court of Appeal', chinese: '上訴法院' })
  })

  it('中文含逗號時以 CJK 切分優先於誤切', () => {
    expect(parseLine('strain 品種；過濾，壓力')).toEqual({ english: 'strain', chinese: '品種；過濾，壓力' })
  })

  it('無法配對回傳 null', () => {
    expect(parseLine('')).toBeNull()
    expect(parseLine('hello world')).toBeNull()
    expect(parseLine('只有中文')).toBeNull()
  })
})

describe('parseText', () => {
  it('多行混合格式，並回報失敗行', () => {
    const { pairs, failed } = parseText('surgery 手術\n\ninvalid line\ncollapse,塌陷')
    expect(pairs).toEqual([
      { english: 'surgery', chinese: '手術' },
      { english: 'collapse', chinese: '塌陷' }
    ])
    expect(failed).toEqual(['invalid line'])
  })
})

describe('parseEnglishList', () => {
  it('過濾空行與含中文的行', () => {
    expect(parseEnglishList('surgery\n\nget rid of\n手術\ncollapse 塌陷')).toEqual(['surgery', 'get rid of'])
  })
})
