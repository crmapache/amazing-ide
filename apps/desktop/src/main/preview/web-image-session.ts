import { session } from 'electron'

import type { WebFetch } from './web-image'
import { WEB_IMAGE_PARTITION } from './web-image.constants'

/**
 * fetch картинок просмотра - сетью Chromium (системный прокси человека), но в своём
 * сеансе в памяти: cookies и кэш окна ему не видны. Сеанс заводится на первом запросе.
 */
export const fetchWebImage: WebFetch = (url, init) =>
  session.fromPartition(WEB_IMAGE_PARTITION).fetch(url, init)
