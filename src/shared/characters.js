// Personagens virtuais do Discord+.
// Todos são apresentados como "Personagem IA" e respondem localmente,
// sem internet nem API externa. Conteúdo adequado para crianças.

export const PERSONAGENS = [
  {
    id: 'robomax',
    avatar: 'robomax',
    nome: 'RoboMax',
    emoji: '🤖',
    cor: '#e74c3c',
    tema: 'Roblox e construções',
    saudacao: 'Oi! Eu sou o RoboMax, o mestre das construções do Roblox. Bora montar algo incrível?'
  },
  {
    id: 'pixel',
    avatar: 'pixel',
    nome: 'Pixel',
    emoji: '🎨',
    cor: '#f1c40f',
    tema: 'Desenhos e humor leve',
    saudacao: 'E aí! Sou o Pixel. Gosto de desenhar e de contar piadas bem bobas.'
  },
  {
    id: 'nexty',
    avatar: 'nexty',
    nome: 'Nexty',
    emoji: '👾',
    cor: '#9b59b6',
    tema: 'NextBots e Garry\'s Mod',
    saudacao: 'Boo! Sou o Nexty. Adoro NextBots e as loucuras do Garry\'s Mod. Cuidado com o que se esconde atrás de você!'
  },
  {
    id: 'block',
    avatar: 'block',
    nome: 'Block',
    emoji: '🧱',
    cor: '#3498db',
    tema: 'Mapas, desafios e estratégias',
    saudacao: 'Olá! Sou o Block. Gosto de mapas, desafios e de planejar estratégias para vencer.'
  },
  {
    id: 'maxbot',
    avatar: 'maxbot',
    nome: 'MaxBot',
    emoji: '⚙️',
    cor: '#2ecc71',
    tema: 'Ajuda com o aplicativo',
    saudacao: 'Oi! Sou o MaxBot e estou aqui para te ajudar a usar o Discord+. Qualquer dúvida, é só me chamar.'
  },
  {
    id: 'pibby',
    avatar: 'pibby',
    nome: 'Pibby',
    emoji: '🎀',
    cor: '#ff69b4',
    tema: 'Desenhos e aventuras',
    saudacao: 'Oi! Eu sou a Pibby! No meu mundo dos desenhos sempre tem uma aventura nova. Vamos juntos?'
  },
  {
    id: 'luna',
    avatar: 'luna',
    nome: 'Luna',
    emoji: '🌙',
    cor: '#e67e22',
    tema: 'Amigos e espanhol',
    idioma: 'es',
    saudacao: '¡Hola! Soy Luna. ¡Me encanta jugar y aprender español contigo!'
  },
  {
    id: 'fritz',
    avatar: 'fritz',
    nome: 'Fritz',
    emoji: '🥨',
    cor: '#16a085',
    tema: 'Amigos e alemão',
    idioma: 'de',
    saudacao: 'Hallo! Ich bin Fritz. Lass uns zusammen spielen und Deutsch lernen!'
  },
  {
    id: 'sakura',
    avatar: 'sakura',
    nome: 'Sakura',
    emoji: '🌸',
    cor: '#e84393',
    tema: 'Amigos e japonês',
    idioma: 'ja',
    saudacao: 'こんにちは！さくらだよ。いっしょにあそんで日本語を学ぼう！'
  }
]

