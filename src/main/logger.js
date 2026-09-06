// Log simples: guarda em memória (últimas 500) e escreve em arquivo no userData.
import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'

let caminhoArquivo = null
const logsMemoria = []
let enviador = null

export function iniciarLogger() {
  try {
    const dir = join(app.getPath('userData'), 'logs')
    fs.mkdirSync(dir, { recursive: true })
    caminhoArquivo = join(dir, 'app.log')
  } catch {
    caminhoArquivo = null
  }
}

export function definirEnvio(fn) {
  enviador = typeof fn === 'function' ? fn : null
}

export function registrarLog(nivel, fonte, mensagem, detalhes) {
  const linha = `[${new Date().toISOString()}] [${String(nivel).toUpperCase()}] [${fonte}] ${mensagem}`
  logsMemoria.push(linha)
  if (logsMemoria.length > 500) logsMemoria.shift()
  if (!caminhoArquivo) return
  try {
    let extra = ''
    if (detalhes !== undefined && detalhes !== null) {
      extra = ' :: ' + (typeof detalhes === 'string' ? detalhes : JSON.stringify(detalhes))
    }
    fs.appendFileSync(caminhoArquivo, linha + extra + '\n')
  } catch {}
  if (nivel === 'erro' && enviador) {
    try { enviador({ nivel, fonte, mensagem, detalhes }) } catch {}
  }
}

export function listarLogs(limite = 300) {
  if (!caminhoArquivo) return logsMemoria.slice(-limite)
  try {
    const linhas = fs.readFileSync(caminhoArquivo, 'utf-8').split('\n').filter(Boolean)
    return linhas.slice(-limite)
  } catch {
    return logsMemoria.slice(-limite)
  }
}

export function limparLogs() {
  logsMemoria.length = 0
  if (!caminhoArquivo) return
  try { fs.writeFileSync(caminhoArquivo, '') } catch {}
}
