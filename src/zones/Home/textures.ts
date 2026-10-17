import * as THREE from 'three'
import { heightAt } from '../../scene/islandShape'
import { PALETTE } from '../../scene/palette'
import type { Social, SocialKind } from '../../data/profile'
import { random } from './parts'

// The pictures painted on Home's sign, boards and postcards. Each one is drawn with the
// browser's 2D canvas (like a small drawing program: fill a rectangle, write text) and then
// used as a texture on a flat 3D surface (a CanvasTexture). No image or font files needed,
// and the text always comes from the data files.

const FONT = 'system-ui, sans-serif' // the same font as the rest of the page
const INK = '#2b2b2b'

function canvas(width: number, height: number) {
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  return { c, ctx: c.getContext('2d')! }
}

function toTexture(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace // the canvas colours are normal screen colours
  t.anisotropy = 8 // keeps text sharp when seen at an angle
  return t
}

function font(size: number, weight = 400) {
  return `${weight} ${size}px ${FONT}`
}

// Splits text into lines no wider than `width`.
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (line && ctx.measureText(next).width > width) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

// The biggest font size (down to `min`) at which `text` fits in the box, as wrapped lines.
function fit(ctx: CanvasRenderingContext2D, text: string, width: number, height: number, max: number, min: number, weight = 400) {
  for (let size = max; ; size -= 2) {
    ctx.font = font(size, weight)
    const lines = wrap(ctx, text, width)
    if (lines.length * size * 1.3 <= height || size <= min) return { size, lines }
  }
}

// A wavy line, like a painted wave.
function wave(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, color: string) {
  ctx.strokeStyle = color
  ctx.lineWidth = 8
  ctx.lineCap = 'round'
  ctx.beginPath()
  for (let x = x0; x <= x1; x += 4) ctx.lineTo(x, y + Math.sin((x - x0) / 22) * 8)
  ctx.stroke()
}

// A pin with a shiny dot, as on a cork board.
function pin(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, r = 11) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.beginPath()
  ctx.arc(x + 3, y + 4, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.beginPath()
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, Math.PI * 2)
  ctx.fill()
}

// ---------- the welcome sign ----------
// 1024 x 640, for a 2.8 x 1.75 m board. Title and tagline are big enough to read from
// the start view; the About me text is for when the camera flies up to the sign.
export function signTexture(name: string, tagline: string, about: string) {
  const { c, ctx } = canvas(1024, 640)
  ctx.fillStyle = '#fbf7ee'
  ctx.fillRect(0, 0, 1024, 640)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = INK
  const title = `Hi, I'm ${name}!`
  let size = 116
  do ctx.font = font((size -= 4), 800)
  while (ctx.measureText(title).width > 940)
  ctx.fillText(title, 512, 150)

  const tag = fit(ctx, tagline, 900, 120, 48, 30)
  ctx.fillStyle = '#5a5a5a'
  tag.lines.slice(0, 2).forEach((line, i) => ctx.fillText(line, 512, 220 + i * tag.size * 1.25))

  wave(ctx, 330, 694, 330, '#4fb3d9')

  ctx.fillStyle = '#e5674b'
  ctx.font = font(30, 800)
  ctx.fillText('ABOUT ME', 512, 395)

  ctx.fillStyle = INK
  ctx.textAlign = 'left'
  const body = fit(ctx, about, 900, 200, 38, 20)
  body.lines.forEach((line, i) => ctx.fillText(line, 62, 450 + i * body.size * 1.3))
  return toTexture(c)
}

// ---------- the notice board ----------
// The cork inside the frame: 1024 x 790, for 1.6 x 1.23 m. Skills as paper notes in rows on
// the left; the right side is kept free for the CV, a separate paper you can click.
export const BOARD_FREE_FROM = 0.7 // the CV paper goes right of this (fraction of the width)

