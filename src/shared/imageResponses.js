export function imagemDeRespostaPadrao(dados) {
  const item = dados?.data?.[0]
  if (item?.b64_json) return `data:${item.media_type || 'image/png'};base64,${item.b64_json}`
  if (item?.url) return item.url
  if (dados?.result?.sample) return dados.result.sample
  return null
}
