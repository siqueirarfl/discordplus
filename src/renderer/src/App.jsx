import { useState, useEffect } from 'react'
import Login from './screens/Login.jsx'
import Chat from './screens/Chat.jsx'
import Configuracoes from './screens/Configuracoes.jsx'
import Perfil from './screens/Perfil.jsx'
import CloudLogin from './screens/CloudLogin.jsx'

export default function App() {
  const [perfil, setPerfil] = useState(null)
  const [tema, setTema] = useState('escuro')
  const [pronto, setPronto] = useState(false)
  const [configAberta, setConfigAberta] = useState(false)
  const [perfilAberta, setPerfilAberta] = useState(false)
  const [cloudDecidido, setCloudDecidido] = useState(null)
  const [autenticado, setAutenticado] = useState(false)

  useEffect(() => {
    window.discordplus.getConfig('tema').then((salvo) => {
      if (salvo) setTema(salvo)
      setPronto(true)
    })
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
    window.discordplus.setConfig('tema', tema)
  }, [tema])

  useEffect(() => {
    window.discordplus.estadoCloud().then(async (estado) => {
      const ok = Boolean(estado?.autenticado)
      setAutenticado(ok)
      if (ok) {
        await window.discordplus.sincronizarCloud().catch(() => {})
        const p = await window.discordplus.perfilAuto().catch(() => null)
        if (p) setPerfil(p)
      }
      setCloudDecidido(ok)
    })
  }, [])

  if (!pronto || cloudDecidido === null) {
    return <div className="splash">Carregando…</div>
  }

  if (!cloudDecidido) {
    return (
      <CloudLogin
        onConcluir={(p) => {
          if (p) {
            setPerfil(p)
            setAutenticado(true)
          }
          setCloudDecidido(true)
        }}
      />
    )
  }

  if (!perfil) {
    return <Login onEntrar={setPerfil} />
  }

  if (configAberta) {
    return <Configuracoes onVoltar={() => setConfigAberta(false)} />
  }

  if (perfilAberta) {
    return <Perfil perfil={perfil} onVoltar={() => setPerfilAberta(false)} onAtualizar={setPerfil} />
  }

  return (
    <Chat
      perfil={perfil}
      tema={tema}
      setTema={setTema}
      onSair={() => {
        if (autenticado) {
          window.discordplus.sairConta().finally(() => {
            setAutenticado(false)
            setCloudDecidido(false)
            setPerfil(null)
          })
        } else {
          setPerfil(null)
        }
      }}
      onAbrirConfig={() => setConfigAberta(true)}
      onAbrirPerfil={() => setPerfilAberta(true)}
    />
  )
}
