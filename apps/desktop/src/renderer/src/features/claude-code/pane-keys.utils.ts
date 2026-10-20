import type { Conversation, RefusedModes, PermissionMode } from '@shared/claude'
import { modeModel } from '@shared/claude'

/** Какие из необязательных режимов доступны разговору: bypass - запрет слоёв, auto - отказ CLI. */
export type ModeAvailability = { bypass: boolean; auto: boolean }

/**
 * Доступность режимов (как в ACC): bypass - пока его не запретили слои настроек проекта
 * (неизвестно - недоступен) и CLI не отказал; auto - пока CLI не отказал на этой модели.
 */
export const modeAvailability = (
  refused: RefusedModes,
  bypassDisabled: boolean | undefined,
  conversation: Pick<Conversation, 'model' | 'activeModel'> | null,
): ModeAvailability => ({
  bypass: bypassDisabled === false && !refused.bypass,
  auto: !conversation || !refused.autoModels.includes(modeModel(conversation)),
})

/** Режим есть в меню, но выбрать его нельзя: недоступный ведёт только к отказу CLI. */
export const isModeOff = (mode: PermissionMode, available: ModeAvailability): boolean =>
  (mode === 'bypassPermissions' && !available.bypass) || (mode === 'auto' && !available.auto)

/**
 * Следующий режим по Shift+Tab - круг терминального Claude Code (как в ACC): спрашивать →
 * принимать правки → план → без вопросов → авто → спрашивать; недоступный пропускается.
 */
export const nextMode = (mode: PermissionMode, available: ModeAvailability): PermissionMode => {
  switch (mode) {
    case 'default':
      return 'acceptEdits'
    case 'acceptEdits':
      return 'plan'
    case 'plan':
      return available.bypass ? 'bypassPermissions' : available.auto ? 'auto' : 'default'
    case 'bypassPermissions':
      return available.auto ? 'auto' : 'default'
    default:
      return 'default'
  }
}

/**
 * Куда легла бы нажатая цифра или Enter: в поле ввода ответа, в чужое поле или в поле
 * сообщения с черновиком - тогда клавиша их, а не карточки над полем.
 */
export const typedInto = (target: EventTarget | null, composerEmpty: boolean): boolean => {
  if (!(target instanceof HTMLElement)) return false
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return true

  return target.isContentEditable && !composerEmpty
}

/** Клавиша пришла из диалога или всплывающей панели: Esc там закрывает их, а не ход. */
export const fromOverlay = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest('dialog, [popover]') !== null
