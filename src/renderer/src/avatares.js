import robomax from './assets/avatares/robomax.png'
import pixel from './assets/avatares/pixel.png'
import nexty from './assets/avatares/nexty.png'
import block from './assets/avatares/block.png'
import maxbot from './assets/avatares/maxbot.png'
import pibby from './assets/avatares/pibby.png'
import luna from './assets/avatares/luna.png'
import fritz from './assets/avatares/fritz.png'
import sakura from './assets/avatares/sakura.png'

export const AVATARES = {
  robomax,
  pixel,
  nexty,
  block,
  maxbot,
  pibby,
  luna,
  fritz,
  sakura
}

export function avatarSrc(p) {
  if (!p) return null
  if (typeof p.avatar === 'string' && p.avatar.startsWith('data:image')) return p.avatar
  if (p.avatar && AVATARES[p.avatar]) return AVATARES[p.avatar]
  if (p.avatarImg && AVATARES[p.avatarImg]) return AVATARES[p.avatarImg]
  return null
}