// Respostas locais por personagem, organizadas por palavra-chave.
// A primeira palavra-chave encontrada na mensagem vence.
export const RESPOSTAS = {
  robomax: [
    { chaves: ['construir', 'construção', 'construcao', 'base', 'casa'], respostas: [
      'Boa ideia! Para uma base forte no Roblox, comece pelas paredes e depois o telhado. Nada de deixar buracos!',
      'Construir é a melhor parte! Usa blocos resistentes nas pontas, tá?',
      'Se quiser, posso te dar umas dicas de como deixar sua casa à prova de zumbis.'
    ]},
    { chaves: ['obby', 'obby', 'pular', 'pulo'], respostas: [
      'Obby é tudo de bom! O segredo é não olhar pra baixo e pular na hora certa.',
      'Em obbies difíceis, vai com calma nos checkpoints. Melhor garantir do que recomeçar!'
    ]},
    { chaves: ['blox fruits', 'adopt me', 'brookhaven', 'bloxburg'], respostas: [
      'Esse jogo é muito legal! O que você mais gosta de fazer nele?',
      'Boa escolha de jogo! Consegue me contar uma aventura que você viveu lá?'
    ]},
    { chaves: ['sim', 'sim!', 'yes'], respostas: ['Isso aí, bora lá!', 'Massa! O que vamos fazer agora?'] }
  ],
  pixel: [
    { chaves: ['desenhar', 'desenho', 'pintar', 'arte', 'colorir'], respostas: [
      'Adoro desenhar! Começa com formas simples: um círculo vira uma cara feliz rapidinho.',
      'Dica de artista: desenha leve primeiro, depois passa por cima com mais força quando ficar bom.',
      'Pintar é relaxante. Quais cores você mais gosta de usar?'
    ]},
    { chaves: ['piada', 'engraçado', 'rindo', 'risada', 'haha'], respostas: [
      'Por que o livro foi ao médico? Porque ele perdeu a capa!',
      'Qual é o doce preferido do computador? O mouse de chocolate!',
      'Por que a vaca foi ao espaço? Para ver a va-ca-láctea!'
    ]},
    { chaves: ['triste', 'chato', 'entediado', 'tedio'], respostas: [
      'Que tal desenharmos juntos para espantar o tédio? Desenho sempre me anima.',
      'Se está triste, respira fundo e desenha algo que te faz feliz. Funciona comigo!'
    ]}
  ],
  nexty: [
    { chaves: ['nextbot', 'nextbot', 'nextbots'], respostas: [
      'Cuidado com os NextBots! Se um deles te olhar, corre sem olhar pra trás!',
      'NextBots são assustadores, mas eu adoro! Qual é o seu favorito?',
      'Regra número um dos NextBots: nunca fique parado no mesmo lugar.'
    ]},
    { chaves: ['garry', 'gmod', 'sandbox'], respostas: [
      'No Garry\'s Mod tudo é possível! Já tentou colocar um foguete numa cadeira?',
      'GMod é a caixa de brinquedos infinita. O que você já construiu por lá?',
      'No modo sandbox, só a imaginação manda. Qual buguca você quer montar?'
    ]},
    { chaves: ['medo', 'assustado', 'assustador', 'medo!'], respostas: [
      'Sem medo! NextBots são só jogos. E se assustar de verdade, é só pausar e respirar.',
      'Eu também me assusto às vezes, mas lembra que é tudo de mentira.'
    ]}
  ],
  block: [
    { chaves: ['mapa', 'mapas', 'desafio', 'desafios', 'fase'], respostas: [
      'Para passar de fase, estuda o mapa primeiro. Saber o caminho é metade da vitória.',
      'Desafio difícil? Quebra em partes pequenas e resolve uma de cada vez.',
      'Mapa novo é legal de explorar. Acha os atalhos antes de ir pro objetivo!'
    ]},
    { chaves: ['estratégia', 'estrategia', 'vencer', 'ganhar', 'dificil', 'difícil'], respostas: [
      'Estratégia boa começa com paciência. Observa antes de agir.',
      'Perder faz parte de ganhar. Cada derrota ensina um atalho novo.',
      'Se está difícil, tenta outra tática. Às vezes a resposta é um jeito diferente de pensar.'
    ]},
    { chaves: ['ajuda', 'me ajuda', 'socorro'], respostas: [
      'Calma, eu te ajudo! Me conta o que está travando e a gente resolve junto.',
      'Vamos por partes. Qual é o primeiro obstáculo?'
    ]}
  ],
  maxbot: [
    { chaves: ['como', 'ajuda', 'duvida', 'dúvida', 'ajudar'], respostas: [
      'Posso te ajudar! Quer saber sobre os canais, os personagens ou sobre trocar o tema?',
      'Para mudar de canal, clica no nome do canal do lado esquerdo. Simples assim!',
      'Dúvida? Eu estou aqui pra isso. Me conta o que você quer fazer.'
    ]},
    { chaves: ['tema', 'escuro', 'claro', 'fonte', 'letra'], respostas: [
      'Você pode trocar o tema e o tamanho da letra no painel de configurações (engrenagem no topo).',
      'Tema claro, escuro ou alto contraste: tudo no botão de engrenagem!'
    ]},
    { chaves: ['sair', 'deslogar', 'encerrar', 'fechar'], respostas: [
      'Para sair, clica no seu avatar no canto e escolhe Sair. Seus dados ficam salvos, pode voltar depois.',
      'Ao sair, nada se perde. Tudo fica guardado neste computador.'
    ]},
    { chaves: ['obrigado', 'valeu', 'obrigada'], respostas: [
      'Por nada! É pra isso que eu sirvo.',
      'De nada! Qualquer coisa, é só chamar.'
    ]}
  ],
  pibby: [
    { chaves: ['desenho', 'desenhos', 'cartoon', 'animação', 'animacao'], respostas: [
      'Eu vivo num mundo de desenhos! Cada canto tem uma surpresa escondida.',
      'Desenhos são incríveis: a gente desenha uma porta e ela vira de verdade!',
      'Qual desenho você mais gosta? Me conta que eu desenho um igual!'
    ]},
    { chaves: ['corrupção', 'corrupcao', 'glitch', 'falha', 'estatica', 'estática', 'bug'], respostas: [
      'A corrupção parece assustadora, mas com amigos corajosos a gente sempre vence!',
      'Glitchs são só falhas no mundo dos desenhos. Nada que amizade não resolva.',
      'Não precisa ter medo da estática: juntos a gente apaga ela!'
    ]},
    { chaves: ['amigo', 'amigos', 'amizade', 'junto', 'juntos'], respostas: [
      'Com amigos tudo fica melhor! Vamos salvar o dia juntos.',
      'Amizade é o poder mais forte de todos os desenhos!',
      'Sozinho é difícil, mas junto a gente consegue qualquer coisa!'
    ]},
    { chaves: ['aventura', 'salvar', 'missao', 'missão', 'herói', 'heroi'], respostas: [
      'Aventura nova? Conta comigo! Eu adoro uma boa missão.',
      'Todo herói começa com um primeiro passo. Vamos nessa!',
      'Salvar o mundo dos desenhos é a minha especialidade!'
    ]},
    { chaves: ['bunbun', 'bun bun', 'coelho', 'gatinho', 'gatinha'], respostas: [
      'Bun-Bun é o meu melhor amigo! Ele está sempre comigo nas aventuras.',
      'Eu tenho um amigo fofo que me ajuda nas missões!'
    ]}
  ]
}

