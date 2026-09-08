import test from 'node:test'
import assert from 'node:assert/strict'
import { imagemDeRespostaPadrao } from '../src/shared/imageResponses.js'

test('OpenAI converte base64 em data URL', () => {
  const imagem = imagemDeRespostaPadrao({ data: [{ b64_json: 'YWJj', media_type: 'image/png' }] })
  assert.equal(imagem, 'data:image/png;base64,YWJj')
})

test('OpenAI devolve URL quando response_format é url', () => {
  const imagem = imagemDeRespostaPadrao({ data: [{ url: 'https://exemplo.com/imagem.png' }] })
  assert.equal(imagem, 'https://exemplo.com/imagem.png')
})

test('FLUX (BFL) devolve a URL em result.sample', () => {
  const imagem = imagemDeRespostaPadrao({ status: 'Ready', result: { sample: 'https://api.bfl.ai/imagem.png' } })
  assert.equal(imagem, 'https://api.bfl.ai/imagem.png')
})

test('Resposta sem imagem devolve null', () => {
  assert.equal(imagemDeRespostaPadrao({ status: 'Error' }), null)
})
