// Verifica que los pares texto/fondo de los tokens de index.css cumplan WCAG AA.
// Uso: node scripts/contraste.mjs  (sale con código 1 si algún par falla)

const luz = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => {
  const [x, y] = [luz(a), luz(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

// Debe coincidir con los valores de index.css.
const temas = {
  claro: {
    bg: '#FBF8F2', 'bg-subtle': '#F3EEE3', surface: '#FFFFFF', 'neutral-soft': '#ECE6D8',
    text: '#1E1A16', 'text-muted': '#5C5347', 'text-faint': '#736A5C',
    brand: '#1F3B32', 'text-on-brand': '#FBF8F2',
    accent: '#C9A050', 'text-on-accent': '#1E1A16', 'accent-hover': '#7A5716', 'accent-soft': '#F3E6CB',
    danger: '#A3352C', 'danger-soft': '#FBEAE8', success: '#22633F', 'success-soft': '#E4F3EA', info: '#2B5E94', 'info-soft': '#E6F0FA',
  },
  oscuro: {
    bg: '#0F1512', 'bg-subtle': '#151C18', surface: '#18211C', 'neutral-soft': '#222D27',
    text: '#F4EFE4', 'text-muted': '#B7B4A6', 'text-faint': '#8F9084',
    brand: '#2F6B55', 'text-on-brand': '#F4EFE4',
    accent: '#D9B26A', 'text-on-accent': '#1A1408', 'accent-hover': '#E8C98B', 'accent-soft': '#2B2A1C',
    danger: '#F09A90', 'danger-soft': '#33201E', success: '#7FD3A5', 'success-soft': '#1B2F25', info: '#8FBAEA', 'info-soft': '#1B2A3A',
  },
}

// [primer plano, fondo, mínimo]
const pares = [
  ['text', 'bg', 4.5], ['text', 'surface', 4.5], ['text', 'bg-subtle', 4.5],
  ['text-muted', 'bg', 4.5], ['text-muted', 'surface', 4.5], ['text-muted', 'bg-subtle', 4.5],
  ['text-faint', 'bg', 4.5], ['text-faint', 'surface', 4.5],
  ['text-on-brand', 'brand', 4.5], ['text-on-accent', 'accent', 4.5],
  ['accent-hover', 'bg', 4.5], ['accent-hover', 'surface', 4.5], ['accent-hover', 'accent-soft', 4.5],
  ['danger', 'surface', 4.5], ['danger', 'danger-soft', 4.5],
  ['success', 'surface', 4.5], ['success', 'success-soft', 4.5],
  ['info', 'surface', 4.5], ['info', 'info-soft', 4.5],
]

let fallos = 0
for (const [tema, t] of Object.entries(temas)) {
  for (const [fg, bg, min] of pares) {
    const r = ratio(t[fg], t[bg])
    const ok = r >= min
    if (!ok) fallos++
    console.log(`${ok ? 'OK  ' : 'FALLA'} ${tema.padEnd(6)} ${fg} sobre ${bg}: ${r.toFixed(2)} (mín ${min})`)
  }
}
console.log(fallos ? `\n${fallos} par(es) no cumplen AA` : '\nTodos los pares cumplen AA')
process.exit(fallos ? 1 : 0)
