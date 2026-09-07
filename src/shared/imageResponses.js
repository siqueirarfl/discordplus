export function imagemDeRespostaPadrao(dados) {
  const item = dados?.data?.[0]
  if (item?.b64_json) return `data:${item.media_type || 'image/png'};base64,${item.b64_json}`
  if (item?.url) return item.url

  // O OpenRouter devolve imagens geradas pelo endpoint chat/completions
  // dentro de choices[0].message.images. Alguns modelos usam image_url,
  // outros imageUrl ou uma URL direta.
  const imagens = dados?.choices?.[0]?.message?.images || []
  for (const imagem of imagens) {
    const url =
      imagem?.image_url?.url ||
      imagem?.imageUrl?.url ||
      imagem?.url ||
      (typeof imagem === 'string' ? imagem : null)
    if (url) return url
  }

  return null
}

export function textoDeRespostaPadrao(dados) {
  const conteudo = dados?.choices?.[0]?.message?.content
  if (typeof conteudo === 'string') return conteudo.trim()
  if (!Array.isArray(conteudo)) return ''
  return conteudo
    .map((parte) => (typeof parte === 'string' ? parte : parte?.text || parte?.output_text || ''))
    .filter(Boolean)
    .join(' ')
    .trim()
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
