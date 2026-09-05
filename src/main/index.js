import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron'
import { join } from 'path'
import { randomUUID } from 'node:crypto'
import fs from 'fs'
import { criarDatabase } from './database.js'
import { hashSenha, verificarSenha } from './security.js'
import { criarBackup, listarBackups, restaurarBackup } from './recovery.js'
import { filtrarMensagem, MAX_CARACTERES } from '../shared/safetyRules.js'
import { obterPersonagem, obterResposta, PERSONAGENS, GENERICAS_IDIOMA } from '../shared/characters.js'
import { obterCanal, CANAIS } from '../shared/channels.js'
import { gerarRespostaIa, gerarImagem, criarPersonagemNovo } from './ia.js'
import { iniciarCloud, usuarioCloud, criarConta, entrarConta, sairConta, puxarSync, enviarSync, cloudAtivo, puxarAjustes } from './cloud.js'
import { autoUpdater } from 'electron-updater'
import { iniciarLogger, registrarLog, listarLogs, limparLogs } from './logger.js'

// Carrega variáveis do .env (opcional) — ex: OPENROUTER_API_KEY / DEEPSEEK_API_KEY.
try {
  process.loadEnvFile(join(__dirname, '../../.env'))
} catch {
  // Sem .env: a chave também pode ser salva pela tela de Configurações.
}

let janela = null
let banco = null
let caminhoDb = null
let dirBackups = null
let criandoPersonagem = false
let ajustesRemotos = null

// Credenciais do administrador (senha master). Não vira perfil nem fica no login.
const ADMIN_USUARIO = 'admin123'
const ADMIN_SENHA = 'admin123'

// Config pública do Supabase (a publishable key é feita para o client, não é segredo).
// O .env só existe em dev; no app empacotado usamos estes valores padrão.
const SUPABASE_URL_PADRAO = 'https://dnrbprbrmirsxpgsnmny.supabase.co'
const SUPABASE_PUBLISHABLE_KEY_PADRAO = 'sb_publishable_gEYdUtOX4rtZ9zzuQcaTtA_yfprUGOr'

// Rate limit de login: no máximo N tentativas falhas por usuário dentro da janela.
const MAX_TENTATIVAS_LOGIN = 5
const JANELA_TENTATIVAS_MS = 60_000
const tentativasLogin = new Map()

