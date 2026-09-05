// Regras de segurança e filtro de conteúdo para crianças.
// Aplicadas no processo principal, antes de salvar qualquer mensagem.

// Palavras inadequadas (minúsculas) que devem ser mascaradas com asteriscos.
export const PALAVRAS_BLOQUEADAS = [
  'merda',
  'porra',
  'caralho',
  'fdp',
  'idiota',
  'burro',
  'lixo',
  'odio',
  'morte',
  'matar',
  'suicidio',
  'arma',
  'sexo',
  'porno'
]

// Máscara uma palavra inadequada substituindo o meio por asteriscos.
function mascarar(palavra) {
  if (palavra.length <= 2) return '*'.repeat(palavra.length)
  return palavra[0] + '*'.repeat(palavra.length - 2) + palavra[palavra.length - 1]
}

// Aplica o filtro: devolve o texto limpo e se algo foi mascarado.
export function filtrarMensagem(texto) {
  let limpo = String(texto || '')
  let alterado = false
  for (const palavra of PALAVRAS_BLOQUEADAS) {
    const regex = new RegExp(palavra, 'gi')
    if (regex.test(limpo)) {
      limpo = limpo.replace(regex, mascarar(palavra))
      alterado = true
    }
  }
  return { texto: limpo, alterado }
}

// Limite de caracteres por mensagem.
export const MAX_CARACTERES = 1000

// Regras exibidas no painel dos responsáveis.
export const REGRAS_SEGURANCA = [
  'Nunca compartilhar nome completo, endereço ou telefone.',
  'Nunca compartilhar senhas com ninguém, nem com personagens.',
  'Tratar todos com respeito e gentileza.',
  'Se algo incomodar, avisar um responsável.',
  'Os personagens são brincadeira de computador, não pessoas de verdade.'
]
