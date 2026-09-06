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

const PADROES_DADOS_PESSOAIS = [
  { tipo: 'telefone', regex: /(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?9?\d{4}[-.\s]?\d{4}/g },
  { tipo: 'email', regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { tipo: 'cpf', regex: /\b\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2}\b/g },
  { tipo: 'endereco', regex: /\b(?:rua|avenida|av\.?|travessa|alameda)\s+[\p{L}\d][\p{L}\d\s,.-]{4,}/giu },
  { tipo: 'contato externo', regex: /\b(?:whats(?:app)?|instagram|insta|telegram|snapchat|discord)\s*[:@-]?\s*[\w.@+-]{3,}/gi }
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

export function protegerDadosPessoais(texto) {
  let limpo = String(texto || '')
  const tipos = []
  for (const { tipo, regex } of PADROES_DADOS_PESSOAIS) {
    regex.lastIndex = 0
    if (!regex.test(limpo)) continue
    regex.lastIndex = 0
    limpo = limpo.replace(regex, '[informação protegida]')
    tipos.push(tipo)
  }
  return { texto: limpo, alterado: tipos.length > 0, tipos: [...new Set(tipos)] }
}

export function moderarMensagem(texto) {
  const dados = protegerDadosPessoais(texto)
  const linguagem = filtrarMensagem(dados.texto)
  return { texto: linguagem.texto, alterado: dados.alterado || linguagem.alterado, dadosProtegidos: dados.tipos }
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