export function boardTexture(skills: string[]) {
  const W = 1024
  const H = 790
  const { c, ctx } = canvas(W, H)
  const rand = random(7)
  ctx.fillStyle = '#c99a5b'
  ctx.fillRect(0, 0, W, H)
  // Cork speckles.
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = rand() < 0.5 ? 'rgba(90,55,20,0.25)' : 'rgba(255,230,190,0.25)'
    ctx.fillRect(rand() * W, rand() * H, 3 + rand() * 4, 3 + rand() * 4)
  }

  // Header note.
  ctx.save()
  ctx.translate(60, 50)
  ctx.rotate(-0.025)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 470, 96)
  ctx.fillStyle = INK
  ctx.font = font(54, 800)
  ctx.textBaseline = 'middle'
  ctx.fillText('Skills & tools', 26, 50)
  ctx.restore()
  pin(ctx, 295, 58, '#e2402e')

  // Skill notes, wrapping into rows like words in a sentence. Shrink until they all fit.
  const colors = ['#ffe27a', '#ffb7c5', '#bfe3ff', '#c8f0b0', '#ffffff', '#ffd2a6']
  const left = 50
  const right = W * BOARD_FREE_FROM - 20
  for (let size = 44; size >= 18; size -= 2) {
    ctx.font = font(size, 700)
    const h = size * 1.9
    const gap = size * 0.55
    let x = left
    let y = 200
    const placed: [string, number, number, number][] = []
    for (const skill of skills) {
      const w = ctx.measureText(skill).width + size * 1.1
      if (x + w > right && x > left) {
        x = left
        y += h + gap
      }
      placed.push([skill, x, y, w])
      x += w + gap
    }
    if (y + h > H - 30 && size > 18) continue
    placed.forEach(([skill, nx, ny, w], i) => {
      ctx.save()
      ctx.translate(nx + w / 2, ny + h / 2)
      ctx.rotate(i % 2 ? 0.03 : -0.025)
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      ctx.fillRect(-w / 2 + 4, -h / 2 + 6, w, h)
      ctx.fillStyle = colors[i % colors.length]
      ctx.fillRect(-w / 2, -h / 2, w, h)
      ctx.fillStyle = INK
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(skill, 0, size * 0.1)
      ctx.restore()
      pin(ctx, nx + w / 2, ny + 6, ['#e2402e', '#2f7fe0', '#4caf50'][i % 3], 9)
    })
    break
  }
  return toTexture(c)
}

// The CV: a sheet of paper, 512 x 660, for 0.34 x 0.44 m.
export function cvTexture(ready: boolean) {
  const { c, ctx } = canvas(512, 660)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 512, 660)
  ctx.textAlign = 'center'
  ctx.fillStyle = INK
  ctx.font = font(170, 800)
  ctx.fillText('CV', 256, 230)
  // Pretend lines of text.
  ctx.fillStyle = '#d6d6d6'
  for (let i = 0; i < 5; i++) ctx.fillRect(70, 290 + i * 38, i % 2 ? 300 : 372, 14)
  ctx.fillStyle = ready ? '#2f7fe0' : '#9a9a9a'
  ctx.font = font(ready ? 56 : 46, 800)
  ctx.fillText(ready ? 'Download ↓' : 'coming soon', 256, 560)
  return toTexture(c)
}

// ---------- the "Find me" board and postcards ----------

// The board under the mailbox: 1024 x 576, for 1.1 x 0.62 m. Planks with a title; the
// postcards (separate, clickable) are pinned on its lower part.
export function contactTexture() {
  const { c, ctx } = canvas(1024, 576)
  ctx.fillStyle = '#d9b27c'
  ctx.fillRect(0, 0, 1024, 576)
  ctx.fillStyle = 'rgba(120,80,40,0.35)'
  for (let y = 96; y < 576; y += 96) ctx.fillRect(0, y, 1024, 5)
  ctx.fillStyle = INK
  ctx.textAlign = 'center'
  ctx.font = font(84, 800)
  ctx.fillText('Find me', 512, 108)
  return toTexture(c)
}

