import { useState, useEffect } from 'react'
import { PERSONAGENS } from '@shared/characters.js'

const MODELOS_PADRAO = {
  openrouter: 'minimax/minimax-m3:free',
  deepseek: 'deepseek-chat'
}

const MODELO_IMAGEM_PADRAO = {
  openrouter: 'openai/gpt-image-1',
  openai: 'dall-e-3',
  gemini: 'gemini-2.5-flash-image'
}

export default function Configuracoes({ onVoltar }) {
  const [provider, setProvider] = useState('openrouter')
  const [apiKey, setApiKey] = useState('')
  const [modelo, setModelo] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [inglesIds, setInglesIds] = useState([])
  const [imagemEnabled, setImagemEnabled] = useState(false)
  const [imagemProvider, setImagemProvider] = useState('openrouter')
  const [imagemModelo, setImagemModelo] = useState('')
  const [imagemKey, setImagemKey] = useState('')
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')
  const [perfis, setPerfis] = useState([])
  const [versao, setVersao] = useState('')
  const [statusUpd, setStatusUpd] = useState(null)
  const [verificando, setVerificando] = useState(false)
  const [logs, setLogs] = useState([])

  useEffect(() => {
    Promise.all([
      window.discordplus.getConfig('ia_provider'),
      window.discordplus.getConfig('ia_api_key'),
      window.discordplus.getConfig('ia_modelo'),
      window.discordplus.getConfig('ia_enabled'),
      window.discordplus.getConfig('ia_idioma_en'),
      window.discordplus.getConfig('ia_imagem_enabled'),
      window.discordplus.getConfig('ia_imagem_provider'),
      window.discordplus.getConfig('ia_imagem_modelo'),
      window.discordplus.getConfig('ia_imagem_key')
    ]).then(([p, k, m, en, idi, imEn, imProv, imMo, imKey]) => {
      if (p) setProvider(p)
      if (k) setApiKey(k)
      if (m) setModelo(m)
      setEnabled(en === '1' || en === 'true')
      if (imMo) setImagemModelo(imMo)
      if (imKey) setImagemKey(imKey)
      if (imProv) setImagemProvider(imProv)
      setImagemEnabled(imEn === '1' || imEn === 'true')
      if (idi) {
        try {
          const lista = JSON.parse(idi)
          if (Array.isArray(lista)) setInglesIds(lista)
        } catch {
          // ignora valor inválido
        }
      }
    })
  }, [])

  useEffect(() => {
    window.discordplus.listarPerfis().then(setPerfis).catch(() => {})
    window.discordplus.listarLogs().then(setLogs).catch(() => {})
  }, [])

  useEffect(() => {
    window.discordplus.versao().then(setVersao).catch(() => {})
    const cancelar = window.discordplus.onAtualizacao((dados) => {
      setStatusUpd(dados)
      if (dados.tipo === 'sem-atualizacao' || dados.tipo === 'erro' || dados.tipo === 'baixado') {
        setVerificando(false)
      }
    })
    return cancelar
  }, [])

  function trocarProvider(p) {
    if (!modelo || modelo === MODELOS_PADRAO[provider]) setModelo(MODELOS_PADRAO[p])
    setProvider(p)
    setSalvo(false)
  }

  function trocarProviderImagem(p) {
    if (!imagemModelo.trim() || imagemModelo.trim() === MODELO_IMAGEM_PADRAO[imagemProvider]) {
      setImagemModelo(MODELO_IMAGEM_PADRAO[p])
    }
    setImagemProvider(p)
    setSalvo(false)
  }

  function alternarIngles(id) {
    setInglesIds((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]))
    setSalvo(false)
  }

  async function excluirUsuario(nome) {
    if (!window.confirm(`Excluir a conta de "${nome}" e todo o histórico dela?`)) return
    const r = await window.discordplus.excluirUsuario(nome)
    if (r?.erro) return
    window.discordplus.listarPerfis().then(setPerfis).catch(() => {})
  }

  async function verificarAtualizacao() {
    setVerificando(true)
    setStatusUpd({ tipo: 'verificando' })
    const r = await window.discordplus.verificarAtualizacao()
    if (r?.erro) {
      setStatusUpd({ tipo: 'erro', mensagem: r.erro })
      setVerificando(false)
    }
  }

  function instalarAtualizacao() {
    window.discordplus.instalarAtualizacao()
  }

  function copiarLogs() {
    navigator.clipboard.writeText(logs.join('\n')).catch(() => {})
  }

  async function limparLogsApp() {
    await window.discordplus.limparLogs()
    setLogs([])
  }

  async function salvar(e) {
    e.preventDefault()
    setSalvo(false)
    setErro('')
    if (enabled && !apiKey.trim()) {
      setErro('Cole a API key antes de ativar a IA online.')
      return
    }
    await window.discordplus.setConfig('ia_provider', provider)
    await window.discordplus.setConfig('ia_api_key', apiKey.trim())
    await window.discordplus.setConfig('ia_modelo', modelo.trim())
    await window.discordplus.setConfig('ia_enabled', enabled ? '1' : '0')
    await window.discordplus.setConfig('ia_idioma_en', JSON.stringify(inglesIds))
    await window.discordplus.setConfig('ia_imagem_enabled', imagemEnabled ? '1' : '0')
    await window.discordplus.setConfig('ia_imagem_provider', imagemProvider)
    await window.discordplus.setConfig('ia_imagem_modelo', imagemModelo.trim())
    await window.discordplus.setConfig('ia_imagem_key', imagemKey.trim())
    setSalvo(true)
  }

  return (
    <div className="config">
      <header className="config-topo">
        <button className="icone" onClick={onVoltar} title="Voltar" aria-label="Voltar">
          ←
        </button>
        <h2>Configurações</h2>
      </header>

      <form className="config-card" onSubmit={salvar}>
        <p className="config-desc">
          Configure a IA online para os personagens responderem com inteligência real. Sem isso,
          eles continuam respondendo com respostas locais prontas.
        </p>

        <label className="campo">
          <span>Provedor</span>
          <select value={provider} onChange={(e) => trocarProvider(e.target.value)}>
            <option value="openrouter">OpenRouter</option>
            <option value="deepseek">DeepSeek</option>
          </select>
        </label>

        <label className="campo">
          <span>API key</span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value)
              setSalvo(false)
            }}
            placeholder="Cole sua chave aqui"
            autoComplete="off"
          />
        </label>

        <label className="campo">
          <span>Modelo</span>
          <input
            value={modelo}
            onChange={(e) => {
              setModelo(e.target.value)
              setSalvo(false)
            }}
            placeholder={MODELOS_PADRAO[provider]}
          />
        </label>

        <label className="campo-toggle">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              setEnabled(e.target.checked)
              setSalvo(false)
            }}
          />
          <span>Usar IA online nas respostas dos personagens</span>
        </label>

        <label className="campo-toggle">
          <input
            type="checkbox"
            checked={imagemEnabled}
            onChange={(e) => {
              setImagemEnabled(e.target.checked)
              setSalvo(false)
            }}
          />
          <span>Gerar imagens quando a criança pedir (ex: "desenhe um gato")</span>
        </label>

        <label className="campo">
          <span>Provedor de imagem</span>
          <select
            value={imagemProvider}
            onChange={(e) => trocarProviderImagem(e.target.value)}
          >
            <option value="openrouter">OpenRouter</option>
            <option value="openai">OpenAI</option>
            <option value="gemini">Google Gemini (grátis)</option>
          </select>
        </label>

        <label className="campo">
          <span>Modelo de imagem</span>
          <input
            value={imagemModelo}
            onChange={(e) => {
              setImagemModelo(e.target.value)
              setSalvo(false)
            }}
            placeholder={imagemProvider === 'openai' ? 'dall-e-3' : imagemProvider === 'gemini' ? 'gemini-2.5-flash-image' : 'openai/gpt-image-1'}
          />
        </label>

        <label className="campo">
          <span>API key para imagens (opcional)</span>
          <input
            type="password"
            value={imagemKey}
            onChange={(e) => {
              setImagemKey(e.target.value)
              setSalvo(false)
            }}
            placeholder="Vazio usa a key principal (se OpenRouter)"
            autoComplete="off"
          />
        </label>

        <div className="campo">
          <span>Personagens que respondem em inglês</span>
          <div className="personagens-lista">
            {PERSONAGENS.map((p) => (
              <label key={p.id} className="personagem-opcao">
                <input
                  type="checkbox"
                  checked={inglesIds.includes(p.id)}
                  onChange={() => alternarIngles(p.id)}
                />
                <span className="personagem-ponto" style={{ background: p.cor }}>
                  {p.emoji}
                </span>
                <span>{p.nome}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="campo">
          <span>Usuários cadastrados</span>
          <div className="perfis">
            {perfis.length === 0 && <p className="config-desc">Nenhum usuário cadastrado.</p>}
            {perfis.map((p) => (
              <div key={p.nome} className="pedido-linha">
                <span className="pedido-nome">{p.nome}</span>
                <button type="button" className="secundario" onClick={() => excluirUsuario(p.nome)}>
                  Excluir
                </button>
              </div>
            ))}
          </div>
        </div>

        {erro && <p className="erro">{erro}</p>}
        {salvo && <p className="ok">Salvo ✓</p>}

        <div className="campo">
          <span>Atualizações</span>
          {versao && <p className="config-desc">Versão instalada: v{versao}</p>}
          <div className="atualizacao-acoes">
            <button type="button" className="secundario" onClick={verificarAtualizacao} disabled={verificando}>
              {verificando ? 'Verificando…' : 'Verificar atualizações'}
            </button>
            {statusUpd?.tipo === 'baixado' && (
              <button type="button" className="primario" onClick={instalarAtualizacao}>
                Instalar e reiniciar
              </button>
            )}
          </div>
          {statusUpd?.tipo === 'verificando' && <p className="config-desc">Verificando atualizações…</p>}
          {statusUpd?.tipo === 'disponivel' && <p className="config-desc">Nova versão encontrada! Baixando…</p>}
          {statusUpd?.tipo === 'baixando' && <p className="config-desc">Baixando… {statusUpd.percentual}%</p>}
          {statusUpd?.tipo === 'sem-atualizacao' && <p className="ok">Você já está na versão mais recente.</p>}
          {statusUpd?.tipo === 'erro' && <p className="erro">{statusUpd.mensagem}</p>}
        </div>

        <div className="campo">
          <span>Logs de erro</span>
          <div className="atualizacao-acoes">
            <button type="button" className="secundario" onClick={copiarLogs}>Copiar logs</button>
            <button type="button" className="secundario" onClick={limparLogsApp}>Limpar</button>
          </div>
          <pre className="logs-caixa">{logs.length ? logs.join('\n') : 'Nenhum log ainda.'}</pre>
        </div>

        <div className="modal-acoes">
          <button type="button" className="secundario" onClick={onVoltar}>
            Voltar
          </button>
          <button type="submit" className="primario">
            Salvar
          </button>
        </div>
      </form>
    </div>
  )
}