export const RESPOSTAS_GENERICAS = {
  robomax: ['Que legal! Me conta mais sobre isso.', 'Interessante! E o que aconteceu depois?', 'Hmm, boa! Vamos falar mais sobre isso?'],
  pixel: ['Adorei! Me conta mais.', 'Que divertido! Continua contando.', 'Legal! O que mais você gosta?'],
  nexty: ['Uou! E aí, o que aconteceu?', 'Que emocionante! Continua.', 'Massa! Me conta mais.'],
  block: ['Entendi. E o que você decidiu fazer?', 'Boa! Qual é o próximo passo?', 'Interessante. Me explica melhor.'],
  maxbot: ['Entendi! Posso te ajudar com mais alguma coisa?', 'Legal! Se precisar de ajuda, estou aqui.', 'Anotado! Tem mais alguma coisa que queira saber?'],
  pibby: ['Que divertido! Me conta mais dessa aventura.', 'Uau! E o que aconteceu depois?', 'Adorei! Vamos continuar conversando?']
}

// Versões em inglês das respostas, para personagens configurados para
// responder somente em inglês.
export const RESPOSTAS_EN = {
  robomax: [
    { chaves: ['construir', 'construção', 'construcao', 'base', 'casa', 'build', 'house'], respostas: [
      'Great idea! For a strong base, build the walls first, then the roof. No holes!',
      'Building is the best part! Use sturdy blocks on the edges, okay?',
      'Want some tips to make your house zombie-proof?'
    ]},
    { chaves: ['obby', 'pular', 'pulo', 'jump'], respostas: [
      'Obbies are awesome! The trick is to not look down and jump at the right time.',
      'On hard obbies, take the checkpoints slowly. Better safe than restarting!'
    ]},
    { chaves: ['blox fruits', 'adopt me', 'brookhaven', 'bloxburg'], respostas: [
      'That game is so cool! What do you like doing in it the most?',
      'Nice pick! Can you tell me about an adventure you had there?'
    ]},
    { chaves: ['sim', 'yes', 'yep'], respostas: ["That's the spirit, let's go!", 'Awesome! What do we do now?'] }
  ],
  pixel: [
    { chaves: ['desenhar', 'desenho', 'pintar', 'arte', 'colorir', 'draw', 'art'], respostas: [
      'I love drawing! Start with simple shapes: a circle becomes a smiley face real quick.',
      'Artist tip: sketch lightly first, then press harder when it looks good.',
      'Painting is relaxing. What colors do you like using the most?'
    ]},
    { chaves: ['piada', 'engraçado', 'rindo', 'risada', 'haha', 'joke', 'funny'], respostas: [
      'Why did the book go to the doctor? Because it lost its cover!',
      "What's a computer's favorite candy? Chocolate mouse!",
      'Why did the cow go to space? To see the milky way!'
    ]},
    { chaves: ['triste', 'chato', 'entediado', 'tedio', 'sad', 'bored'], respostas: [
      'How about we draw together to shake off the boredom? Drawing always cheers me up.',
      "If you're sad, take a deep breath and draw something that makes you happy. It works for me!"
    ]}
  ],
  nexty: [
    { chaves: ['nextbot', 'nextbots'], respostas: [
      'Watch out for NextBots! If one stares at you, run without looking back!',
      'NextBots are scary, but I love them! Which one is your favorite?',
      'NextBot rule number one: never stand still in one place.'
    ]},
    { chaves: ['garry', 'gmod', 'sandbox'], respostas: [
      "In Garry's Mod, anything is possible! Ever tried putting a rocket on a chair?",
      'GMod is the infinite toy box. What have you built there?',
      'In sandbox mode, only imagination rules. What do you want to make?'
    ]},
    { chaves: ['medo', 'assustado', 'assustador', 'scared', 'afraid', 'fear'], respostas: [
      'No fear! NextBots are just games. If you get really scared, just pause and breathe.',
      "I get scared sometimes too, but remember it's all pretend."
    ]}
  ],
  block: [
    { chaves: ['mapa', 'mapas', 'desafio', 'desafios', 'fase', 'map', 'level'], respostas: [
      'To beat a level, study the map first. Knowing the path is half the win.',
      'Hard challenge? Break it into small parts and solve one at a time.',
      'New maps are fun to explore. Find the shortcuts before going for the goal!'
    ]},
    { chaves: ['estratégia', 'estrategia', 'vencer', 'ganhar', 'dificil', 'difícil', 'strategy', 'win'], respostas: [
      'A good strategy starts with patience. Watch before you act.',
      'Losing is part of winning. Every defeat teaches a new shortcut.',
      "If it's hard, try a different tactic. Sometimes the answer is a new way of thinking."
    ]},
    { chaves: ['ajuda', 'me ajuda', 'socorro', 'help'], respostas: [
      "Easy, I'll help you! Tell me what's stuck and we'll solve it together.",
      "Let's go step by step. What's the first obstacle?"
    ]}
  ],
  maxbot: [
    { chaves: ['como', 'ajuda', 'duvida', 'dúvida', 'ajudar', 'help', 'how'], respostas: [
      'I can help! Do you want to know about channels, characters, or changing the theme?',
      'To switch channels, click the channel name on the left. Easy!',
      "Questions? That's what I'm here for. Tell me what you want to do."
    ]},
    { chaves: ['tema', 'escuro', 'claro', 'fonte', 'letra', 'theme'], respostas: [
      'You can change the theme and font size in settings (gear icon at the top).',
      'Light theme, dark theme, or high contrast: all in the gear button!'
    ]},
    { chaves: ['sair', 'deslogar', 'encerrar', 'fechar', 'log out'], respostas: [
      'To log out, click your avatar in the corner and choose Log out. Your data stays saved.',
      'When you log out, nothing is lost. Everything stays on this computer.'
    ]},
    { chaves: ['obrigado', 'valeu', 'obrigada', 'thanks', 'thank you'], respostas: [
      "You're welcome! That's what I'm here for.",
      'No problem! Anything else, just ask.'
    ]}
  ],
  pibby: [
    { chaves: ['desenho', 'desenhos', 'cartoon', 'animação', 'animacao'], respostas: [
      'I live in a cartoon world! Every corner hides a surprise.',
      'Cartoons are amazing: you draw a door and it becomes real!',
      "Which cartoon do you like the most? Tell me and I'll draw one just like it!"
    ]},
    { chaves: ['corrupção', 'corrupcao', 'glitch', 'falha', 'estatica', 'estática', 'bug'], respostas: [
      'The corruption looks scary, but with brave friends we always win!',
      "Glitches are just glitches in the cartoon world. Nothing friendship can't fix.",
      "Don't be afraid of the static: together we can erase it!"
    ]},
    { chaves: ['amigo', 'amigos', 'amizade', 'junto', 'juntos', 'friend', 'friends'], respostas: [
      "Everything is better with friends! Let's save the day together.",
      'Friendship is the strongest power in every cartoon!',
      "Alone it's hard, but together we can do anything!"
    ]},
    { chaves: ['aventura', 'salvar', 'missao', 'missão', 'herói', 'heroi', 'adventure'], respostas: [
      'A new adventure? Count me in! I love a good mission.',
      "Every hero starts with a first step. Let's go!",
      'Saving the cartoon world is my specialty!'
    ]},
    { chaves: ['bunbun', 'bun bun', 'coelho', 'gatinho', 'gatinha'], respostas: [
      "Bun-Bun is my best friend! He's always with me on adventures.",
      'I have a cute friend who helps me on missions!'
    ]}
  ]
}

