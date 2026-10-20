import { PrefSwitchScreen } from '../PrefSwitchScreen/PrefSwitchScreen'

/**
 * Settings → Open file and selection: уходит ли с сообщением открытый файл (и
 * выделенные строки, когда появится редактор). Тот же выключатель - в меню чипа файла
 * под полем; там же одно сообщение можно отправить наперекор.
 */
export const ShareEditorScreen = () => <PrefSwitchScreen pref="shareEditor" />
