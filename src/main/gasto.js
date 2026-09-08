// Controle de limite de gasto (em dólar) das APIs de IA.
// O gasto é acumulado por mês e reseta automaticamente no dia 1º.

const CHAVE_LIMITE = 'ia_limite_dolar'
const CHAVE_GASTO = 'ia_gasto_dolar'
const CHAVE_MES = 'ia_gasto_mes'

function mesAtual() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Zera o acumulado quando o mês muda.
function garantirMes(banco) {
  const mes = mesAtual()
  if (banco.getConfig(CHAVE_MES) !== mes) {
    banco.setConfig(CHAVE_MES, mes)
    banco.setConfig(CHAVE_GASTO, '0')
  }
}

export function obterGasto(banco) {
  garantirMes(banco)
  return Number(banco.getConfig(CHAVE_GASTO) || '0') || 0
}

export function obterLimite(banco) {
  return Number(banco.getConfig(CHAVE_LIMITE) || '0') || 0
}

// true quando o limite (maior que zero) já foi atingido.
export function limiteAtingido(banco) {
  const limite = obterLimite(banco)
  if (!limite) return false
  return obterGasto(banco) >= limite
}

// Soma um custo (em dólar) ao gasto do mês e devolve o total.
export function registrarGasto(banco, valorDolar) {
  const total = obterGasto(banco) + (Number(valorDolar) || 0)
  banco.setConfig(CHAVE_GASTO, String(Math.round(total * 1e6) / 1e6))
  return total
}