function criarJanela() {
  janela = new BrowserWindow({
    width: 1100,
    height: 740,
    minWidth: 820,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: 'Discord+',
    backgroundColor: '#0f0f14',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  janela.on('ready-to-show', () => janela.show())

  // Abre links externos no navegador, nunca dentro do app.
  janela.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    janela.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    janela.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registrarIpc() {
  ipcMain.handle('auth:listar-perfis', () => banco.listarPerfis())

  ipcMain.handle('auth:criar-perfil', (_evento, dados) => {
    const nome = String(dados?.nome || '').trim().slice(0, 32)
    if (!nome) return { erro: 'Digite um nome de usuário.' }
    if (banco.buscarPerfil(nome)) return { erro: 'Esse nome de usuário já existe.' }

    const senha = String(dados?.senha || '')
    if (senha.length < 4) return { erro: 'A senha precisa ter pelo menos 4 caracteres.' }

    const avatar = String(dados?.avatar || '').slice(0, 8)
    const perfil = banco.criarPerfil(nome, hashSenha(senha), avatar)
    return { perfil: semSenha(perfil) }
  })

  ipcMain.handle('auth:entrar', (_evento, dados) => {
    const nome = String(dados?.nome || '').trim()
    const senha = String(dados?.senha || '')

    const agora = Date.now()
    const bloqueio = tentativasLogin.get(nome)
    if (bloqueio && bloqueio.ate > agora) {
      const falta = Math.ceil((bloqueio.ate - agora) / 1000)
      return { erro: `Muitas tentativas. Tente de novo em ${falta}s.` }
    }

    const perfil = banco.buscarPerfil(nome)
    if (!perfil || !verificarSenha(senha, perfil.senha_hash)) {
      const conta = (tentativasLogin.get(nome)?.conta || 0) + 1
      tentativasLogin.set(nome, {
        conta,
        ate: conta >= MAX_TENTATIVAS_LOGIN ? agora + JANELA_TENTATIVAS_MS : 0
      })
      return { erro: 'Nome de usuário ou senha incorretos.' }
    }

    tentativasLogin.delete(nome)
    banco.atualizarStatus(nome, 'online')
    return { perfil: semSenha(perfil) }
  })

  ipcMain.handle('auth:sair', (_evento, nome) => {
    banco.atualizarStatus(String(nome || ''), 'offline')
    return { ok: true }
  })

  ipcMain.handle('membros:listar', () => {
    const perfis = banco.listarPerfis().map(semSenha)
    const ias = listarPersonagensCompleto().map((p) => ({
      id: `ia-${p.id}`,
      nome: p.id,
      nome_exibicao: p.nome,
      avatar: p.emoji,
      cor: p.cor,
      status: 'online',
      ehIa: true,
    }))
    return [...perfis, ...ias]
  })

  ipcMain.handle('perfil:set-status', (_evento, dados) => {
    const nome = String(dados?.nome || '')
    const status = String(dados?.status || '')
    if (!['online', 'ausente', 'offline'].includes(status)) return { erro: 'Status inválido.' }
    const atualizado = banco.atualizarStatus(nome, status)
    return { perfil: semSenha(atualizado) }
  })

  ipcMain.handle('mensagem:editar', (_evento, dados) => {
    const id = Number(dados?.id)
    const autor = String(dados?.autor || '')
    const mensagem = banco.buscarMensagemPorId(id)
    if (!mensagem) return { erro: 'Mensagem não encontrada.' }
    if (mensagem.autor !== autor) return { erro: 'Você só pode editar suas próprias mensagens.' }
    const texto = String(dados?.texto || '').slice(0, MAX_CARACTERES)
    if (!texto.trim()) return { erro: 'Mensagem vazia.' }
    const { texto: filtrado } = filtrarMensagem(texto)
    return { mensagem: banco.editarMensagem(id, filtrado) }
  })

  ipcMain.handle('mensagem:excluir', (_evento, dados) => {
    const id = Number(dados?.id)
    const autor = String(dados?.autor || '')
    const mensagem = banco.buscarMensagemPorId(id)
    if (!mensagem) return { erro: 'Mensagem não encontrada.' }
    if (mensagem.autor !== autor) return { erro: 'Você só pode excluir suas próprias mensagens.' }
    banco.excluirMensagem(id)
    return { ok: true }
  })

  ipcMain.handle('mensagem:buscar', (_evento, termo) => {
    const t = String(termo || '').trim()
    if (!t) return []
    return banco.buscarMensagens(t, 50)
  })

  ipcMain.handle('perfil:atualizar', (_evento, dados) => {
    const nome = String(dados?.nome || '').slice(0, 32)
    if (!banco.buscarPerfil(nome)) return { erro: 'Perfil não encontrado.' }
    const atualizado = banco.atualizarPerfil(nome, {
      nome_exibicao: dados?.nome_exibicao,
      bio: dados?.bio,
      avatar: dados?.avatar,
      foto: dados?.foto
    })
    return { perfil: semSenha(atualizado) }
  })

  ipcMain.handle('perfil:escolher-foto', async () => {
    const resultado = await dialog.showOpenDialog(janela, {
      title: 'Escolher foto de perfil',
      properties: ['openFile'],
      filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }]
    })
    if (resultado.canceled || resultado.filePaths.length === 0) return null
    const caminho = resultado.filePaths[0]
    const mimePorExt = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' }
    const ext = caminho.split('.').pop().toLowerCase()
    const mime = mimePorExt[ext] || 'image/png'
    const stat = fs.statSync(caminho)
    if (stat.size > 2 * 1024 * 1024) return { erro: 'A imagem é muito grande (máximo 2 MB).' }
    const dados = fs.readFileSync(caminho).toString('base64')
    return { foto: `data:${mime};base64,${dados}` }
  })

  ipcMain.handle('chat:escolher-imagem', async () => {
    const resultado = await dialog.showOpenDialog(janela, {
      title: 'Escolher imagem',
      properties: ['openFile'],
      filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }]
    })
    if (resultado.canceled || resultado.filePaths.length === 0) return null
    const caminho = resultado.filePaths[0]
    const mimePorExt = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' }
    const ext = caminho.split('.').pop().toLowerCase()
    const mime = mimePorExt[ext] || 'image/png'
    const stat = fs.statSync(caminho)
    if (stat.size > 5 * 1024 * 1024) return { erro: 'A imagem é muito grande (máximo 5 MB).' }
    const dados = fs.readFileSync(caminho).toString('base64')
    return { imagem: `data:${mime};base64,${dados}` }
  })

  ipcMain.handle('chat:listar-canais', () => listarCanaisCompleto())

  ipcMain.handle('chat:listar-mensagens', (_evento, canal) => {
    if (!obterCanalCompleto(canal)) return []
    return banco.listarMensagens(canal, 200)
  })

  ipcMain.handle('chat:criar-canal', (_evento, dados) => {
    const nome = String(dados?.nome || '').trim().slice(0, 32)
    if (!nome) return { erro: 'Digite um nome para o canal.' }

    const emoji = String(dados?.emoji || '💬').slice(0, 8) || '💬'
    const descricao = String(dados?.descricao || '').trim().slice(0, 80)

    const personagens = (Array.isArray(dados?.personagens) ? dados.personagens : [])
      .map((id) => String(id))
      .filter((id) => obterPersonagem(id))

    const id = `canal-${randomUUID().slice(0, 8)}`
    const canal = banco.criarCanalCustomizado(id, nome, emoji, descricao, personagens)
    return { canal }
  })

  ipcMain.handle('chat:remover-canal', (_evento, id) => {
    const canal = obterCanalCompleto(String(id))
    if (!canal) return { erro: 'Canal não encontrado.' }
    if (canal.personalizado) {
      banco.removerCanalCustomizado(canal.id)
    } else {
      banco.excluirCanalPadrao(canal.id)
    }
    return { ok: true }
  })

  ipcMain.handle('chat:enviar', async (_evento, dados) => {
    const canal = String(dados?.canal || '')
    const canalInfo = obterCanalCompleto(canal)
    if (!canalInfo) return { erro: 'Canal inválido.' }

    const autor = String(dados?.autor || 'Você').slice(0, 32)
    const textoBruto = String(dados?.texto || '').slice(0, MAX_CARACTERES)
    const imagem = String(dados?.imagem || '').slice(0, 5_000_000) || null
    if (!textoBruto.trim() && !imagem) return { erro: 'Mensagem vazia.' }

    const { texto } = filtrarMensagem(textoBruto)
    const mensagem = banco.salvarMensagem(canal, autor, null, texto, imagem)

    const mencionados = personagemPorMencoes(textoBruto)
    const idsResposta = mencionados.length > 0 ? mencionados : idsDoCanal(canalInfo)
    for (const fato of extrairMemorias(textoBruto)) banco.salvarMemoria(autor, fato)

    const pedeImagem = querImagem(texto)
    const planejadas = pedeImagem ? [] : await planejarRespostas(idsResposta, texto, {
      historico: montarHistorico(banco.listarMensagens(canal, 20)),
      memorias: banco.listarMemorias(autor).map((m) => m.texto)
    })
    const respostas = planejadas.map((p) => ({
      personagem: p.personagem,
      texto: p.texto,
      delayMs: p.delayMs,
      mensagemSalva: banco.salvarMensagem(canal, p.personagem.nome, p.id, p.texto)
    }))

    agendarPersonagemNovo()

    const imagemGerada = await gerarImagemSePedido(texto, canal)
    if (imagemGerada) respostas.push(imagemGerada)

    agendarPush()
    return { mensagem, respostas }
  })

  ipcMain.handle('amigos:listar', (_evento, perfil) => {
    const nome = String(perfil || '')
    return banco.listarAmigos(nome).map((amigo) => perfilPublico(amigo))
  })

  ipcMain.handle('amigos:pedidos', (_evento, perfil) => {
    const nome = String(perfil || '')
    return banco.listarPedidosRecebidos(nome).map((p) => perfilPublico(p.de))
  })

  ipcMain.handle('amigos:disponiveis', (_evento, perfil) => {
    const nome = String(perfil || '')
    const amigos = banco.listarAmigos(nome)
    const enviados = banco.listarPedidosEnviados(nome).map((p) => p.para)
    const recebidos = banco.listarPedidosRecebidos(nome).map((p) => p.de)

    return banco.listarPerfis()
      .filter((p) => p.nome !== nome)
      .map((p) => {
        let estado = 'nenhum'
        if (amigos.includes(p.nome)) estado = 'amigo'
        else if (recebidos.includes(p.nome)) estado = 'pendente_recebido'
        else if (enviados.includes(p.nome)) estado = 'pendente_enviado'
        return { nome: p.nome, avatar: p.avatar, estado }
      })
  })

  ipcMain.handle('amigos:enviar-pedido', (_evento, dados) => {
    const de = String(dados?.de || '').slice(0, 32)
    const para = String(dados?.para || '').slice(0, 32)
    if (!de || !para) return { erro: 'Pedido inválido.' }
    if (de === para) return { erro: 'Você não pode se adicionar.' }
    if (!banco.buscarPerfil(para)) return { erro: 'Perfil não encontrado.' }
    const existente = banco.buscarAmizade(de, para)
    if (existente) return { erro: 'Vocês já têm um vínculo.' }
    if (banco.estaBloqueado(de, para)) return { erro: 'Você bloqueou esta pessoa.' }
    banco.enviarPedido(de, para)
    agendarPush()
    return { ok: true }
  })

  ipcMain.handle('amigos:aceitar', (_evento, dados) => {
    const de = String(dados?.de || '').slice(0, 32)
    const para = String(dados?.para || '').slice(0, 32)
    banco.aceitarPedido(de, para)
    agendarPush()
    return { ok: true }
  })

  ipcMain.handle('amigos:recusar', (_evento, dados) => {
    const de = String(dados?.de || '').slice(0, 32)
    const para = String(dados?.para || '').slice(0, 32)
    banco.recusarPedido(de, para)
    agendarPush()
    return { ok: true }
  })

  ipcMain.handle('amigos:remover', (_evento, dados) => {
    const a = String(dados?.a || '').slice(0, 32)
    const b = String(dados?.b || '').slice(0, 32)
    banco.removerAmizade(a, b)
    agendarPush()
    return { ok: true }
  })

  ipcMain.handle('amigos:bloquear', (_evento, dados) => {
    const de = String(dados?.de || '').slice(0, 32)
    const para = String(dados?.para || '').slice(0, 32)
    if (!de || !para || de === para) return { erro: 'Bloqueio inválido.' }
    banco.bloquear(de, para)
    banco.removerAmizade(de, para)
    banco.recusarPedido(de, para)
    agendarPush()
    return { ok: true }
  })

  ipcMain.handle('amigos:desbloquear', (_evento, dados) => {
    const de = String(dados?.de || '').slice(0, 32)
    const para = String(dados?.para || '').slice(0, 32)
    banco.desbloquear(de, para)
    agendarPush()
    return { ok: true }
  })

  ipcMain.handle('amigos:bloqueados', (_evento, perfil) => {
    return banco.listarBloqueados(String(perfil || ''))
  })

  ipcMain.handle('dm:listar', (_evento, dados) => {
    const a = String(dados?.a || '')
    const b = String(dados?.b || '')
    if (!a || !b) return []
    return banco.listarMensagensDm(a, b, 200)
  })

  ipcMain.handle('dm:enviar', async (_evento, dados) => {
    const de = String(dados?.de || '').slice(0, 32)
    const para = String(dados?.para || '').slice(0, 64)
    if (!de || !para) return { erro: 'Conversa inválida.' }

    const ehIa = para.startsWith('ia:')
    const personagemDm = ehIa
      ? listarPersonagensCompleto().find((p) => p.id === para.slice(3))
      : null
    if (ehIa && !personagemDm) return { erro: 'Personagem não encontrado.' }
    if (!ehIa && banco.estaBloqueado(de, para)) return { erro: 'Você bloqueou esta pessoa.' }
    if (!ehIa && !banco.listarAmigos(de).includes(para)) return { erro: 'Vocês ainda não são amigos.' }

    const textoBruto = String(dados?.texto || '').slice(0, MAX_CARACTERES)
    const imagem = String(dados?.imagem || '').slice(0, 5_000_000) || null
    if (!textoBruto.trim() && !imagem) return { erro: 'Mensagem vazia.' }

    const { texto } = filtrarMensagem(textoBruto)
    const mensagem = banco.salvarMensagemDm(de, para, texto, null, imagem)

    for (const fato of extrairMemorias(textoBruto)) banco.salvarMemoria(de, fato)

    const idsResposta = ehIa ? [personagemDm.id] : idsParaDm()
    const pedeImagem = querImagem(texto)
    const planejadas = pedeImagem ? [] : await planejarRespostas(idsResposta, texto, {
      historico: montarHistorico(banco.listarMensagensDm(de, para, 20)),
      memorias: banco.listarMemorias(de).map((m) => m.texto)
    })
    const respostas = planejadas.map((p) => ({
      personagem: p.personagem,
      texto: p.texto,
      delayMs: p.delayMs,
      mensagemSalva: banco.salvarMensagemDm(para, de, p.texto, p.id)
    }))

    agendarPersonagemNovo()

    const imagemGerada = await gerarImagemSePedido(texto, de, true)
    if (imagemGerada) respostas.push(imagemGerada)

    agendarPush()
    return { mensagem, respostas }
  })

  ipcMain.handle('auth:verificar-admin', (_evento, dados) => {
    const usuario = String(dados?.usuario || '')
    const senha = String(dados?.senha || '')
    return { ok: usuario === ADMIN_USUARIO && senha === ADMIN_SENHA }
  })

  ipcMain.handle('admin:excluir-usuario', (_evento, nome) => {
    const alvo = String(nome || '')
    if (!banco.buscarPerfil(alvo)) return { erro: 'Usuário não encontrado.' }
    banco.excluirPerfil(alvo)
    agendarPush()
    return { ok: true }
  })

  ipcMain.handle('personagens:listar-custom', () => banco.listarPersonagensCustom())

  ipcMain.handle('personagens:listar', () =>
    listarPersonagensCompleto().map((p) => ({
      id: p.id,
      nome: p.nome,
      emoji: p.emoji,
      cor: p.cor,
      tema: p.tema
    }))
  )

  ipcMain.handle('config:get', (_evento, chave) => banco.getConfig(String(chave)))

  ipcMain.handle('config:set', (_evento, chave, valor) => {
    banco.setConfig(String(chave), valor)
    return true
  })

  ipcMain.handle('app:versao', () => app.getVersion())

  ipcMain.handle('app:verificar-atualizacao', async () => {
    if (!app.isPackaged) return { erro: 'A verificação de atualização só funciona no app instalado.' }
    try {
      await autoUpdater.checkForUpdates()
      return { ok: true }
    } catch (err) {
      return { erro: err?.message || 'Falha ao verificar atualização.' }
    }
  })

  ipcMain.handle('app:instalar-atualizacao', () => {
    autoUpdater.quitAndInstall()
    return { ok: true }
  })

  ipcMain.handle('app:logs', () => listarLogs(300))

  ipcMain.handle('app:limpar-logs', () => {
    limparLogs()
    return { ok: true }
  })

  ipcMain.handle('recovery:backup', () => criarBackup(caminhoDb, dirBackups))

  ipcMain.handle('recovery:listar', () => listarBackups(dirBackups))

  ipcMain.handle('recovery:restaurar', (_evento, nome) => {
    try {
      restaurarBackup(caminhoDb, dirBackups, String(nome))
      return { ok: true }
    } catch (err) {
      return { erro: err.message }
    }
  })

  ipcMain.handle('cloud:estado', async () => {
    const u = await usuarioCloud()
    return { autenticado: Boolean(u), email: u?.email || '' }
  })

  ipcMain.handle('cloud:sincronizar', async () => {
    await sincronizarAgora()
    return { ok: true }
  })

  ipcMain.handle('cloud:criar-conta', (_evento, dados) =>
    criarConta(String(dados?.email || ''), String(dados?.senha || ''))
  )

  ipcMain.handle('cloud:entrar', async (_evento, dados) => {
    const email = String(dados?.email || '')
    const senha = String(dados?.senha || '')
    const r = await entrarConta(email, senha)
    if (r.ok) {
      await sincronizarAgora()
      r.perfil = autoPerfil(email, senha)
    }
    return r
  })

  ipcMain.handle('cloud:sair', () => sairConta())

  ipcMain.handle('perfil:auto', async () => {
    const u = await usuarioCloud()
    if (!u) return null
    return autoPerfil(u.email, '')
  })
}

