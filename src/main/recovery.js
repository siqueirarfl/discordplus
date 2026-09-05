import fs from 'fs'
import path from 'path'

// Backup automático do banco local. Mantém os últimos N backups.
export function criarBackup(caminhoDb, dirBackups, maxBackups = 7) {
  if (!fs.existsSync(caminhoDb)) return null
  fs.mkdirSync(dirBackups, { recursive: true })
  const nome = `discordplus-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.db`
  const destino = path.join(dirBackups, nome)
  fs.copyFileSync(caminhoDb, destino)

  const backups = fs
    .readdirSync(dirBackups)
    .filter((f) => f.endsWith('.db'))
    .sort()
  while (backups.length > maxBackups) {
    fs.unlinkSync(path.join(dirBackups, backups.shift()))
  }
  return destino
}

export function listarBackups(dirBackups) {
  if (!fs.existsSync(dirBackups)) return []
  return fs
    .readdirSync(dirBackups)
    .filter((f) => f.endsWith('.db'))
    .sort()
    .reverse()
}

export function restaurarBackup(caminhoDb, dirBackups, nomeArquivo) {
  const origem = path.join(dirBackups, nomeArquivo)
  if (!fs.existsSync(origem)) throw new Error('Backup não encontrado.')
  // Garante um backup do estado atual antes de sobrescrever.
  criarBackup(caminhoDb, dirBackups)
  fs.copyFileSync(origem, caminhoDb)
  return true
}
