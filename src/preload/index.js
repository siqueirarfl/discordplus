import { contextBridge, ipcRenderer } from 'electron'

// Ponte segura entre o processo principal e a interface.
// O renderer nunca acessa Node diretamente.
contextBridge.exposeInMainWorld('discordplus', {
  listarPerfis: () => ipcRenderer.invoke('auth:listar-perfis'),
  criarPerfil: (dados) => ipcRenderer.invoke('auth:criar-perfil', dados),
  entrar: (dados) => ipcRenderer.invoke('auth:entrar', dados),
  verificarAdmin: (usuario, senha) => ipcRenderer.invoke('auth:verificar-admin', { usuario, senha }),
  atualizarPerfil: (dados) => ipcRenderer.invoke('perfil:atualizar', dados),
  escolherFoto: () => ipcRenderer.invoke('perfil:escolher-foto'),
  escolherImagem: () => ipcRenderer.invoke('chat:escolher-imagem'),
  sair: (nome) => ipcRenderer.invoke('auth:sair', nome),
  listarMembros: () => ipcRenderer.invoke('membros:listar'),
  setStatus: (dados) => ipcRenderer.invoke('perfil:set-status', dados),

  listarCanais: () => ipcRenderer.invoke('chat:listar-canais'),
  listarMensagens: (canal) => ipcRenderer.invoke('chat:listar-mensagens', canal),
  enviar: (dados) => ipcRenderer.invoke('chat:enviar', dados),
  editarMensagem: (dados) => ipcRenderer.invoke('mensagem:editar', dados),
  excluirMensagem: (dados) => ipcRenderer.invoke('mensagem:excluir', dados),
  buscarMensagens: (termo) => ipcRenderer.invoke('mensagem:buscar', termo),
  criarCanal: (dados) => ipcRenderer.invoke('chat:criar-canal', dados),
  removerCanal: (id) => ipcRenderer.invoke('chat:remover-canal', id),
  listarPersonagensCustom: () => ipcRenderer.invoke('personagens:listar-custom'),
  listarPersonagens: () => ipcRenderer.invoke('personagens:listar'),
  excluirUsuario: (nome) => ipcRenderer.invoke('admin:excluir-usuario', nome),

  listarAmigos: (perfil) => ipcRenderer.invoke('amigos:listar', perfil),
  listarPedidos: (perfil) => ipcRenderer.invoke('amigos:pedidos', perfil),
  listarDisponiveis: (perfil) => ipcRenderer.invoke('amigos:disponiveis', perfil),
  enviarPedido: (dados) => ipcRenderer.invoke('amigos:enviar-pedido', dados),
  aceitarPedido: (dados) => ipcRenderer.invoke('amigos:aceitar', dados),
  recusarPedido: (dados) => ipcRenderer.invoke('amigos:recusar', dados),
  removerAmigo: (dados) => ipcRenderer.invoke('amigos:remover', dados),
  bloquearAmigo: (dados) => ipcRenderer.invoke('amigos:bloquear', dados),
  desbloquearAmigo: (dados) => ipcRenderer.invoke('amigos:desbloquear', dados),
  listarBloqueados: (perfil) => ipcRenderer.invoke('amigos:bloqueados', perfil),
  listarDm: (dados) => ipcRenderer.invoke('dm:listar', dados),
  enviarDm: (dados) => ipcRenderer.invoke('dm:enviar', dados),

  getConfig: (chave) => ipcRenderer.invoke('config:get', chave),
  setConfig: (chave, valor) => ipcRenderer.invoke('config:set', chave, valor),

  backup: () => ipcRenderer.invoke('recovery:backup'),
  listarBackups: () => ipcRenderer.invoke('recovery:listar'),
  restaurar: (nome) => ipcRenderer.invoke('recovery:restaurar', nome),

  entrarConta: (dados) => ipcRenderer.invoke('cloud:entrar', dados),
  criarConta: (dados) => ipcRenderer.invoke('cloud:criar-conta', dados),
  sairConta: () => ipcRenderer.invoke('cloud:sair'),
  estadoCloud: () => ipcRenderer.invoke('cloud:estado'),
  sincronizarCloud: () => ipcRenderer.invoke('cloud:sincronizar'),
  perfilAuto: () => ipcRenderer.invoke('perfil:auto'),

  onMensagemProativa: (callback) => {
    const handler = (_evento, dados) => callback(dados)
    ipcRenderer.on('chat:proativa', handler)
    return () => ipcRenderer.removeListener('chat:proativa', handler)
  }
})
