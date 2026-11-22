import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import {
  buildContributionReportHtml,
  campaignShareHash,
  clearDemoStorage,
  eventHasOccurred,
  measurementToKilograms,
  normalizeMeasurement,
  parseHashRoute,
  parseQuantityInput,
  totalKilograms,
} from '../.test-dist/domain.js'
import { navigation } from '../.test-dist/data.js'

test('converts only weight units to kilograms', () => {
  assert.equal(measurementToKilograms({ value: 500, unit: 'g' }), 0.5)
  assert.equal(measurementToKilograms({ value: 2.5, unit: 'kg' }), 2.5)
  assert.equal(measurementToKilograms({ value: 0.25, unit: 'tonnes' }), 250)
  assert.equal(measurementToKilograms({ value: 4, unit: 'bags' }), null)
  assert.equal(measurementToKilograms({ value: 3, unit: 'containers' }), null)
  assert.equal(measurementToKilograms({ value: 8, unit: 'items' }), null)
})

test('validates structured quantities and preserves ambiguous legacy entries', () => {
  assert.deepEqual(parseQuantityInput('1,5 kg'), { value: 1.5, unit: 'kg' })
  assert.equal(parseQuantityInput('-1 kg'), null)
  assert.equal(parseQuantityInput('0 kg'), null)
  assert.equal(parseQuantityInput('12'), null)
  assert.deepEqual(normalizeMeasurement(undefined, undefined, '18 kg'), { value: 18, unit: 'kg', raw: '18 kg' })
  assert.deepEqual(normalizeMeasurement(undefined, undefined, '8'), { value: null, unit: null, raw: '8' })
})

test('totals ignore non-weight records and ambiguous legacy quantities', () => {
  const total = totalKilograms([
    normalizeMeasurement(undefined, undefined, '500 g'),
    normalizeMeasurement(undefined, undefined, '2 kg'),
    normalizeMeasurement(undefined, undefined, '0.25 tonnes'),
    normalizeMeasurement(undefined, undefined, '4 bags'),
    normalizeMeasurement(undefined, undefined, '8'),
  ])
  assert.equal(total, 252.5)
})

test('campaign links identify only known campaign IDs and report invalid links', () => {
  const hash = campaignShareHash('CAM-21')
  assert.equal(hash, '#community/campaign/CAM-21')
  assert.deepEqual(parseHashRoute(hash, ['CAM-21']), { page: 'community', campaignId: 'CAM-21', issue: null })
  assert.equal(parseHashRoute('#community/campaign', ['CAM-21']).issue, 'That campaign link is missing its campaign ID.')
  assert.equal(parseHashRoute('#community/campaign/CAM-99', ['CAM-21']).issue, 'This campaign is not available in the current browser demo.')
  assert.equal(parseHashRoute('#community/campaign/%E0%A4%A', ['CAM-21']).issue, 'That campaign link is not valid.')
  assert.equal(parseHashRoute('#impact', []).page, 'impact')
})

test('all navigation destinations parse as valid routes', () => {
  for (const item of navigation) assert.equal(parseHashRoute(`#${item.id}`, []).page, item.id)
})

test('attendance opens the day after an event and stays closed on or before it', () => {
  assert.equal(eventHasOccurred('2026-11-22', '2026-11-22'), false)
  assert.equal(eventHasOccurred('2026-11-22', '2026-11-23'), true)
  assert.equal(eventHasOccurred('2026-11-21', '2026-11-22'), true)
  assert.equal(eventHasOccurred('2026-11-23', '2026-11-22'), false)
  assert.equal(eventHasOccurred('not-a-date', '2026-11-22'), false)
})

test('demo reset removes only app-owned local-storage keys', () => {
  const values = new Map([['hrl:role', 'Resident'], ['hrl:requests', '[]'], ['unrelated:settings', 'keep']])
  const storage = {
    get length() { return values.size },
    key(index) { return [...values.keys()][index] ?? null },
    removeItem(key) { values.delete(key) },
  }
  assert.deepEqual(clearDemoStorage(storage).sort(), ['hrl:requests', 'hrl:role'])
  assert.deepEqual([...values.entries()], [['unrelated:settings', 'keep']])
})

test('print report includes required fields and escapes participant input', () => {
  const html = buildContributionReportHtml('<Mina & Friends>', [{
    name: 'Garden <sorting>', date: '2026-11-20', organisation: 'Community Home', role: 'Volunteer', hours: 2,
    skills: ['sorting'], status: 'Self-reported',
  }], '2026-11-22')
  assert.match(html, /Mina &amp; Friends/)
  assert.match(html, /Garden &lt;sorting&gt;/)
  assert.match(html, /Community Home/)
  assert.match(html, /2 h/)
  assert.match(html, /Self-reported/)
  assert.match(html, /not an employment guarantee, official qualification/)
  assert.match(html, /Print \/ Save as PDF/)
})

test('core text and status color pairs meet the 4.5:1 text contrast target', async () => {
  const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')
  const token = name => {
    const matches = [...css.matchAll(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`, 'g'))]
    assert.ok(matches.length, `Missing ${name} color token`)
    return matches[matches.length - 1][1]
  }
  const luminance = hex => {
    const values = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2]
  }
  const ratio = (foreground, background) => {
    const a = luminance(foreground); const b = luminance(background)
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
  }
  const paper = token('--paper')
  const pairs = [
    [token('--ink'), paper],
    [token('--muted'), paper],
    ['#ffffff', token('--green')],
    ['#704707', '#fff0cf'],
    ['#d9e5dc', '#204436'],
  ]
  for (const [foreground, background] of pairs) assert.ok(ratio(foreground, background) >= 4.5, `${foreground} on ${background} is below 4.5:1`)
})

test('app typography has a readable floor and uses only local system font stacks', async () => {
  const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')
  const sizes = [...css.matchAll(/font-size\s*:\s*([0-9]+(?:\.[0-9]+)?)px/g)].map(match => Number(match[1]))
  assert.ok(sizes.every(size => size === 0 || size >= 12), 'Visible text styles should not fall below 12px')
  assert.match(css, /body\{font-family:inherit;font-size:16px/)
  assert.match(css, /p\{font-size:15px/)
  assert.doesNotMatch(css, /@import|fonts\.googleapis|Manrope|DM Sans/i)
})
