import { useRef, useState, useEffect } from 'react'

/**
 * Сколько вспышка горит - чуть дольше анимации (--duration-flash в tokens.css): класс
 * снимается после того, как она доиграла, а не посреди.
 */
const FLASH_MS = 1400

/**
 * Вырос ли только что счёт (useGrowthFlash в ACC): номер вспышки, пока она горит, иначе 0;
 * новый на каждый рост - ключом он начинает анимацию заново (Tabs `flash`). Горит на время,
 * а не оставленным классом: то, что рисует счёт, монтируется заново (возврат из редактора), и
 * оставленный класс сыграл бы вспышку за давнее нажатие. null - «ещё не знаю», и рост из него
 * ростом не считается: иначе счёт вспыхивал бы на каждом открытии экрана.
 */
export const useGrowthFlash = (count: number | null): number => {
  const [lit, setLit] = useState(0)
  const was = useRef(count)
  const flashes = useRef(0)

  useEffect(() => {
    const grew = count !== null && was.current !== null && count > was.current

    was.current = count

    if (!grew) return

    flashes.current += 1
    setLit(flashes.current)
  }, [count])

  // Своим эффектом: счёт, сдвинувшийся снова (очередь взяла первую запись), не должен
  // снять таймер и оставить вспышку гореть навсегда.
  useEffect(() => {
    if (!lit) return

    const timer = window.setTimeout(() => setLit(0), FLASH_MS)

    return () => window.clearTimeout(timer)
  }, [lit])

  return lit
}