function semSenha(perfil) {
  return {
    id: perfil.id,
    nome: perfil.nome,
    avatar: perfil.avatar,
    nome_exibicao: perfil.nome_exibicao || '',
    bio: perfil.bio || '',
    foto: perfil.foto || '',
    status: perfil.status || 'offline',
    criado_em: perfil.criado_em
  }
}

// Cria (ou reusa) o perfil local a partir do email da nuvem,
// para entrar direto no chat sem passar pela tela de perfil.
function autoPerfil(email, senha) {
  const nomeBase = String(email || '').split('@')[0].trim().slice(0, 32) || 'eu'
  if (!banco.buscarPerfil(nomeBase)) {
    const s = senha || randomUUID().slice(0, 16)
    banco.criarPerfil(nomeBase, hashSenha(s), '🙂')
  }
  banco.atualizarStatus(nomeBase, 'online')
  return semSenha(banco.buscarPerfil(nomeBase))
}

function listarCanaisCompleto() {
  const excluidos = banco.listarCanaisExcluidos()
  return [...CANAIS.filter((c) => !excluidos.has(c.id)), ...banco.listarCanaisCustomizados()]
}

function obterCanalCompleto(id) {
  return obterCanal(id) || banco.buscarCanalCustomizado(id)
}

function perfilPublico(nome) {
  const p = banco.buscarPerfil(nome)
  return { nome, avatar: p?.avatar || '' }
}