// The GitHub logo's outline, as an SVG path (same as in the corner menu's icons), 16 x 16.
const GITHUB =
  'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z'

// One social icon, `size` pixels wide, with its top-left at (x, y).
function icon(ctx: CanvasRenderingContext2D, kind: SocialKind, x: number, y: number, size: number, color: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = color
  ctx.strokeStyle = color
  if (kind === 'github') {
    ctx.scale(size / 16, size / 16)
    ctx.fill(new Path2D(GITHUB))
  } else if (kind === 'linkedin') {
    ctx.scale(size / 24, size / 24)
    ctx.beginPath()
    ctx.roundRect(2, 2, 20, 20, 3)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(7.5, 7, 1.7, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(6, 10, 3, 8)
    ctx.fill(new Path2D('M11 10h2.8v1.3c.5-.9 1.5-1.5 2.7-1.5 2 0 3.5 1.2 3.5 3.8V18h-3v-4c0-1-.5-1.6-1.4-1.6-.9 0-1.6.6-1.6 1.7V18h-3z'))
  } else {
    ctx.scale(size / 24, size / 24)
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.roundRect(3, 5, 18, 14, 2)
    ctx.stroke()
    ctx.stroke(new Path2D('M3 7l9 6 9-6'))
  }
  ctx.restore()
}

const STAMPS: Record<SocialKind, string> = { github: '#6e5494', linkedin: '#0a66c2', email: '#e5674b' }

// A postcard for one social link: 512 x 360, for 0.3 x 0.21 m.
export function postcardTexture(social: Social) {
  const { c, ctx } = canvas(512, 360)
  const ready = social.url !== ''
  ctx.fillStyle = '#fffaf0'
  ctx.fillRect(0, 0, 512, 360)
  // Stamp in the corner, with a wavy postmark next to it.
  ctx.fillStyle = STAMPS[social.kind]
  ctx.fillRect(392, 24, 92, 112)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 4
  ctx.strokeRect(402, 34, 72, 92)
  for (let i = 0; i < 3; i++) wave(ctx, 250, 380, 50 + i * 26, 'rgba(0,0,0,0.12)')

  const color = ready ? INK : '#a0a0a0'
  icon(ctx, social.kind, 36, 150, 110, color)
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.font = font(social.label.length > 7 ? 54 : 64, 800)
  ctx.fillText(social.label, 168, 200)
  ctx.font = font(32)
  ctx.fillStyle = ready ? '#2f7fe0' : '#a0a0a0'
  ctx.fillText(ready ? linkText(social) : 'TODO', 168, 256)
  return toTexture(c)
}

// A short line under the label: where the link goes.
function linkText(social: Social) {
  if (social.url.startsWith('mailto:')) return 'Send me an email'
  const short = social.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
  return short.length > 20 ? `${short.slice(0, 19)}…` : short
}

// ---------- the island map ----------
// 1024 x 888, for a 2.4 x 2.08 m board: a title strip on top, and below it a painted map of
// the real terrain (from heightAt), north up.
const MAP_W = 1024
const MAP_H = 888
const MAP_TOP = 96 // the title strip
const AREA = { x: [-155, 145], z: [-120, 112] } // the part of the world the map shows

// Where a world spot (x, z) is on the map, as fractions of the whole picture (0..1, from
// the top left). Also used to place the 3D pins.
export function mapPoint(x: number, z: number): [number, number] {
  const u = (x - AREA.x[0]) / (AREA.x[1] - AREA.x[0])
  const v = (z - AREA.z[0]) / (AREA.z[1] - AREA.z[0])
  return [u, (MAP_TOP + v * (MAP_H - MAP_TOP)) / MAP_H]
}

export const MAP_ASPECT = MAP_W / MAP_H

export type MapLabel = { x: number; z: number; text: string; color: string }

export function mapTexture(labels: MapLabel[], here: [number, number]) {
  const { c, ctx } = canvas(MAP_W, MAP_H)
  ctx.fillStyle = '#f4ecd8'
  ctx.fillRect(0, 0, MAP_W, MAP_H)
  ctx.fillStyle = INK
  ctx.textAlign = 'center'
  ctx.font = font(60, 800)
  ctx.fillText('Island map', MAP_W / 2, 68)

  // The terrain: one small pixel per spot, then scaled up smoothly.
  const cols = 300
  const rows = 232
  const small = canvas(cols, rows)
  const img = small.ctx.createImageData(cols, rows)
  const col = (hex: string) => new THREE.Color(hex)
  const C = {
    deep: col(PALETTE.waterDeep),
    shallow: col(PALETTE.waterShallow),
    sand: col(PALETTE.sand),
    grass: col(PALETTE.grass),
    grassDark: col(PALETTE.grassDark),
    rock: col(PALETTE.rock),
    rockHigh: col(PALETTE.rockHigh),
  }
  const out = new THREE.Color()
  const cell = (AREA.x[1] - AREA.x[0]) / cols
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = AREA.x[0] + (i + 0.5) * cell
      const z = AREA.z[0] + (j + 0.5) * cell
      const h = heightAt(x, z)
      if (h < 0) {
        out.copy(C.deep).lerp(C.shallow, THREE.MathUtils.smoothstep(h, -9, -1))
      } else {
        if (h < 2) out.copy(C.sand)
        else if (h < 30) out.copy(C.grass).lerp(C.grassDark, THREE.MathUtils.smoothstep(h, 10, 30))
        else out.copy(C.rock).lerp(C.rockHigh, THREE.MathUtils.smoothstep(h, 45, 85))
        // Light from the north-west: slopes facing it are brighter, the others darker.
        const shade = THREE.MathUtils.clamp(1 + (h - heightAt(x - cell, z - cell)) * 0.05, 0.65, 1.3)
        out.multiplyScalar(shade)
      }
      const k = (j * cols + i) * 4
      img.data[k] = Math.min(255, out.r * 255)
      img.data[k + 1] = Math.min(255, out.g * 255)
      img.data[k + 2] = Math.min(255, out.b * 255)
      img.data[k + 3] = 255
    }
  }
  small.ctx.putImageData(img, 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(small.c, 0, MAP_TOP, MAP_W, MAP_H - MAP_TOP)
  ctx.strokeStyle = '#77522f'
  ctx.lineWidth = 6
  ctx.strokeRect(3, MAP_TOP, MAP_W - 6, MAP_H - MAP_TOP - 3)

  // Compass, top right.
  ctx.save()
  ctx.translate(950, MAP_TOP + 80)
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.beginPath()
  ctx.arc(0, 0, 46, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#e2402e'
  ctx.beginPath()
  ctx.moveTo(0, -36)
  ctx.lineTo(12, 4)
  ctx.lineTo(-12, 4)
  ctx.fill()
  ctx.fillStyle = INK
  ctx.font = font(30, 800)
  ctx.fillText('N', 0, 34)
  ctx.restore()

  // Name tags next to the pins (the pins themselves are 3D). Tags on the right half of
  // the map go to the left of their pin, so they stay on the board.
  const tag = (x: number, z: number, text: string, color: string) => {
    const [u, v] = mapPoint(x, z)
    const px = u * MAP_W
    const py = v * MAP_H
    ctx.font = font(30, 700)
    const w = ctx.measureText(text).width + 28
    const left = u > 0.6 ? px - 30 - w : px + 30
    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    ctx.beginPath()
    ctx.roundRect(left, py - 24, w, 48, 24)
    ctx.fill()
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(px, py, 9, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = INK
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, left + 14, py + 1)
  }
  for (const l of labels) tag(l.x, l.z, l.text, l.color)
  tag(here[0], here[1], 'You are here', '#e2402e')
  return toTexture(c)
}

// Which side of its pin a map tag is on: -1 left, 1 right. (Matches mapTexture.)
export function tagSide(x: number, z: number) {
  return mapPoint(x, z)[0] > 0.6 ? -1 : 1
}
