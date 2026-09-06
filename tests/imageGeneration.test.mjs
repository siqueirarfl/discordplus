import test from 'node:test'
import assert from 'node:assert/strict'
import { conteudoDeRespostaGemini, imagemDeRespostaPadrao } from '../src/shared/imageResponses.js'

test('OpenRouter converte base64 em data URL', () => {
  const imagem = imagemDeRespostaPadrao({ data: [{ b64_json: 'YWJj', media_type: 'image/png' }] })
  assert.equal(imagem, 'data:image/png;base64,YWJj')
})

test('Gemini interpreta inlineData da resposta multimodal', () => {
  const resposta = conteudoDeRespostaGemini({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/webp', data: 'eHl6' }] } }] } })
  assert.equal(resposta.imagem, 'data:image/webp;base64,eHl6')
})