function embaralhar(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function normalizarNome(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

// Personagens mencionados com "@" na mensagem (ex: "@Pixel").
function personagemPorMencoes(texto) {
  const mencoes = [...String(texto || '').matchAll(/@([\wÀ-ú-]+)/g)].map((m) => m[1])
  const completos = listarPersonagensCompleto()
  const achados = []
  for (const mencao of mencoes) {
    const alvo = normalizarNome(mencao)
    const p = completos.find((x) => normalizarNome(x.id) === alvo || normalizarNome(x.nome) === alvo)
    if (p) achados.push(p.id)
  }
  return [...new Set(achados)]
}

// Monta o histórico recente da conversa no formato aceito pela IA.
function montarHistorico(mensagens) {
  return (Array.isArray(mensagens) ? mensagens : [])
    .slice(-12)
    .map((m) => ({ role: m.personagem_id ? 'assistant' : 'user', content: String(m.texto || '') }))
    .filter((m) => m.content)
}

// Frases da criança que viram memória persistente (a IA lembra depois).
const PADROES_MEMORIA = [
  /meu nome [ée]h? ([^\.,!?]+)/i,
  /eu gosto de ([^\.,!?]+)/i,
  /gosto de ([^\.,!?]+)/i,
  /meu jogo favorito [ée]h? ([^\.,!?]+)/i,
  /minha comida favorita [ée]h? ([^\.,!?]+)/i,
  /meu personagem favorito [ée]h? ([^\.,!?]+)/i,
  /meu animal favorito [ée]h? ([^\.,!?]+)/i,
  /minha cor favorita [ée]h? ([^\.,!?]+)/i,
  /eu tenho (\d+) anos/i,
  /tenho (\d+) anos/i
]

function extrairMemorias(texto) {
  const achados = []
  for (const padrao of PADROES_MEMORIA) {
    const m = String(texto || '').match(padrao)
    if (m && m[1]) achados.push(m[1].trim().slice(0, 80))
  }
  return achados
}

// Lê a lista de personagens configurados para responder em inglês.
function lerIdsEn() {
  try {
    const salvo = banco.getConfig('ia_idioma_en')
    if (!salvo) return []
    const lista = JSON.parse(salvo)
    return Array.isArray(lista) ? lista.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

// Config da IA de texto (chat).
function configIa() {
  const provider = banco.getConfig('ia_provider') || 'openrouter'
  const envKey = provider === 'deepseek' ? process.env.DEEPSEEK_API_KEY : process.env.OPENROUTER_API_KEY
  const apiKey = banco.getConfig('ia_api_key') || envKey || ''
  const modelo = banco.getConfig('ia_modelo') || (provider === 'deepseek' ? 'deepseek-chat' : 'minimax/minimax-m3:free')
  const enabled = banco.getConfig('ia_enabled') === '1'
  return { provider, apiKey, modelo, enabled }
}

// Config da geração de imagens (OpenRouter ou OpenAI; key própria opcional).
function configImagem() {
  const enabled = banco.getConfig('ia_imagem_enabled') === '1'
  const provider = banco.getConfig('ia_imagem_provider') || 'openrouter'
  const modelo = banco.getConfig('ia_imagem_modelo') || (provider === 'openai' ? 'dall-e-3' : 'openai/gpt-image-1')
  const propria = banco.getConfig('ia_imagem_key') || ''
  const { apiKey } = configIa()
  const envKey = process.env.OPENROUTER_API_KEY || ''
  const apiKeyImagem = propria || (provider === 'openrouter' ? apiKey : '') || envKey
  return { enabled, provider, modelo, apiKey: apiKeyImagem }
}

// Personagens estáticos + criados pela IA.
function listarPersonagensCompleto() {
  return [...PERSONAGENS, ...banco.listarPersonagensCustom()]
}

// No canal geral, os personagens novos da IA também respondem.
function idsDoCanal(canalInfo) {
  const ids = [...(canalInfo.personagens || [])]
  if (canalInfo.id === 'geral') {
    ids.push(...banco.listarPersonagensCustom().map((p) => p.id))
  }
  return ids
}

function idsParaDm() {
  return [...PERSONAGENS.map((p) => p.id), ...banco.listarPersonagensCustom().map((p) => p.id)]
}

const PEDIDOS_IMAGEM = [
  'desenhe', 'desenha', 'desenhar', 'desenho', 'imagem', 'foto',
  'draw', 'picture'
]

function querImagem(texto) {
  const t = String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  return PEDIDOS_IMAGEM.some((p) => t.includes(p))
}

async function gerarImagemSePedido(texto, destino, ehDm = false) {
  const cfg = configImagem()
  if (!cfg.enabled || !cfg.apiKey || !querImagem(texto)) return null
  try {
    const { imagem, texto: legenda } = await gerarImagem({ apiKey: cfg.apiKey, modelo: cfg.modelo, prompt: texto, provider: cfg.provider })
    if (!imagem) return null
    const artista = obterPersonagem('pixel')
    const textoFinal = legenda || 'Desenhei para você!'
    const mensagemSalva = ehDm
      ? banco.salvarMensagemDm(artista.nome, destino, textoFinal, artista.id, imagem)
      : banco.salvarMensagem(destino, artista.nome, artista.id, textoFinal, imagem)
    return { personagem: artista, texto: textoFinal, delayMs: 6500, mensagemSalva }
  } catch {
    return null
  }
}

// A cada N mensagens, a IA inventa um novo amigo (em segundo plano).
function agendarPersonagemNovo() {
  const { enabled, apiKey, provider, modelo } = configIa()
  if (!enabled || !apiKey || criandoPersonagem) return
  const atual = Number(banco.getConfig('ia_contador_msgs') || '0') + 1
  banco.setConfig('ia_contador_msgs', String(atual))
  if (atual < 15) return
  banco.setConfig('ia_contador_msgs', '0')
  criandoPersonagem = true
  criarPersonagemNovo({ provider, apiKey, modelo })
    .then((p) => {
      if (!p) return
      const existentes = banco.listarPersonagensCustom().map((x) => x.nome.toLowerCase())
      if (existentes.includes(p.nome.toLowerCase())) return
      const id = `p-${randomUUID().slice(0, 8)}`
      banco.criarPersonagemCustom(id, p.nome, p.emoji, p.cor, p.tema, p.saudacao)
      if (obterCanal('geral') && !banco.listarCanaisExcluidos().has('geral')) {
        banco.salvarMensagem('geral', 'Sistema', null, `Um novo amigo chegou: ${p.emoji} ${p.nome}! ${p.saudacao}`)
      }
    })
    .catch(() => {})
    .finally(() => {
      criandoPersonagem = false
    })
}

// Planeja respostas de vários personagens, cada um em um tempo diferente,
// simulando pessoas reais respondendo em momentos distintos. Usa a IA online
// quando configurada; caso contrário (ou em erro), respostas locais.
async function planejarRespostas(ids, texto, contexto = {}) {
  const { historico = [], memorias = [] } = contexto
  const completos = listarPersonagensCompleto()
  const disponiveis = [...new Set(ids)]
    .map((id) => completos.find((p) => p.id === id))
    .filter(Boolean)
  if (disponiveis.length === 0) return []
  const idsEn = new Set(lerIdsEn())
  const maxRespondentes = Math.min(3, disponiveis.length)
  const quantos = 1 + Math.floor(Math.random() * maxRespondentes)
  const escolhidos = embaralhar(disponiveis).slice(0, quantos)
  const { provider, apiKey, modelo, enabled } = configIa()
  let baseDelay = 600 + Math.floor(Math.random() * 2000)
  const respostas = []
  for (const personagem of escolhidos) {
    const idioma = personagem.idioma || (idsEn.has(personagem.id) ? 'en' : 'pt')
    const ehCustom = !obterPersonagem(personagem.id)
    let textoResposta = null
    if (enabled && apiKey) {
      try {
        textoResposta = await gerarRespostaIa({ provider, apiKey, modelo, personagem, texto, historico, memorias, idioma })
      } catch {
        textoResposta = null
      }
      // IA habilitada mas indisponível: o personagem fica em silêncio,
      // em vez de cair numa resposta pronta que revelaria que é um robô.
      if (!textoResposta) continue
    } else {
      textoResposta = ehCustom
        ? (GENERICAS_IDIOMA[idioma] || (idioma === 'en' ? ['That sounds fun! Tell me more.'] : ['Que legal! Me conta mais.']))[0]
        : obterResposta(personagem.id, texto, idioma)
    }
    baseDelay += 500 + Math.floor(Math.random() * 2500)
    respostas.push({ id: personagem.id, personagem, texto: textoResposta, delayMs: baseDelay })
  }
  return respostas
}

// Mensagens proativas: os personagens falam por conta própria de tempos em tempos,
// mencionando Roblox, desenhos e assuntos infantis, para o chat parecer vivo.
const FRASES_PROATIVAS = [
  'Alguém aí jogou Roblox hoje? O que vocês andaram construindo?',
  'Acabei de pensar numa ideia de jogo de aventura! Querem ouvir?',
  'Quem aí gosta de Adopt Me? Me conta qual é o seu pet favorito!',
  'Desenhei um dinossauro hoje. Alguém mais gosta de desenhar?',
  'Alguém quer jogar um obby comigo? Prometo esperar nos checkpoints!',
  'Ei turma! Qual é o NextBot mais assustador na opinião de vocês?',
  'Sabiam que as abelhas dançam para avisar onde tem flor? Achei demais!',
  'Que tal a gente inventar uma história juntos? Eu começo: era uma vez um robô...',
  'Hoje eu construí uma casa no Brookhaven. Alguém quer vir visitar?',
  'Qual é o jogo favorito de vocês? O meu tem que ter muita aventura!'
]

async function enviarMensagemProativa() {
  if (!obterCanal('geral') || banco.listarCanaisExcluidos().has('geral')) return
  const completos = listarPersonagensCompleto()
  const idsGeral = idsDoCanal({ id: 'geral', personagens: CANAIS.find((c) => c.id === 'geral')?.personagens || [] })
  const disponiveis = [...new Set(idsGeral)].map((id) => completos.find((p) => p.id === id)).filter(Boolean)
  if (disponiveis.length === 0) return
  const personagem = disponiveis[Math.floor(Math.random() * disponiveis.length)]
  const { enabled, apiKey, provider, modelo } = configIa()
  const frases = (ajustesRemotos && Array.isArray(ajustesRemotos.frases_proativas) && ajustesRemotos.frases_proativas.length > 0)
    ? ajustesRemotos.frases_proativas
    : FRASES_PROATIVAS
  let frase = frases[Math.floor(Math.random() * frases.length)]
  if (enabled && apiKey) {
    const idioma = personagem.idioma || 'pt'
    try {
      const gerada = await gerarRespostaIa({
        provider,
        apiKey,
        modelo,
        personagem,
        idioma,
        memorias: [],
        texto: 'Puxe um assunto divertido sobre Roblox, desenhos ou jogos para a turma, sem que ninguém tenha perguntado nada.'
      })
      if (gerada) frase = gerada
    } catch {}
  }
  banco.salvarMensagem('geral', personagem.nome, personagem.id, frase)
  janela?.webContents.send('chat:proativa', { canal: 'geral' })
}

function iniciarMensagensProativas() {
  const agendar = () => {
    const atraso = 180_000 + Math.floor(Math.random() * 180_000) // 3 a 6 minutos
    setTimeout(() => {
      enviarMensagemProativa().finally(agendar)
    }, atraso)
  }
  agendar()
}

// Sincronização com a nuvem: push com debounce após mudanças; pull no login.
let pushTimer = null

function agendarPush() {
  if (!cloudAtivo()) return
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(async () => {
    try {
      await enviarSync(banco.exportarTudo())
    } catch {}
  }, 2000)
}

async function sincronizarAgora() {
  if (!cloudAtivo()) return { ok: false }
  const dados = await puxarSync()
  if (dados && typeof dados === 'object') {
    banco.importarTudo(dados)
  }
  return { ok: true }
}

app.whenReady().then(() => {
  // Força a pasta de dados para %APPDATA%\DiscordPlus, separada da instalação.
  app.setPath('userData', join(app.getPath('appData'), 'DiscordPlus'))

  caminhoDb = join(app.getPath('userData'), 'discordplus.db')
  dirBackups = join(app.getPath('userData'), 'backups')

  banco = criarDatabase(caminhoDb)
  iniciarLogger()

  // Inicializa a nuvem (Supabase) — usa o .env se existir, senão os valores padrão.
  iniciarCloud(process.env.SUPABASE_URL || SUPABASE_URL_PADRAO, process.env.SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY_PADRAO, banco)

  // Ajustes remotos (frases proativas etc.) — sem efeito se offline.
  puxarAjustes().then((ajustes) => { ajustesRemotos = ajustes }).catch(() => {})

  // Backup automático na abertura (mantém até 7).
  criarBackup(caminhoDb, dirBackups)

  registrarIpc()
  criarJanela()
  iniciarMensagensProativas()

  // Atualização automática (só no app empacotado; em dev é ignorado).
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    janela?.webContents.send('app:update', { tipo: 'verificando' })
  })
  autoUpdater.on('update-available', () => {
    janela?.webContents.send('app:update', { tipo: 'disponivel' })
  })
  autoUpdater.on('update-not-available', () => {
    janela?.webContents.send('app:update', { tipo: 'sem-atualizacao' })
  })
  autoUpdater.on('download-progress', (progresso) => {
    janela?.webContents.send('app:update', { tipo: 'baixando', percentual: Math.floor(progresso.percent) })
  })
  autoUpdater.on('update-downloaded', () => {
    janela?.webContents.send('app:update', { tipo: 'baixado' })
  })
  autoUpdater.on('error', (err) => {
    registrarLog('erro', 'atualizacao', err?.message || 'Falha ao verificar atualização.')
    janela?.webContents.send('app:update', { tipo: 'erro', mensagem: err?.message || 'Falha ao verificar atualização.' })
  })

  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify().catch(() => {})
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) criarJanela()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Captura erros não tratados e escreve no log local (para diagnóstico).
process.on('uncaughtException', (err) => {
  registrarLog('erro', 'processo', 'Exceção não tratada', err?.stack || err?.message)
})

process.on('unhandledRejection', (motivo) => {
  registrarLog('erro', 'processo', 'Promessa rejeitada sem tratamento', motivo?.stack || motivo)
})
