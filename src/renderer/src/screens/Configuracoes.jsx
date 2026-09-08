import { useState, useEffect } from 'react'
import Icone from '../Icones.jsx'
import { PERSONAGENS } from '@shared/characters.js'
import { avatarSrc } from '../avatares.js'

const MODELO_PADRAO = 'deepseek-chat'

const MODELO_IMAGEM_PADRAO = 'flux-2-pro'

const MODELOS_CHAT = [
  { value: 'deepseek-chat', label: 'DeepSeek Chat (rápido)' },
  { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner (mais profundo)' }
]

const MODELOS_IMAGEM = [
  { value: 'flux-2-pro', label: 'FLUX.2 Pro (recomendado)' },
  { value: 'flux-2-max', label: 'FLUX.2 Max' },
  { value: 'flux-2-flex', label: 'FLUX.2 Flex' },
  { value: 'flux-2-klein-9b', label: 'FLUX.2 Klein 9B (econômico)' },
  { value: 'flux-2-klein-4b', label: 'FLUX.2 Klein 4B (mais barato)' },
  { value: 'flux-pro-1.1', label: 'FLUX 1.1 Pro' }
]

export default function Configuracoes({ onVoltar }) {
  const [apiKey, setApiKey] = useState('')
  const [modelo, setModelo] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [inglesIds, setInglesIds] = useState([])
  const [imagemEnabled, setImagemEnabled] = useState(false)
  const [imagemModelo, setImagemModelo] = useState('')
  const [imagemKey, setImagemKey] = useState('')
  const [limite, setLimite] = useState('')
  const [gasto, setGasto] = useState('')
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')
  const [perfis, setPerfis] = useState([])
  const [versao, setVersao] = useState('')
  const [statusUpd, setStatusUpd] = useState(null)
  const [verificando, setVerificando] = useState(false)
  const [logs, setLogs] = useState([])
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [avisoSenha, setAvisoSenha] = useState(null)

  useEffect(() => {
    Promise.all([
      window.discordplus.getConfig('ia_api_key'),
      window.discordplus.getConfig('ia_modelo'),
      window.discordplus.getConfig('ia_enabled'),
      window.discordplus.getConfig('ia_idioma_en'),
      window.discordplus.getConfig('ia_imagem_enabled'),
      window.discordplus.getConfig('ia_imagem_modelo'),
      window.discordplus.getConfig('ia_imagem_key'),
      window.discordplus.getConfig('ia_limite_dolar'),
      window.discordplus.getConfig('ia_gasto_dolar')
    ]).then(([k, m, en, idi, imEn, imMo, imKey, lim, gas]) => {
      if (k) setApiKey(k)
      if (m) setModelo(MODELOS_CHAT.some((x) => x.value === m) ? m : '')
      setEnabled(en === '1' || en === 'true')
      if (imMo) setImagemModelo(MODELOS_IMAGEM.some((x) => x.value === imMo) ? imMo : '')
      if (imKey) setImagemKey(imKey)
      setImagemEnabled(imEn === '1' || imEn === 'true')
      if (lim) setLimite(lim)
      if (gas) setGasto(gas)
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

  async function alterarSenha() {
    setAvisoSenha(null)
    if (!senhaAtual || !novaSenha) {
      setAvisoSenha({ tipo: 'erro', mensagem: 'Preencha a senha atual e a nova senha.' })
      return
    }
    const r = await window.discordplus.alterarSenhaResponsavel({ senhaAtual, novaSenha })
    if (r?.erro) {
      setAvisoSenha({ tipo: 'erro', mensagem: r.erro })
      return
    }
    setSenhaAtual('')
    setNovaSenha('')
    setAvisoSenha({ tipo: 'ok', mensagem: 'Senha do responsável alterada com sucesso.' })
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
    const limiteNum = String(limite).trim()
    if (limiteNum && !/^\d+(\.\d{1,2})?$/.test(limiteNum)) {
      setErro('O limite de gasto precisa ser um número (ex: 5.00).')
      return
    }
    await window.discordplus.setConfig('ia_api_key', apiKey.trim())
    await window.discordplus.setConfig('ia_modelo', (modelo || MODELO_PADRAO).trim())
    await window.discordplus.setConfig('ia_enabled', enabled ? '1' : '0')
    await window.discordplus.setConfig('ia_idioma_en', JSON.stringify(inglesIds))
    await window.discordplus.setConfig('ia_imagem_enabled', imagemEnabled ? '1' : '0')
    await window.discordplus.setConfig('ia_imagem_modelo', (imagemModelo || MODELO_IMAGEM_PADRAO).trim())
    await window.discordplus.setConfig('ia_imagem_key', imagemKey.trim())
    await window.discordplus.setConfig('ia_limite_dolar', limiteNum)
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
          <span>API key (DeepSeek)</span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value)
              setSalvo(false)
            }}
            placeholder="Chave da DeepSeek — platform.deepseek.com"
            autoComplete="off"
          />
        </label>

        <label className="campo">
          <span>Modelo de chat</span>
          <select
            value={modelo || MODELO_PADRAO}
            onChange={(e) => {
              setModelo(e.target.value)
              setSalvo(false)
            }}
          >
            {MODELOS_CHAT.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
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
          <span>Modelo de imagem</span>
          <select
            value={imagemModelo || MODELO_IMAGEM_PADRAO}
            onChange={(e) => {
              setImagemModelo(e.target.value)
              setSalvo(false)
            }}
          >
            {MODELOS_IMAGEM.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
        </label>

        <label className="campo">
          <span>API key do FLUX (BFL)</span>
          <input
            type="password"
            value={imagemKey}
            onChange={(e) => {
              setImagemKey(e.target.value)
              setSalvo(false)
            }}
            placeholder="Vazio usa a FLUX_API_KEY do .env"
            autoComplete="off"
          />
        </label>

        <label className="campo">
          <span>Limite de gasto mensal (US$)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={limite}
            onChange={(e) => {
              setLimite(e.target.value)
              setSalvo(false)
            }}
            placeholder="ex: 5.00 (vazio = sem limite)"
          />
          {gasto !== '' && (
            <p className="config-desc">Gasto neste mês: US$ {Number(gasto).toFixed(2)}</p>
          )}
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
                {avatarSrc(p) ? (
                  <img className="personagem-ponto avatar-img" src={avatarSrc(p)} alt="" />
                ) : (
                  <span className="personagem-ponto" style={{ background: p.cor }}>
                    {p.emoji}
                  </span>
                )}
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
                  <Icone nome="trash" /> Excluir
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="campo">
          <span>Senha do responsável</span>
          <div className="atualizacao-acoes">
            <input
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              placeholder="Senha atual"
              autoComplete="off"
            />
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Nova senha (mín. 4 caracteres)"
              autoComplete="off"
            />
            <button type="button" className="secundario" onClick={alterarSenha}>
              <Icone nome="lock" /> Alterar senha
            </button>
          </div>
          {avisoSenha && <p className={avisoSenha.tipo === 'ok' ? 'ok' : 'erro'}>{avisoSenha.mensagem}</p>}
        </div>

        {erro && <p className="erro">{erro}</p>}
        {salvo && <p className="ok">Salvo ✓</p>}

        <div className="campo">
          <span>Atualizações</span>
          {versao && <p className="config-desc">Versão instalada: v{versao}</p>}
          <div className="atualizacao-acoes">
            <button type="button" className="secundario" onClick={verificarAtualizacao} disabled={verificando}>
              <Icone nome="refresh" /> {verificando ? 'Verificando…' : 'Verificar atualizações'}
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
