import { useState, useEffect, useRef } from 'react'
import { obterPersonagem, PERSONAGENS } from '@shared/characters.js'
import { avatarSrc } from '../avatares.js'
import Icone from '../Icones.jsx'
import { tocarSomMensagem } from '../sons.js'

const EMOJIS = ['💬', '🎮', '🎨', '🎵', '📺', '⚽', '🧪', '🚀', '🐾', '🍕', '📚', '🎬', '🦖', '🐉', '⭐', '🌈', '⚡', '🔥', '🌸', '🧸']

export default function Chat({ perfil, tema, setTema, onSair, onAbrirConfig, onAbrirPerfil }) {
  const [canais, setCanais] = useState([])
  const [amigos, setAmigos] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [conversa, setConversa] = useState(null)
  const [mensagens, setMensagens] = useState([])
  const [naoLidas, setNaoLidas] = useState({})
  const [modalRecuperacao, setModalRecuperacao] = useState(false)
  const [senhaNova, setSenhaNova] = useState('')
  const [cliquesLogo, setCliquesLogo] = useState(0)
  const ultimoCliqueLogoRef = useRef(0)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [imagemAnexo, setImagemAnexo] = useState('')
  const [aviso, setAviso] = useState('')
  const fimRef = useRef(null)

  const [mostrarModal, setMostrarModal] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoEmoji, setNovoEmoji] = useState('💬')
  const [novosPersonagens, setNovosPersonagens] = useState([])
  const [erroCriacao, setErroCriacao] = useState('')

  const [mostrarAmigos, setMostrarAmigos] = useState(false)
  const [disponiveis, setDisponiveis] = useState([])

  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [adminUsuario, setAdminUsuario] = useState('')
  const [adminSenha, setAdminSenha] = useState('')
  const [erroAdmin, setErroAdmin] = useState('')

  const [membros, setMembros] = useState([])
  const [personagens, setPersonagens] = useState([])
  const [meuStatus, setMeuStatus] = useState(perfil.status || 'online')
  const [busca, setBusca] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [editandoTexto, setEditandoTexto] = useState('')
  const [sugestoes, setSugestoes] = useState([])
  const [digitando, setDigitando] = useState([])
  const [bloqueados, setBloqueados] = useState([])
  const [menu, setMenu] = useState(null)
  const conversaRef = useRef(null)

  useEffect(() => {
    recarregarTudo()
  }, [])

  useEffect(() => {
    if (!conversa) return
    if (conversa.tipo === 'canal') {
      window.discordplus.listarMensagens(conversa.id).then(setMensagens)
      setNaoLidas((atual) => (atual[conversa.id] ? { ...atual, [conversa.id]: 0 } : atual))
    } else {
      window.discordplus.listarDm({ a: perfil.nome, b: conversa.nome }).then(setMensagens)
    }
  }, [conversa, perfil.nome])

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  useEffect(() => {
    window.discordplus.listarMembros().then((lista) => {
      setMembros(lista)
      const eu = lista.find((m) => m.nome === perfil.nome)
      if (eu) setMeuStatus(eu.status || 'online')
    })
    window.discordplus.listarBloqueados(perfil.nome).then(setBloqueados).catch(() => {})
  }, [perfil.nome])

  useEffect(() => {
    conversaRef.current = conversa
  }, [conversa])

  useEffect(() => {
    const total = Object.values(naoLidas).reduce((a, b) => a + (b || 0), 0)
    document.title = total > 0 ? `(${total}) Discord+` : 'Discord+'
  }, [naoLidas])

  function aoClicarLogo() {
    const agora = Date.now()
    if (agora - ultimoCliqueLogoRef.current > 3000) setCliquesLogo(1)
    else setCliquesLogo((n) => n + 1)
    ultimoCliqueLogoRef.current = agora
  }

  useEffect(() => {
    if (cliquesLogo >= 5) {
      setCliquesLogo(0)
      setSenhaNova('')
      setModalRecuperacao(true)
    }
  }, [cliquesLogo])

  async function gerarNovaSenhaResponsavel() {
    const r = await window.discordplus.recuperarSenhaResponsavel()
    if (r?.senha) setSenhaNova(r.senha)
  }

  async function recarregarMensagens() {
    const c = conversaRef.current
    if (!c) return
    if (c.tipo === 'canal') {
      setMensagens(await window.discordplus.listarMensagens(c.id))
    } else {
      setMensagens(await window.discordplus.listarDm({ a: perfil.nome, b: c.nome }))
    }
  }

  useEffect(() => {
    return window.discordplus.onMensagemProativa((dados) => {
      tocarSomMensagem()
      recarregarMensagens()
      const canal = dados?.canal
      if (!canal) return
      const ativo = conversaRef.current
      if (ativo?.tipo === 'canal' && ativo.id === canal) return
      setNaoLidas((atual) => ({ ...atual, [canal]: (atual[canal] || 0) + 1 }))
    })
  }, [])

  useEffect(() => {
    function aoColar(e) {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const arquivo = item.getAsFile()
          if (!arquivo) continue
          const leitor = new FileReader()
          leitor.onload = () => setImagemAnexo(leitor.result)
          leitor.readAsDataURL(arquivo)
          e.preventDefault()
          break
        }
      }
    }
    window.addEventListener('paste', aoColar)
    return () => window.removeEventListener('paste', aoColar)
  }, [])

  async function recarregarTudo() {
    const lista = await window.discordplus.listarCanais()
    setCanais(lista)
    setConversa((atual) => {
      if (atual?.tipo === 'canal' && lista.some((c) => c.id === atual.id)) return atual
      return lista.length > 0 ? { tipo: 'canal', id: lista[0].id } : null
    })
    recarregarAmigos()
    window.discordplus.listarPersonagens().then(setPersonagens).catch(() => {})
  }

  async function recarregarAmigos() {
    const [a, p] = await Promise.all([
      window.discordplus.listarAmigos(perfil.nome),
      window.discordplus.listarPedidos(perfil.nome)
    ])
    setAmigos(a)
    setPedidos(p)
  }

  async function abrirAmigos() {
    await recarregarAmigos()
    const disp = await window.discordplus.listarDisponiveis(perfil.nome)
    setDisponiveis(disp)
    setMostrarAmigos(true)
  }

  async function enviar(e) {
    e.preventDefault()
    if ((!texto.trim() && !imagemAnexo) || enviando || !conversa) return
    setEnviando(true)
    setAviso('')
    let resultado
    try {
      resultado =
        conversa.tipo === 'canal'
          ? await window.discordplus.enviar({ canal: conversa.id, autor: perfil.nome, texto, imagem: imagemAnexo || undefined })
          : await window.discordplus.enviarDm({ de: perfil.nome, para: conversa.nome, texto, imagem: imagemAnexo || undefined })
    } catch {
      setAviso('Não foi possível enviar. Tente novamente.')
      setEnviando(false)
      return
    }
    setEnviando(false)
    if (resultado.erro) {
      setAviso(resultado.erro)
      return
    }
    setAviso(resultado.aviso || '')
    setMensagens((atual) => [...atual, resultado.mensagem])
    setTexto('')
    setImagemAnexo('')
    const respondentes = (resultado.respostas || []).map((r) => r.personagem?.nome).filter(Boolean)
    setDigitando(respondentes)
    for (const r of resultado.respostas || []) {
      setTimeout(() => {
        setMensagens((atual) => [...atual, r.mensagemSalva])
        setDigitando((atual) => atual.filter((n) => n !== r.personagem?.nome))
      }, r.delayMs)
    }
  }

  async function anexarImagem() {
    const resultado = await window.discordplus.escolherImagem()
    if (!resultado) return
    if (resultado.erro) return
    if (resultado.imagem) setImagemAnexo(resultado.imagem)
  }

  function mencaoParcial(t) {
    const m = /(?:^|\s)@([^\s@]*)$/.exec(t)
    return m ? m[1] : null
  }

  function atualizarTexto(v) {
    setTexto(v)
    const parcial = mencaoParcial(v)
    if (parcial === null) {
      setSugestoes([])
      return
    }
    const p = parcial.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const lista = personagens
      .filter((x) => {
        const nome = x.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        return nome.startsWith(p) || x.id.toLowerCase().startsWith(p)
      })
      .slice(0, 8)
    setSugestoes(lista)
  }

  function selecionarSugestao(x) {
    setTexto(texto.replace(/(^|\s)@[^\s@]*$/, `$1@${x.nome} `))
    setSugestoes([])
  }

  function iniciarImagem() {
    setTexto((atual) => atual.startsWith('/imagem ') ? atual : `/imagem ${atual}`)
    setAviso('Descreva a imagem e envie. Exemplo: /imagem um dragão fofo jogando videogame')
  }

  async function enviarPedido(nome) {
    await window.discordplus.enviarPedido({ de: perfil.nome, para: nome })
    await abrirAmigos()
  }

  async function aceitar(nome) {
    await window.discordplus.aceitarPedido({ de: nome, para: perfil.nome })
    await abrirAmigos()
  }

  async function recusar(nome) {
    await window.discordplus.recusarPedido({ de: nome, para: perfil.nome })
    await abrirAmigos()
  }

  async function removerAmigo(nome) {
    if (!window.confirm(`Remover ${nome} dos seus amigos?`)) return
    await window.discordplus.removerAmigo({ a: perfil.nome, b: nome })
    if (conversa?.tipo === 'dm' && conversa.nome === nome) {
      setConversa(canais.length ? { tipo: 'canal', id: canais[0].id } : null)
    }
    recarregarAmigos()
  }

  function abrirMenu(e, m) {
    e.preventDefault()
    if (m.nome === perfil.nome) return
    setMenu({ x: e.clientX, y: e.clientY, membro: m })
  }

  function fecharMenu() {
    setMenu(null)
  }

  async function bloquearMembro(nome) {
    await window.discordplus.bloquearAmigo({ de: perfil.nome, para: nome })
    recarregarAmigos()
    window.discordplus.listarBloqueados(perfil.nome).then(setBloqueados).catch(() => {})
    fecharMenu()
  }

  async function desbloquearMembro(nome) {
    await window.discordplus.desbloquearAmigo({ de: perfil.nome, para: nome })
    window.discordplus.listarBloqueados(perfil.nome).then(setBloqueados).catch(() => {})
    fecharMenu()
  }

  async function alternarStatus() {
    const proximo = meuStatus === 'online' ? 'ausente' : 'online'
    const resultado = await window.discordplus.setStatus({ nome: perfil.nome, status: proximo })
    if (resultado.perfil) setMeuStatus(resultado.perfil.status || proximo)
    window.discordplus.listarMembros().then(setMembros)
  }

  async function excluirMensagem(id) {
    if (!window.confirm('Apagar esta mensagem?')) return
    const resultado = await window.discordplus.excluirMensagem({ id, autor: perfil.nome })
    if (resultado.erro) return
    setMensagens((atual) => atual.filter((m) => m.id !== id))
  }

  function iniciarEdicao(m) {
    setEditandoId(m.id)
    setEditandoTexto(m.texto)
  }

  async function salvarEdicao(e) {
    e.preventDefault()
    const resultado = await window.discordplus.editarMensagem({ id: editandoId, autor: perfil.nome, texto: editandoTexto })
    if (resultado.erro) return
    setMensagens((atual) => atual.map((m) => (m.id === editandoId ? resultado.mensagem : m)))
    setEditandoId(null)
    setEditandoTexto('')
  }

  function abrirModal() {
    setNovoNome('')
    setNovoEmoji('💬')
    setNovosPersonagens([])
    setErroCriacao('')
    setMostrarModal(true)
  }

  async function criarCanal(e) {
    e.preventDefault()
    if (!novoNome.trim()) {
      setErroCriacao('Digite um nome para o canal.')
      return
    }
    const resultado = await window.discordplus.criarCanal({
      nome: novoNome,
      emoji: novoEmoji,
      personagens: novosPersonagens
    })
    if (resultado.erro) {
      setErroCriacao(resultado.erro)
      return
    }
    setMostrarModal(false)
    await recarregarTudo()
    setConversa({ tipo: 'canal', id: resultado.canal.id })
  }

  async function removerCanal(id) {
    if (!window.confirm('Apagar este canal e suas mensagens?')) return
    await window.discordplus.removerCanal(id)
    await recarregarTudo()
  }

  function pedirConfig() {
    setAdminUsuario('responsavel')
    setAdminSenha('')
    setErroAdmin('')
    setMostrarSenha(true)
  }

  async function entrarConfig(e) {
    e.preventDefault()
    const resultado = await window.discordplus.verificarAdmin(adminUsuario, adminSenha)
    if (!resultado.ok) {
      setErroAdmin('Usuário ou senha de administrador incorretos.')
      return
    }
    setMostrarSenha(false)
    onAbrirConfig()
  }

  function alternarPersonagem(id) {
    setNovosPersonagens((atual) =>
      atual.includes(id) ? atual.filter((p) => p !== id) : [...atual, id]
    )
  }

  const canalInfo = conversa?.tipo === 'canal' ? canais.find((c) => c.id === conversa.id) : null
  const amigoAtual = conversa?.tipo === 'dm' ? amigos.find((a) => a.nome === conversa.nome) : null
  const personagemDm =
    conversa?.tipo === 'dm' && conversa.nome.startsWith('ia:')
      ? personagens.find((p) => p.id === conversa.nome.slice(3))
      : null
  const titulo = canalInfo
    ? `${canalInfo.emoji} ${canalInfo.nome}`
    : personagemDm
      ? `${personagemDm.emoji} ${personagemDm.nome}`
      : amigoAtual
        ? `💬 ${amigoAtual.nome}`
        : ''
  const descricao = canalInfo ? canalInfo.descricao : personagemDm ? personagemDm.tema || 'Mensagem particular' : 'Mensagem particular'
  const mensagensFiltradas = busca.trim()
    ? mensagens.filter((m) => (m.texto || '').toLowerCase().includes(busca.trim().toLowerCase()))
    : mensagens

  return (
    <div className="chat">
      <aside className="servidores" aria-label="Servidores">
        <button className="servidor ativo" title="Comunidade Discord+" onClick={aoClicarLogo}>D+</button>
        <div className="servidor-divisor" />
        <button
          className="servidor adicionar"
          title="Criar um novo canal"
          aria-label="Criar um novo canal"
          onClick={abrirModal}
        >＋</button>
      </aside>
      <aside className="sidebar">
        <div className="comunidade-nome">
          <strong>Discord+ Kids</strong>
          <span>Comunidade local</span>
        </div>
        <div className="sidebar-topo">
          <button className="meu-perfil" onClick={onAbrirPerfil} title="Meu perfil">
            {perfil.foto ? (
              <img className="meu-foto" src={perfil.foto} alt="" />
            ) : (
              <span className="meu-avatar">{perfil.avatar || '🙂'}</span>
            )}
            <span className="meu-nome">{perfil.nome_exibicao || perfil.nome}</span>
          </button>
          <button className="icone" onClick={onSair} title="Sair" aria-label="Sair">
            <Icone nome="logout" />
          </button>
        </div>

        <div className="canais-cabecalho">
          <span>Canais</span>
          <button className="icone" onClick={abrirModal} title="Criar canal" aria-label="Criar canal">
            <Icone nome="plus" />
          </button>
        </div>

        <nav className="canais">
          {canais.map((c) => (
            <div key={c.id} className="canal-linha">
              <button
                className={conversa?.tipo === 'canal' && conversa.id === c.id ? 'canal ativo' : 'canal'}
                onClick={() => setConversa({ tipo: 'canal', id: c.id })}
              >
                <span className="canal-emoji">{c.emoji}</span>
                <span className="canal-nome">{c.nome}</span>
                {naoLidas[c.id] > 0 && <span className="canal-badge">{naoLidas[c.id]}</span>}
              </button>
              <button
                className="icone canal-remover"
                onClick={() => removerCanal(c.id)}
                title="Remover canal"
                aria-label="Remover canal"
              >
                <Icone nome="trash" />
              </button>
            </div>
          ))}
        </nav>

        <div className="canais-cabecalho">
          <span>Amigos {pedidos.length > 0 ? `(${pedidos.length})` : ''}</span>
          <button className="icone" onClick={abrirAmigos} title="Adicionar amigo" aria-label="Adicionar amigo">
            <Icone nome="plus" />
          </button>
        </div>

        <nav className="canais">
          {amigos.map((a) => (
            <div key={a.nome} className="canal-linha">
              <button
                className={conversa?.tipo === 'dm' && conversa.nome === a.nome ? 'canal ativo' : 'canal'}
                onClick={() => setConversa({ tipo: 'dm', nome: a.nome })}
              >
                <span className="canal-emoji">{a.avatar || '🙂'}</span>
                <span className="canal-nome">{a.nome}</span>
              </button>
              <button
                className="icone canal-remover"
                onClick={() => removerAmigo(a.nome)}
                title="Remover amigo"
                aria-label="Remover amigo"
              >
                <Icone nome="trash" />
              </button>
            </div>
          ))}
          {amigos.length === 0 && <p className="vazio-lista">Nenhum amigo ainda</p>}
        </nav>

        <div className="sidebar-rodape">
          <button className="status-botao" onClick={alternarStatus} title="Alterar status">
            <span className={`status-ponto ${meuStatus}`} /> {meuStatus === 'online' ? 'Online' : 'Ausente'}
          </button>
          <button className="icone" onClick={pedirConfig} title="Configurações" aria-label="Configurações">
            <Icone nome="gear" />
          </button>
          <button className="icone" onClick={() => setTema(tema === 'escuro' ? 'claro' : 'escuro')} title="Trocar tema">
            <Icone nome={tema === 'escuro' ? 'moon' : 'sun'} />
          </button>
        </div>
      </aside>

      <main className="conversa">
        <header className="conversa-topo">
          <div className="conversa-titulo">
            <h2>{titulo}</h2>
            <p className="conversa-desc">{descricao}</p>
          </div>
          <input
            className="busca"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar mensagens…"
          />
        </header>

        <div className="mensagens">
          {mensagensFiltradas.map((m) => (
            <Mensagem
              key={m.id}
              m={m}
              meuNome={perfil.nome}
              amigoAvatar={amigoAtual?.avatar}
              personagens={personagens}
              editando={editandoId === m.id}
              editandoTexto={editandoId === m.id ? editandoTexto : ''}
              onIniciarEdicao={() => iniciarEdicao(m)}
              onSalvarEdicao={salvarEdicao}
              onCancelarEdicao={() => setEditandoId(null)}
              onChangeEdicao={(v) => setEditandoTexto(v)}
              onExcluir={() => excluirMensagem(m.id)}
            />
          ))}
          {mensagensFiltradas.length === 0 && busca.trim() && (
            <p className="vazio-lista">Nenhuma mensagem encontrada.</p>
          )}
          {digitando.length > 0 && (
            <p className="digitando">{digitando.join(', ')} está digitando…</p>
          )}
          <div ref={fimRef} />
        </div>

        <form className="entrada" onSubmit={enviar}>
          {imagemAnexo && (
            <div className="anexo-previa">
              <img src={imagemAnexo} alt="Imagem anexada" />
              <button type="button" className="icone anexo-remover" onClick={() => setImagemAnexo('')} title="Remover imagem">✕</button>
            </div>
          )}
          {sugestoes.length > 0 && (
            <div className="mencoes">
              {sugestoes.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  className="mencao-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selecionarSugestao(x)}
                >
                  <Avatar src={avatarSrc(x)} emoji={x.emoji} cor={x.cor} className="mencao-emoji" />
                  <span className="mencao-nome">{x.nome}</span>
                </button>
              ))}
            </div>
          )}
          <button type="button" className="icone anexar" onClick={anexarImagem} title="Anexar imagem" disabled={!conversa}><Icone nome="paperclip" /></button>
          <button type="button" className="icone criar-imagem" onClick={iniciarImagem} title="Desenhar" disabled={!conversa || enviando}><Icone nome="brush" /></button>
          <input
            value={texto}
            onChange={(e) => atualizarTexto(e.target.value)}
            placeholder={canalInfo ? `Mensagem em ${canalInfo.nome}` : personagemDm ? `Mensagem para ${personagemDm.nome}` : amigoAtual ? `Mensagem para ${amigoAtual.nome}` : 'Mensagem'}
            maxLength={1000}
            disabled={!conversa}
          />
          <button type="submit" disabled={(!texto.trim() && !imagemAnexo) || enviando || !conversa}>
            {enviando ? 'Enviando…' : 'Enviar'}
          </button>
          {aviso && <div className="aviso-entrada" role="status">{aviso}</div>}
        </form>
      </main>

      <aside className="membros">
        <div className="canais-cabecalho">
          <span>Membros</span>
        </div>
        <nav className="membros-lista">
          {membros.map((m) => (
            <div
              key={m.id || m.nome}
              className={m.ehIa ? 'membro membro-clicavel' : 'membro'}
              onClick={m.ehIa ? () => setConversa({ tipo: 'dm', nome: `ia:${m.nome}` }) : undefined}
              onContextMenu={(e) => abrirMenu(e, m)}
              title={m.ehIa ? 'Conversar' : undefined}
            >
              {m.ehIa ? (
                <Avatar src={avatarSrc({ avatar: m.avatarImg })} emoji={m.avatar} cor={m.cor} className="membro-avatar" />
              ) : m.foto ? (
                <img className="membro-foto" src={m.foto} alt="" />
              ) : (
                <span className="membro-avatar">{m.avatar || '🙂'}</span>
              )}
              <span className="membro-nome">{m.nome_exibicao || m.nome}</span>
              <span className={`status-ponto ${m.status || 'offline'}`} />
            </div>
          ))}
          {membros.length === 0 && <p className="vazio-lista">Ninguém por aqui</p>}
        </nav>
      </aside>

      {menu && (
        <>
          <div className="context-overlay" onClick={fecharMenu} />
          <div className="context-menu" style={{ left: menu.x, top: menu.y }}>
            {(() => {
              const m = menu.membro
              const ehAmigo = amigos.some((a) => a.nome === m.nome)
              const bloqueado = bloqueados.includes(m.nome)
              if (m.ehIa) {
                return (
                  <button className="context-item" onClick={() => { setConversa({ tipo: 'dm', nome: `ia:${m.nome}` }); fecharMenu() }}>
                    💬 Mandar mensagem
                  </button>
                )
              }
              return (
                <>
                  {ehAmigo && (
                    <button className="context-item" onClick={() => { setConversa({ tipo: 'dm', nome: m.nome }); fecharMenu() }}>
                      💬 Mandar mensagem
                    </button>
                  )}
                  {!ehAmigo && !bloqueado && (
                    <button className="context-item" onClick={() => { enviarPedido(m.nome); fecharMenu() }}>
                      ➕ Adicionar amigo
                    </button>
                  )}
                  {ehAmigo && (
                    <button className="context-item" onClick={() => { removerAmigo(m.nome); fecharMenu() }}>
                      🗑 Remover amigo
                    </button>
                  )}
                  {bloqueado ? (
                    <button className="context-item" onClick={() => desbloquearMembro(m.nome)}>
                      ✅ Desbloquear
                    </button>
                  ) : (
                    <button className="context-item" onClick={() => bloquearMembro(m.nome)}>
                      🚫 Bloquear
                    </button>
                  )}
                </>
              )
            })()}
          </div>
        </>
      )}

      {mostrarModal && (
        <div className="modal-fundo" onClick={() => setMostrarModal(false)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={criarCanal}>
            <h3>Criar canal</h3>

            <label className="campo">
              <span>Nome</span>
              <input
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Nome do canal"
                maxLength={32}
                autoFocus
              />
            </label>

            <div className="campo">
              <span>Ícone</span>
              <div className="emoji-lista">
                {EMOJIS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    className={em === novoEmoji ? 'emoji-item ativo' : 'emoji-item'}
                    onClick={() => setNovoEmoji(em)}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div className="campo">
              <span>Amigos deste canal</span>
              <div className="personagens-lista">
                {PERSONAGENS.map((p) => (
                  <label key={p.id} className="personagem-opcao">
                    <input
                      type="checkbox"
                      checked={novosPersonagens.includes(p.id)}
                      onChange={() => alternarPersonagem(p.id)}
                    />
                    <Avatar src={avatarSrc(p)} emoji={p.emoji} cor={p.cor} className="personagem-ponto" />
                    <span>{p.nome}</span>
                  </label>
                ))}
              </div>
            </div>

            {erroCriacao && <p className="erro">{erroCriacao}</p>}

            <div className="modal-acoes">
              <button type="button" className="secundario" onClick={() => setMostrarModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="primario" disabled={!novoNome.trim()}>
                Criar canal
              </button>
            </div>
          </form>
        </div>
      )}

      {mostrarAmigos && (
        <div className="modal-fundo" onClick={() => setMostrarAmigos(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Amigos</h3>

            {pedidos.length > 0 && (
              <div className="campo">
                <span>Pedidos de amizade</span>
                {pedidos.map((p) => (
                  <div key={p.nome} className="pedido-linha">
                    <span className="pedido-nome">{p.avatar || '🙂'} {p.nome}</span>
                    <div className="pedido-acoes">
                      <button type="button" className="pedido-botao aceitar" onClick={() => aceitar(p.nome)}>
                        Aceitar
                      </button>
                      <button type="button" className="pedido-botao recusar" onClick={() => recusar(p.nome)}>
                        Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="campo">
              <span>Adicionar amigo</span>
              {disponiveis.length === 0 && <p className="vazio-lista">Nenhum outro perfil por aqui.</p>}
              {disponiveis.map((d) => (
                <div key={d.nome} className="pedido-linha">
                  <span className="pedido-nome">{d.avatar || '🙂'} {d.nome}</span>
                  {d.estado === 'amigo' && <span className="selo">Amigo ✓</span>}
                  {d.estado === 'pendente_enviado' && <span className="selo">Pedido enviado</span>}
                  {d.estado === 'pendente_recebido' && <span className="selo">Te enviou pedido</span>}
                  {d.estado === 'nenhum' && (
                    <button type="button" className="pedido-botao aceitar" onClick={() => enviarPedido(d.nome)}>
                      Adicionar
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="modal-acoes">
              <button type="button" className="secundario" onClick={() => setMostrarAmigos(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarSenha && (
        <div className="modal-fundo" onClick={() => setMostrarSenha(false)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={entrarConfig}>
            <h3>Acesso de administrador</h3>
            <p className="conversa-desc">Digite as credenciais de administrador para abrir as configurações.</p>

            <label className="campo">
              <span>Usuário</span>
              <input
                value={adminUsuario}
                onChange={(e) => setAdminUsuario(e.target.value)}
                autoFocus
                autoComplete="off"
              />
            </label>

            <label className="campo">
              <span>Senha</span>
              <input
                type="password"
                value={adminSenha}
                onChange={(e) => setAdminSenha(e.target.value)}
                autoComplete="off"
              />
            </label>

            {erroAdmin && <p className="erro">{erroAdmin}</p>}

            <div className="modal-acoes">
              <button type="button" className="secundario" onClick={() => setMostrarSenha(false)}>
                Cancelar
              </button>
              <button type="submit" className="primario" disabled={!adminUsuario.trim() || !adminSenha}>
                Entrar
              </button>
            </div>
          </form>
        </div>
      )}

      {modalRecuperacao && (
        <div className="modal-fundo" onClick={() => setModalRecuperacao(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Recuperar acesso do responsável</h3>
            <p className="conversa-desc">
              Gere uma nova senha para o responsável. A senha atual será substituída.
            </p>

            {senhaNova ? (
              <>
                <p className="ok">Nova senha gerada:</p>
                <div className="senha-gerada">{senhaNova}</div>
                <p className="config-desc">Anote agora. Ela não será exibida de novo.</p>
              </>
            ) : (
              <p className="config-desc">Clique para gerar uma nova senha.</p>
            )}

            <div className="modal-acoes">
              <button type="button" className="secundario" onClick={() => setModalRecuperacao(false)}>
                Fechar
              </button>
              {!senhaNova && (
                <button type="button" className="primario" onClick={gerarNovaSenhaResponsavel}>
                  Gerar nova senha
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Mensagem({ m, meuNome, amigoAvatar, personagens, editando, editandoTexto, onIniciarEdicao, onSalvarEdicao, onCancelarEdicao, onChangeEdicao, onExcluir }) {
  const [traducao, setTraducao] = useState('')
  const [traduzindo, setTraduzindo] = useState(false)
  async function traduzirMsg() {
    if (traduzindo) return
    setTraduzindo(true)
    const resultado = await window.discordplus.traduzir(m.texto)
    setTraduzindo(false)
    if (resultado?.erro) {
      setTraducao('')
      return
    }
    setTraducao(resultado?.traducao || '')
  }
  const horario = Number.isFinite(Number(m.criado_em))
    ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(Number(m.criado_em)))
    : ''
  if (m.autor === 'Sistema') {
    const novo = m.personagem_id
      ? personagens.find((p) => p.id === m.personagem_id) || obterPersonagem(m.personagem_id)
      : null
    return (
      <div className="msg-sistema">
        <div className="sistema-card">
          {novo ? (
            <Avatar src={avatarSrc(novo)} emoji={novo.emoji} cor={novo.cor} className="sistema-avatar" />
          ) : (
            <span className="sistema-icone">🎉</span>
          )}
          <div className="sistema-texto">{m.texto}</div>
        </div>
      </div>
    )
  }
  const personagem = m.personagem_id
    ? personagens.find((p) => p.id === m.personagem_id) || obterPersonagem(m.personagem_id)
    : null
  if (personagem) {
    return (
      <div className="msg personagem">
        <Avatar src={avatarSrc(personagem)} emoji={personagem.emoji} cor={personagem.cor} className="msg-avatar" />
        <div className="msg-corpo">
          <div className="msg-autor">
            <span className="tag-ia">
              {personagem.nome}
            </span>
            {horario && <time dateTime={new Date(Number(m.criado_em)).toISOString()}>{horario}</time>}
          </div>
          <div className="msg-texto">{m.texto}</div>
          {m.texto && (
            <div className="msg-traduzir">
              <button className="icone" onClick={traduzirMsg} disabled={traduzindo} title="Traduzir" aria-label="Traduzir">
                {traduzindo ? '…' : <Icone nome="translate" />}
              </button>
              {traducao && <span className="msg-traducao">{traducao}</span>}
            </div>
          )}
          {m.imagem && <img className="msg-imagem" src={m.imagem} alt="Imagem" />}
        </div>
      </div>
    )
  }
  const ehMinha = m.autor === meuNome
  return (
    <div className={ehMinha ? 'msg usuario' : 'msg outro'}>
      {!ehMinha && <div className="msg-avatar">{amigoAvatar || '🙂'}</div>}
      <div className="msg-corpo">
        <div className="msg-autor">
          <span>{m.autor}</span>
          {horario && <time dateTime={new Date(Number(m.criado_em)).toISOString()}>{horario}</time>}
        </div>
        {editando ? (
          <form className="msg-edicao" onSubmit={onSalvarEdicao}>
            <input
              value={editandoTexto}
              onChange={(e) => onChangeEdicao(e.target.value)}
              autoFocus
              maxLength={1000}
            />
            <div className="msg-edicao-acoes">
              <button type="submit" className="primario">Salvar</button>
              <button type="button" className="secundario" onClick={onCancelarEdicao}>Cancelar</button>
            </div>
          </form>
        ) : (
          <div className="msg-texto">{m.texto}</div>
        )}
        {!editando && m.texto && (
          <div className="msg-traduzir">
            <button className="icone" onClick={traduzirMsg} disabled={traduzindo} title="Traduzir" aria-label="Traduzir">
              {traduzindo ? '…' : '🌐'}
            </button>
            {traducao && <span className="msg-traducao">{traducao}</span>}
          </div>
        )}
        {m.imagem && <img className="msg-imagem" src={m.imagem} alt="Imagem" />}
        {ehMinha && !editando && (
          <div className="msg-acoes">
            <button className="icone" onClick={onIniciarEdicao} title="Editar" aria-label="Editar"><Icone nome="pencil" /></button>
            <button className="icone" onClick={onExcluir} title="Excluir" aria-label="Excluir"><Icone nome="trash" /></button>
          </div>
        )}
      </div>
    </div>
  )
}

function Avatar({ src, emoji, cor, className = '' }) {
  if (src) {
    return <img className={`${className} avatar-img`} src={src} alt="" />
  }
  return (
    <span className={className} style={{ background: cor }}>
      {emoji}
    </span>
  )
}
