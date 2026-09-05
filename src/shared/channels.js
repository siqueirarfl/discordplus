// Canais de texto do Discord+ e quais personagens respondem em cada um.

export const CANAIS = [
  {
    id: 'geral',
    nome: 'Geral',
    emoji: '💬',
    descricao: 'Bate-papo geral',
    personagens: ['maxbot', 'luna', 'fritz', 'sakura']
  },
  {
    id: 'roblox',
    nome: 'Roblox',
    emoji: '🎮',
    descricao: 'Jogos, construções e obbys',
    personagens: ['robomax', 'block']
  },
  {
    id: 'desenhos',
    nome: 'Desenhos',
    emoji: '🎨',
    descricao: 'Arte, desenhos e humor',
    personagens: ['pixel', 'pibby']
  },
  {
    id: 'gmod',
    nome: 'Garry\'s Mod',
    emoji: '🧱',
    descricao: 'GMod, sandbox e criação',
    personagens: ['nexty', 'block']
  },
  {
    id: 'nextbots',
    nome: 'NextBots',
    emoji: '👾',
    descricao: 'NextBots e sustos divertidos',
    personagens: ['nexty']
  }
]

export function obterCanal(id) {
  return CANAIS.find((c) => c.id === id) || null
}
