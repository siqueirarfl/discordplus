// Integração com a nuvem (Supabase): autenticação + sincronização do histórico.
// A sessão é persistida no SQLite local (config chave/valor), então o login
// sobrevive a reinícios do aplicativo.

import { createClient } from '@supabase/supabase-js'

let supabase = null

function criarStorage(banco) {
  return {
    getItem: (chave) => banco.getConfig(`cloud_${chave}`) ?? null,
    setItem: (chave, valor) => {
      banco.setConfig(`cloud_${chave}`, String(valor))
    },
    removeItem: (chave) => {
      banco.setConfig(`cloud_${chave}`, '')
    }
  }
}

export function iniciarCloud(url, publishableKey, banco) {
  if (!url || !publishableKey) return null
  supabase = createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: criarStorage(banco)
    }
  })
  return supabase
}

export function cloudAtivo() {
  return Boolean(supabase)
}

export async function usuarioCloud() {
  if (!supabase) return null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) return null
    return { id: data.user.id, email: data.user.email }
  } catch {
    return null
  }
}

export async function criarConta(email, senha) {
  if (!supabase) return { erro: 'Nuvem não configurada.' }
  const { data, error } = await supabase.auth.signUp({ email, password: senha })
  if (error) return { erro: error.message }
  return { ok: true, precisaConfirmar: !data.session }
}

export async function entrarConta(email, senha) {
  if (!supabase) return { erro: 'Nuvem não configurada.' }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
  if (error) return { erro: error.message }
  return { ok: true, usuario: data.user ? { id: data.user.id, email: data.user.email } : null }
}

export async function recuperarSenha(email) {
  if (!supabase) return { erro: 'Nuvem não configurada.' }
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) return { erro: error.message }
  return { ok: true }
}

export async function sairConta() {
  if (!supabase) return { ok: true }
  await supabase.auth.signOut().catch(() => {})
  return { ok: true }
}

export async function puxarSync() {
  if (!supabase) return null
  const u = await usuarioCloud()
  if (!u) return null
  const { data, error } = await supabase
    .from('sync_data')
    .select('dados')
    .eq('user_id', u.id)
    .maybeSingle()
  if (error || !data) return null
  return data.dados
}

export async function enviarSync(dados) {
  if (!supabase) return false
  const u = await usuarioCloud()
  if (!u) return false
  const { error } = await supabase
    .from('sync_data')
    .upsert({ user_id: u.id, dados, atualizado_em: Date.now() })
  return !error
}

// Ajustes remotos (leitura pública): frases proativas, flags, etc.
export async function puxarAjustes() {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('dados')
      .eq('id', 1)
      .maybeSingle()
    if (error || !data) return null
    return data.dados
  } catch {
    return null
  }
}

// Envio de logs de erro para a nuvem (diagnóstico remoto).
// Não depende de login: a tabela error_logs aceita escrita anônima.
export async function enviarErro({ nivel, fonte, mensagem, detalhes }) {
  if (!supabase) return false
  try {
    const { error } = await supabase
      .from('error_logs')
      .insert({ nivel, fonte, mensagem, detalhes: String(detalhes || '').slice(0, 500) })
    return !error
  } catch {
    return false
  }
}
