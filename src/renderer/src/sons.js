let ctx = null

function obterCtx() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  } catch {
    return null
  }
}

export function tocarSomMensagem() {
  const c = obterCtx()
  if (!c) return
  try {
    const o = c.createOscillator()
    const g = c.createGain()
    o.connect(g)
    g.connect(c.destination)
    o.type = 'sine'
    o.frequency.value = 880
    const agora = c.currentTime
    g.gain.setValueAtTime(0.001, agora)
    g.gain.exponentialRampToValueAtTime(0.08, agora + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, agora + 0.25)
    o.start()
    o.stop(agora + 0.26)
  } catch {}
}
