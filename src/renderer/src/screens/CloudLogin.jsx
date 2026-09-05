import { useState, useEffect } from 'react'

export default function CloudLogin({ onConcluir }) {
  const [modo, setModo] = useState('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [versao, setVersao] = useState('')

  useEffect(() => {
    window.discordplus.versao().then(setVersao).catch(() => {})
  }, [])

  async function submeter(e) {
    e.preventDefault()
    setErro('')
    setAviso('')
    if (!email.trim() || !senha) {
      setErro('Preencha o e-mail e a senha.')
      return
    }
    setCarregando(true)
    const resultado =
      modo === 'criar'
        ? await window.discordplus.criarConta({ email: email.trim(), senha })
        : await window.discordplus.entrarConta({ email: email.trim(), senha })
    setCarregando(false)
    if (resultado?.erro) {
      setErro(resultado.erro)
      return
    }
    if (modo === 'criar') {
      setAviso('Conta criada! Confirme o e-mail e depois entre com ela.')
      setModo('entrar')
      return
    }
    onConcluir(resultado.perfil)
  }

  return (
    <div className="login">
      <div className="login-card">
        <h1 className="login-logo">
          Discord<span>+</span>
          {versao && <span className="login-versao">v{versao}</span>}
        </h1>
        <p className="login-sub">Entre para salvar seu histórico na nuvem</p>

        <div className="login-tabs">
          <button
            className={modo === 'entrar' ? 'ativo' : ''}
            onClick={() => {
              setModo('entrar')
              setErro('')
              setAviso('')
            }}
          >
            Entrar
          </button>
          <button
            className={modo === 'criar' ? 'ativo' : ''}
            onClick={() => {
              setModo('criar')
              setErro('')
              setAviso('')
            }}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={submeter}>
          <label htmlFor="cloud-email">E-mail</label>
          <input
            id="cloud-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            autoComplete="off"
            maxLength={120}
          />

          <label htmlFor="cloud-senha">Senha</label>
          <input
            id="cloud-senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="off"
          />

          {erro && <p className="erro">{erro}</p>}
          {aviso && <p className="ok">{aviso}</p>}

          <button className="primary" type="submit" disabled={carregando}>
            {carregando ? 'Aguarde…' : modo === 'criar' ? 'Criar conta' : 'Entrar'}
          </button>
        </form>

        <button className="secundario cloud-offline" onClick={() => onConcluir(null)} disabled={carregando}>
          Usar sem conta (offline)
        </button>
      </div>
    </div>
  )
}
