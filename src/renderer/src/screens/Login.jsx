import { useState, useEffect } from 'react'
import Icone from '../Icones.jsx'

const AVATARES = ['😀', '🐱', '🐶', '🦊', '🐼', '🐸', '🦄', '🐯', '🐰', '🦁', '🐵', '🐢']

export default function Login({ onEntrar }) {
  const [modo, setModo] = useState('entrar')
  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [avatar, setAvatar] = useState('😀')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [perfis, setPerfis] = useState([])
  const [versao, setVersao] = useState('')

  useEffect(() => {
    window.discordplus.listarPerfis().then(setPerfis)
    window.discordplus.versao().then(setVersao).catch(() => {})
  }, [])

  async function submeter(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const resultado =
      modo === 'criar'
        ? await window.discordplus.criarPerfil({ nome, senha, avatar })
        : await window.discordplus.entrar({ nome, senha })
    setCarregando(false)
    if (resultado.erro) {
      setErro(resultado.erro)
      return
    }
    onEntrar(resultado.perfil)
  }

  return (
    <div className="login">
      <div className="login-card">
        <h1 className="login-logo">
          Discord<span>+</span>
          {versao && <span className="login-versao">v{versao}</span>}
        </h1>
        <p className="login-sub">Seu cantinho seguro para conversar</p>

        <div className="login-tabs">
          <button className={modo === 'entrar' ? 'ativo' : ''} onClick={() => setModo('entrar')}>
            Entrar
          </button>
          <button className={modo === 'criar' ? 'ativo' : ''} onClick={() => setModo('criar')}>
            Criar perfil
          </button>
        </div>

        <form onSubmit={submeter}>
          <label htmlFor="login-nome">Nome de usuário</label>
          <input
            id="login-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoFocus
            autoComplete="off"
            maxLength={32}
          />

          <label htmlFor="login-senha">Senha</label>
          <input
            id="login-senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="off"
          />

          {modo === 'criar' && (
            <div className="avatar-picker">
              <label>Escolha seu avatar</label>
              <div className="avatar-list">
                {AVATARES.map((a) => (
                  <button
                    type="button"
                    key={a}
                    className={a === avatar ? 'selecionado' : ''}
                    onClick={() => setAvatar(a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {erro && <p className="erro">{erro}</p>}

          <button className="primary" type="submit" disabled={carregando}>
            <Icone nome="user" /> {carregando ? 'Aguarde…' : modo === 'criar' ? 'Criar perfil' : 'Entrar'}
          </button>
        </form>

        {modo === 'entrar' && perfis.length > 0 && (
          <div className="perfis">
            <p className="perfis-titulo">Perfis neste computador</p>
            {perfis.map((p) => (
              <button key={p.id} className="perfil-item" onClick={() => setNome(p.nome)}>
                <span className="perfil-avatar">{p.avatar || '🙂'}</span>
                {p.nome}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
