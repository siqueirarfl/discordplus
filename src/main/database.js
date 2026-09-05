import { DatabaseSync } from 'node:sqlite'
import fs from 'fs'
import path from 'path'

// Cria (ou abre) o banco SQLite local e devolve uma API síncrona e simples.
// Usa o módulo node:sqlite (embutido no Node/Electron), sem dependência nativa.
export function criarDatabase(caminhoDb) {
  const dir = path.dirname(caminhoDb)
  fs.mkdirSync(dir, { recursive: true })

  const db = new DatabaseSync(caminhoDb)
  db.exec('PRAGMA journal_mode = WAL;')
  db.exec('PRAGMA foreign_keys = ON;')

  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      criado_em INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mensagens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      canal TEXT NOT NULL,
      autor TEXT NOT NULL,
      personagem_id TEXT DEFAULT NULL,
      texto TEXT NOT NULL,
      criado_em INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_mensagens_canal ON mensagens (canal, criado_em);

    CREATE TABLE IF NOT EXISTS config (
      chave TEXT PRIMARY KEY,
      valor TEXT
    );

    CREATE TABLE IF NOT EXISTS canais (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      emoji TEXT DEFAULT '💬',
      descricao TEXT DEFAULT '',
      personagens TEXT DEFAULT '[]',
      criado_em INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS amizades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      de TEXT NOT NULL,
      para TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendente',
      criado_em INTEGER NOT NULL,
      UNIQUE (de, para)
    );

    CREATE TABLE IF NOT EXISTS mensagens_dm (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      de TEXT NOT NULL,
      para TEXT NOT NULL,
      texto TEXT NOT NULL,
      personagem_id TEXT DEFAULT NULL,
      criado_em INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_mensagens_dm_participantes ON mensagens_dm (de, para, criado_em);

    CREATE TABLE IF NOT EXISTS personagens_custom (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      emoji TEXT DEFAULT '🙂',
      cor TEXT DEFAULT '#5865f2',
      tema TEXT DEFAULT '',
      saudacao TEXT DEFAULT '',
      criado_em INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS canais_excluidos (
      id TEXT PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS memorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      de TEXT NOT NULL,
      texto TEXT NOT NULL,
      criado_em INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_memorias_de ON memorias (de, criado_em);

    CREATE TABLE IF NOT EXISTS bloqueios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      de TEXT NOT NULL,
      para TEXT NOT NULL,
      criado_em INTEGER NOT NULL,
      UNIQUE(de, para)
    );
  `)

  // Migração leve: garante colunas novas em bancos criados antes.
  function garantirColuna(tabela, coluna, tipo) {
    const colunas = db.prepare(`PRAGMA table_info(${tabela})`).all()
    if (!colunas.some((c) => c.name === coluna)) {
      db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${tipo}`)
    }
  }
  garantirColuna('mensagens', 'imagem', 'TEXT DEFAULT NULL')
  garantirColuna('mensagens_dm', 'imagem', 'TEXT DEFAULT NULL')
  garantirColuna('profiles', 'nome_exibicao', "TEXT DEFAULT ''")
  garantirColuna('profiles', 'bio', "TEXT DEFAULT ''")
  garantirColuna('profiles', 'foto', "TEXT DEFAULT ''")
  garantirColuna('profiles', 'status', "TEXT DEFAULT 'offline'")

  const criarPerfilStmt = db.prepare(
    'INSERT INTO profiles (nome, senha_hash, avatar, criado_em) VALUES (?, ?, ?, ?)'
  )
  const buscarPerfilStmt = db.prepare('SELECT * FROM profiles WHERE nome = ?')
  const listarPerfisStmt = db.prepare(
    'SELECT id, nome, avatar, nome_exibicao, bio, foto, status, criado_em FROM profiles ORDER BY nome'
  )
  const atualizarPerfilStmt = db.prepare(
    'UPDATE profiles SET nome_exibicao = ?, bio = ?, avatar = ?, foto = ? WHERE nome = ?'
  )
  const atualizarStatusStmt = db.prepare('UPDATE profiles SET status = ? WHERE nome = ?')
  const buscarMensagemPorIdStmt = db.prepare('SELECT * FROM mensagens WHERE id = ?')
  const editarMensagemStmt = db.prepare('UPDATE mensagens SET texto = ? WHERE id = ?')
  const excluirMensagemStmt = db.prepare('DELETE FROM mensagens WHERE id = ?')
  const buscarMensagensStmt = db.prepare(
    "SELECT id, canal, autor, personagem_id, texto, imagem, criado_em FROM mensagens WHERE texto LIKE ? ORDER BY id DESC LIMIT ?"
  )
  const inserirMensagemStmt = db.prepare(
    'INSERT INTO mensagens (canal, autor, personagem_id, texto, imagem, criado_em) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const listarMensagensStmt = db.prepare(
    'SELECT id, canal, autor, personagem_id, texto, imagem, criado_em FROM mensagens WHERE canal = ? ORDER BY id ASC LIMIT ?'
  )
  const getConfigStmt = db.prepare('SELECT valor FROM config WHERE chave = ?')
  const setConfigStmt = db.prepare(
    'INSERT INTO config (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor'
  )
  const listarCanaisStmt = db.prepare(
    'SELECT id, nome, emoji, descricao, personagens, criado_em FROM canais ORDER BY criado_em ASC'
  )
  const buscarCanalStmt = db.prepare(
    'SELECT id, nome, emoji, descricao, personagens, criado_em FROM canais WHERE id = ?'
  )
  const criarCanalStmt = db.prepare(
    'INSERT INTO canais (id, nome, emoji, descricao, personagens, criado_em) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const removerCanalStmt = db.prepare('DELETE FROM canais WHERE id = ?')
  const removerMensagensDoCanalStmt = db.prepare('DELETE FROM mensagens WHERE canal = ?')
  const excluirCanalPadraoStmt = db.prepare('INSERT OR IGNORE INTO canais_excluidos (id) VALUES (?)')
  const listarCanaisExcluidosStmt = db.prepare('SELECT id FROM canais_excluidos')

  const inserirMemoriaStmt = db.prepare('INSERT INTO memorias (de, texto, criado_em) VALUES (?, ?, ?)')
  const listarMemoriasStmt = db.prepare('SELECT id, de, texto, criado_em FROM memorias WHERE de = ? ORDER BY id DESC LIMIT ?')
  const buscarMemoriaStmt = db.prepare('SELECT id FROM memorias WHERE de = ? AND texto = ?')

  const excluirPerfilStmt = db.prepare('DELETE FROM profiles WHERE nome = ?')
  const excluirMensagensAutorStmt = db.prepare('DELETE FROM mensagens WHERE autor = ?')
  const excluirDmAutorStmt = db.prepare('DELETE FROM mensagens_dm WHERE de = ? OR para = ?')
  const excluirMemoriasAutorStmt = db.prepare('DELETE FROM memorias WHERE de = ?')
  const excluirAmizadesAutorStmt = db.prepare('DELETE FROM amizades WHERE de = ? OR para = ?')

  const bloquearStmt = db.prepare('INSERT OR IGNORE INTO bloqueios (de, para, criado_em) VALUES (?, ?, ?)')
  const desbloquearStmt = db.prepare('DELETE FROM bloqueios WHERE de = ? AND para = ?')
  const listarBloqueadosStmt = db.prepare('SELECT para FROM bloqueios WHERE de = ? ORDER BY criado_em ASC')
  const estaBloqueadoStmt = db.prepare('SELECT 1 FROM bloqueios WHERE de = ? AND para = ?')

  const listarPersonagensCustomStmt = db.prepare(
    'SELECT id, nome, emoji, cor, tema, saudacao, criado_em FROM personagens_custom ORDER BY criado_em ASC'
  )
  const criarPersonagemCustomStmt = db.prepare(
    'INSERT INTO personagens_custom (id, nome, emoji, cor, tema, saudacao, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )

  // Exportação/importação completa (para sincronizar com a nuvem).
  const exportarPerfisStmt = db.prepare('SELECT id, nome, senha_hash, avatar, nome_exibicao, bio, foto, status, criado_em FROM profiles')
  const exportarMensagensStmt = db.prepare('SELECT id, canal, autor, personagem_id, texto, imagem, criado_em FROM mensagens')
  const exportarAmizadesStmt = db.prepare('SELECT id, de, para, status, criado_em FROM amizades')
  const exportarDmStmt = db.prepare('SELECT id, de, para, texto, personagem_id, imagem, criado_em FROM mensagens_dm')
  const exportarMemoriasStmt = db.prepare('SELECT id, de, texto, criado_em FROM memorias')

  const limparPerfisStmt = db.prepare('DELETE FROM profiles')
  const limparMensagensStmt = db.prepare('DELETE FROM mensagens')
  const limparCanaisStmt = db.prepare('DELETE FROM canais')
  const limparCanaisExcluidosStmt = db.prepare('DELETE FROM canais_excluidos')
  const limparAmizadesStmt = db.prepare('DELETE FROM amizades')
  const limparDmStmt = db.prepare('DELETE FROM mensagens_dm')
  const limparMemoriasStmt = db.prepare('DELETE FROM memorias')
  const limparPersonagensCustomStmt = db.prepare('DELETE FROM personagens_custom')

  const inserirPerfilFullStmt = db.prepare(
    'INSERT INTO profiles (id, nome, senha_hash, avatar, nome_exibicao, bio, foto, status, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const inserirMensagemFullStmt = db.prepare(
    'INSERT INTO mensagens (id, canal, autor, personagem_id, texto, imagem, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const inserirAmizadeFullStmt = db.prepare(
    'INSERT INTO amizades (id, de, para, status, criado_em) VALUES (?, ?, ?, ?, ?)'
  )
  const inserirDmFullStmt = db.prepare(
    'INSERT INTO mensagens_dm (id, de, para, texto, personagem_id, imagem, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const inserirMemoriaFullStmt = db.prepare(
    'INSERT INTO memorias (id, de, texto, criado_em) VALUES (?, ?, ?, ?)'
  )
  const exportarBloqueiosStmt = db.prepare('SELECT id, de, para, criado_em FROM bloqueios')
  const limparBloqueiosStmt = db.prepare('DELETE FROM bloqueios')
  const inserirBloqueioFullStmt = db.prepare(
    'INSERT INTO bloqueios (id, de, para, criado_em) VALUES (?, ?, ?, ?)'
  )

  const listarPedidosRecebidosStmt = db.prepare(
    "SELECT de, criado_em FROM amizades WHERE para = ? AND status = 'pendente' ORDER BY criado_em ASC"
  )
  const listarPedidosEnviadosStmt = db.prepare(
    "SELECT para, criado_em FROM amizades WHERE de = ? AND status = 'pendente' ORDER BY criado_em ASC"
  )
  const listarAmizadesAceitasStmt = db.prepare(
    "SELECT de, para FROM amizades WHERE status = 'aceito' AND (de = ? OR para = ?) ORDER BY criado_em ASC"
  )
  const buscarAmizadeStmt = db.prepare(
    'SELECT * FROM amizades WHERE (de = ? AND para = ?) OR (de = ? AND para = ?)'
  )
  const enviarPedidoStmt = db.prepare(
    'INSERT INTO amizades (de, para, status, criado_em) VALUES (?, ?, ?, ?)'
  )
  const aceitarPedidoStmt = db.prepare(
    "UPDATE amizades SET status = 'aceito' WHERE de = ? AND para = ? AND status = 'pendente'"
  )
  const removerAmizadeStmt = db.prepare(
    'DELETE FROM amizades WHERE (de = ? AND para = ?) OR (de = ? AND para = ?)'
  )
  const salvarDmStmt = db.prepare(
    'INSERT INTO mensagens_dm (de, para, texto, personagem_id, imagem, criado_em) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const listarDmStmt = db.prepare(
    'SELECT id, de, para, texto, personagem_id, imagem, criado_em FROM mensagens_dm WHERE (de = ? AND para = ?) OR (de = ? AND para = ?) ORDER BY id ASC LIMIT ?'
  )

  function parsePersonagens(json) {
    try {
      const arr = JSON.parse(json)
      return Array.isArray(arr) ? arr : []
    } catch {
      return []
    }
  }

  return {
    raw: db,

    criarPerfil(nome, senhaHash, avatar = '') {
      const agora = Date.now()
      criarPerfilStmt.run(nome, senhaHash, avatar, agora)
      return buscarPerfilStmt.get(nome) ?? null
    },

    buscarPerfil(nome) {
      return buscarPerfilStmt.get(nome) ?? null
    },

    listarPerfis() {
      return listarPerfisStmt.all()
    },

    atualizarPerfil(nome, campos = {}) {
      const atual = buscarPerfilStmt.get(nome)
      if (!atual) return null
      atualizarPerfilStmt.run(
        String(campos.nome_exibicao ?? atual.nome_exibicao ?? '').slice(0, 40),
        String(campos.bio ?? atual.bio ?? '').slice(0, 200),
        String(campos.avatar ?? atual.avatar ?? '').slice(0, 8),
        String(campos.foto ?? atual.foto ?? '').slice(0, 2_000_000),
        nome
      )
      return buscarPerfilStmt.get(nome) ?? null
    },

    atualizarStatus(nome, status) {
      atualizarStatusStmt.run(String(status), nome)
      return buscarPerfilStmt.get(nome) ?? null
    },

    salvarMensagem(canal, autor, personagemId, texto, imagem = null) {
      const agora = Date.now()
      const info = inserirMensagemStmt.run(canal, autor, personagemId, texto, imagem, agora)
      return {
        id: Number(info.lastInsertRowid),
        canal,
        autor,
        personagem_id: personagemId,
        texto,
        imagem,
        criado_em: agora
      }
    },

    listarMensagens(canal, limite = 200) {
      return listarMensagensStmt.all(canal, limite)
    },

    buscarMensagemPorId(id) {
      return buscarMensagemPorIdStmt.get(id) ?? null
    },

    editarMensagem(id, texto) {
      editarMensagemStmt.run(texto, id)
      return buscarMensagemPorIdStmt.get(id) ?? null
    },

    excluirMensagem(id) {
      return Number(excluirMensagemStmt.run(id).changes) > 0
    },

    buscarMensagens(termo, limite = 50) {
      return buscarMensagensStmt.all(`%${termo}%`, limite)
    },

    getConfig(chave) {
      const linha = getConfigStmt.get(chave)
      return linha ? linha.valor : null
    },

    setConfig(chave, valor) {
      setConfigStmt.run(chave, String(valor))
    },

    listarCanaisCustomizados() {
      return listarCanaisStmt.all().map((c) => ({
        ...c,
        personagens: parsePersonagens(c.personagens),
        personalizado: true
      }))
    },

    buscarCanalCustomizado(id) {
      const c = buscarCanalStmt.get(id)
      if (!c) return null
      return { ...c, personagens: parsePersonagens(c.personagens), personalizado: true }
    },

    criarCanalCustomizado(id, nome, emoji, descricao, personagens) {
      const agora = Date.now()
      criarCanalStmt.run(id, nome, emoji, descricao, JSON.stringify(personagens), agora)
      const c = buscarCanalStmt.get(id)
      return { ...c, personagens: parsePersonagens(c.personagens), personalizado: true }
    },

    removerCanalCustomizado(id) {
      const info = removerCanalStmt.run(id)
      removerMensagensDoCanalStmt.run(id)
      return Number(info.changes) > 0
    },

    excluirCanalPadrao(id) {
      excluirCanalPadraoStmt.run(id)
      removerMensagensDoCanalStmt.run(id)
      return true
    },

    listarCanaisExcluidos() {
      return new Set(listarCanaisExcluidosStmt.all().map((c) => c.id))
    },

    salvarMemoria(de, texto) {
      const t = String(texto || '').trim().slice(0, 120)
      if (!t) return false
      if (buscarMemoriaStmt.get(de, t)) return false
      inserirMemoriaStmt.run(de, t, Date.now())
      return true
    },

    listarMemorias(de, limite = 20) {
      return listarMemoriasStmt.all(de, limite)
    },

    excluirPerfil(nome) {
      const info = excluirPerfilStmt.run(nome)
      if (Number(info.changes) === 0) return false
      excluirMensagensAutorStmt.run(nome)
      excluirDmAutorStmt.run(nome, nome)
      excluirMemoriasAutorStmt.run(nome)
      excluirAmizadesAutorStmt.run(nome, nome)
      return true
    },

    bloquear(de, para) {
      bloquearStmt.run(de, para, Date.now())
      return true
    },

    desbloquear(de, para) {
      return Number(desbloquearStmt.run(de, para).changes) > 0
    },

    listarBloqueados(de) {
      return listarBloqueadosStmt.all(de).map((r) => r.para)
    },

    estaBloqueado(de, para) {
      return Boolean(estaBloqueadoStmt.get(de, para))
    },

    listarPedidosRecebidos(perfil) {
      return listarPedidosRecebidosStmt.all(perfil)
    },

    listarPedidosEnviados(perfil) {
      return listarPedidosEnviadosStmt.all(perfil)
    },

    listarAmigos(perfil) {
      return listarAmizadesAceitasStmt.all(perfil, perfil).map((r) => (r.de === perfil ? r.para : r.de))
    },

    buscarAmizade(a, b) {
      return buscarAmizadeStmt.get(a, b, b, a) ?? null
    },

    enviarPedido(de, para) {
      enviarPedidoStmt.run(de, para, 'pendente', Date.now())
      return true
    },

    aceitarPedido(de, para) {
      return Number(aceitarPedidoStmt.run(de, para).changes) > 0
    },

    recusarPedido(de, para) {
      return Number(removerAmizadeStmt.run(de, para, de, para).changes) > 0
    },

    removerAmizade(a, b) {
      return Number(removerAmizadeStmt.run(a, b, b, a).changes) > 0
    },

    salvarMensagemDm(de, para, texto, personagemId = null, imagem = null) {
      const agora = Date.now()
      const info = salvarDmStmt.run(de, para, texto, personagemId, imagem, agora)
      return {
        id: Number(info.lastInsertRowid),
        de,
        para,
        autor: de,
        texto,
        personagem_id: personagemId,
        imagem,
        criado_em: agora
      }
    },

    listarMensagensDm(a, b, limite = 200) {
      return listarDmStmt.all(a, b, b, a, limite).map((m) => ({ ...m, autor: m.de }))
    },

    listarPersonagensCustom() {
      return listarPersonagensCustomStmt.all()
    },

    criarPersonagemCustom(id, nome, emoji, cor, tema, saudacao) {
      criarPersonagemCustomStmt.run(id, nome, emoji, cor, tema, saudacao, Date.now())
      return { id, nome, emoji, cor, tema, saudacao }
    },

    exportarTudo() {
      return {
        perfis: exportarPerfisStmt.all(),
        mensagens: exportarMensagensStmt.all(),
        canais: listarCanaisStmt.all(),
        canais_excluidos: listarCanaisExcluidosStmt.all().map((c) => c.id),
        amizades: exportarAmizadesStmt.all(),
        mensagens_dm: exportarDmStmt.all(),
        memorias: exportarMemoriasStmt.all(),
        personagens_custom: listarPersonagensCustomStmt.all(),
        bloqueios: exportarBloqueiosStmt.all()
      }
    },

    importarTudo(dados) {
      const d = dados || {}
      db.exec('BEGIN')
      try {
        limparMensagensStmt.run()
        limparCanaisStmt.run()
        limparCanaisExcluidosStmt.run()
        limparAmizadesStmt.run()
        limparDmStmt.run()
        limparMemoriasStmt.run()
        limparPersonagensCustomStmt.run()
        limparBloqueiosStmt.run()
        limparPerfisStmt.run()

        for (const p of d.perfis || []) {
          inserirPerfilFullStmt.run(p.id, p.nome, p.senha_hash, p.avatar || '', p.nome_exibicao || '', p.bio || '', p.foto || '', p.status || 'offline', p.criado_em || Date.now())
        }
        for (const m of d.mensagens || []) {
          inserirMensagemFullStmt.run(m.id, m.canal, m.autor, m.personagem_id, m.texto, m.imagem, m.criado_em || Date.now())
        }
        for (const c of d.canais || []) {
          criarCanalStmt.run(c.id, c.nome, c.emoji || '💬', c.descricao || '', c.personagens || '[]', c.criado_em || Date.now())
        }
        for (const id of d.canais_excluidos || []) {
          excluirCanalPadraoStmt.run(id)
        }
        for (const a of d.amizades || []) {
          inserirAmizadeFullStmt.run(a.id, a.de, a.para, a.status || 'pendente', a.criado_em || Date.now())
        }
        for (const dm of d.mensagens_dm || []) {
          inserirDmFullStmt.run(dm.id, dm.de, dm.para, dm.texto, dm.personagem_id, dm.imagem, dm.criado_em || Date.now())
        }
        for (const mem of d.memorias || []) {
          inserirMemoriaFullStmt.run(mem.id, mem.de, mem.texto, mem.criado_em || Date.now())
        }
        for (const pc of d.personagens_custom || []) {
          criarPersonagemCustomStmt.run(pc.id, pc.nome, pc.emoji || '🙂', pc.cor || '#5865f2', pc.tema || '', pc.saudacao || '', pc.criado_em || Date.now())
        }
        for (const b of d.bloqueios || []) {
          inserirBloqueioFullStmt.run(b.id, b.de, b.para, b.criado_em || Date.now())
        }
        db.exec('COMMIT')
        return true
      } catch (err) {
        db.exec('ROLLBACK')
        throw err
      }
    },

    fechar() {
      db.close()
    }
  }
}
