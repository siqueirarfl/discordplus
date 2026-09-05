import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

// Hash de senha usando scrypt (seguro e sem dependência externa).
export function hashSenha(senha) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(senha, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verificarSenha(senha, salva) {
  if (!salva || !salva.includes(':')) return false
  const [salt, hash] = salva.split(':')
  const tentativa = scryptSync(senha, salt, 64)
  const esperada = Buffer.from(hash, 'hex')
  return tentativa.length === esperada.length && timingSafeEqual(tentativa, esperada)
}
