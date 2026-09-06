import test from 'node:test'
import assert from 'node:assert/strict'
import { moderarMensagem, protegerDadosPessoais } from '../src/shared/safetyRules.js'

test('protege telefone, email e CPF antes de persistir', () => {
  const r = protegerDadosPessoais('me chama 4199999-1234, eu@exemplo.com, CPF 123.456.789-10')
  assert.equal(r.alterado, true)
  assert.equal(r.texto.includes('99999'), false)
  assert.equal(r.texto.includes('@exemplo.com'), false)
  assert.equal(r.texto.includes('123.456'), false)
})

test('protege contato externo e linguagem inadequada', () => {
  const r = moderarMensagem('meu instagram @usuario123, seu idiota')
  assert.match(r.texto, /\[informação protegida\]/)
  assert.doesNotMatch(r.texto, /idiota/i)
})

test('não altera conversa comum', () => {
  const r = moderarMensagem('vamos jogar Roblox depois da escola?')
  assert.equal(r.alterado, false)
})
