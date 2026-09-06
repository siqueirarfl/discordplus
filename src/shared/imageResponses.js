export function imagemDeRespostaPadrao(dados) {
  const item = dados?.data?.[0]
  if (item?.b64_json) return `data:${item.media_type || 'image/png'};base64,${item.b64_json}`
  return item?.url || null
}

export function conteudoDeRespostaGemini(dados) {
  const partes = dados?.candidates?.[0]?.content?.parts || []
  let imagem = null
  let texto = ''
  for (const parte of partes) {
    if (parte?.inlineData?.data) {
      imagem = `data:${parte.inlineData.mimeType || 'image/png'};base64,${parte.inlineData.data}`
    } else if (parte?.text) {
      texto += `${texto ? ' ' : ''}${parte.text}`
    }
  }
  return { imagem, texto: texto.trim() }
}
