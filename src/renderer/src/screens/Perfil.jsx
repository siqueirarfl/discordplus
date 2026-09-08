import { useState } from 'react'
import Icone from '../Icones.jsx'

const AVATARES = ['😀', '🐱', '🐶', '🦊', '🐼', '🐸', '🦄', '🐯', '🐰', '🦁', '🐵', '🐢']

export default function Perfil({ perfil, onVoltar, onAtualizar }) {
  const [foto, setFoto] = useState(perfil.foto || '')
  const [avatar, setAvatar] = useState(perfil.avatar || '🙂')
  const [nomeExibicao, setNomeExibicao] = useState(perfil.nome_exibicao || '')
  const [bio, setBio] = useState(perfil.bio || '')
  const [erro, setErro] = useState('')
  const [salvo, setSalvo] = useState(false)

  const criadoEm = perfil.criado_em
    ? new Date(Number(perfil.criado_em)).toLocaleDateString('pt-BR')
    : '—'

  async function escolherFoto() {
    const resultado = await window.discordplus.escolherFoto()
    if (resultado?.erro) setErro(resultado.erro)
    else if (resultado?.foto) setFoto(resultado.foto)
  }

  async function salvar(e) {
    e.preventDefault()
    setErro('')
    setSalvo(false)
    const resultado = await window.discordplus.atualizarPerfil({
      nome: perfil.nome,
      nome_exibicao: nomeExibicao,
      bio,
      avatar,
      foto
    })
    if (resultado.erro) {
      setErro(resultado.erro)
      return
    }
    setSalvo(true)
    onAtualizar(resultado.perfil)
  }

  return (
    <div className="config">
      <div className="config-topo">
        <button className="secundario" onClick={onVoltar}>
          ← Voltar
        </button>
        <h2>Meu perfil</h2>
      </div>

      <form className="config-card" onSubmit={salvar}>
        <div className="perfil-foto">
          {foto ? <img src={foto} alt="Foto de perfil" /> : <span>{avatar}</span>}
          <button type="button" className="secundario" onClick={escolherFoto}>
            <Icone nome="camera" /> Trocar foto
          </button>
        </div>

        <div className="campo">
          <span>Avatar (emoji)</span>
          <div className="emoji-lista">
            {AVATARES.map((a) => (
              <button
                type="button"
                key={a}
                className={a === avatar ? 'emoji-item ativo' : 'emoji-item'}
                onClick={() => setAvatar(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <label className="campo">
          <span>Nome de exibição</span>
          <input
            value={nomeExibicao}
            onChange={(e) => setNomeExibicao(e.target.value)}
            placeholder={perfil.nome}
            maxLength={40}
          />
        </label>

        <label className="campo">
          <span>Biografia</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={200}
            placeholder="Fale um pouco sobre você…"
          />
        </label>

        <div className="campo">
          <span>Conta criada em</span>
          <p className="config-desc">{criadoEm}</p>
        </div>

        {erro && <p className="erro">{erro}</p>}
        {salvo && <p className="ok">Perfil salvo!</p>}

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