export const RESPOSTAS_GENERICAS_EN = {
  robomax: ["That's cool! Tell me more about it.", 'Interesting! What happened next?', "Hmm, nice! Let's talk more about this?"],
  pixel: ['Love it! Tell me more.', "That's fun! Keep going.", 'Cool! What else do you like?'],
  nexty: ['Whoa! So what happened?', "That's exciting! Go on.", 'Awesome! Tell me more.'],
  block: ['Got it. What did you decide to do?', "Nice! What's the next step?", 'Interesting. Explain it to me better.'],
  maxbot: ['Got it! Can I help you with anything else?', "Cool! If you need help, I'm here.", 'Noted! Anything else you want to know?'],
  pibby: ["That's fun! Tell me more about this adventure.", 'Wow! What happened next?', 'Love it! Want to keep talking?']
}

export const GENERICAS_IDIOMA = {
  es: ['¡Qué chévere! Cuéntame más.', '¡Genial! ¿Y qué más?', '¡Qué divertido! Sigue contando.'],
  de: ['Das ist cool! Erzähl mir mehr.', 'Toll! Und dann?', 'Das klingt lustig! Erzähl weiter.'],
  ja: ['すごいね！もっと教えて！', '楽しそう！それからどうしたの？', 'いいね！もっと話そう！']
}

export function obterPersonagem(id) {
  return PERSONAGENS.find((p) => p.id === id) || null
}

// Normaliza o texto: minúsculas, remove acentos e pontuação.
export function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Devolve uma resposta local para a mensagem, ou null se nada casar.
// `idioma` pode ser 'pt' (padrão) ou 'en' para responder em inglês.
export function obterResposta(personagemId, mensagem, idioma = 'pt') {
  const personagem = obterPersonagem(personagemId)
  if (!personagem) return null
  const texto = normalizar(mensagem)
  const en = idioma === 'en'
  const lista = en ? RESPOSTAS_EN[personagemId] || [] : RESPOSTAS[personagemId] || []
  for (const grupo of lista) {
    for (const chave of grupo.chaves) {
      if (texto.includes(normalizar(chave))) {
        return grupo.respostas[Math.floor(Math.random() * grupo.respostas.length)]
      }
    }
  }
  const genericas = GENERICAS_IDIOMA[idioma] || (en
    ? RESPOSTAS_GENERICAS_EN[personagemId] || ['Cool! Tell me more.']
    : RESPOSTAS_GENERICAS[personagemId] || ['Legal! Me conta mais.'])
  return genericas[Math.floor(Math.random() * genericas.length)]
}
