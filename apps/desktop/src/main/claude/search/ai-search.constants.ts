/**
 * Модель поиска - Sonnet на низком усилии, запасная - Opus. Это замер ACC, а не вкус: на
 * корпусе в 199 разговоров три запроса по-русски обе нашли верно, Sonnet low - за 10-23 с
 * и 2-7 центов, Opus low - за 15-24 с и 6-16 центов, Sonnet medium - 48 с и двадцать шагов
 * на первом же. Поиск - цепочка вызовов, платят за каждый шаг. Менять модель - перемерить.
 * Псевдонимы, а не полные имена: так поиск идёт за свежей версией каждой.
 */
export const AI_MODEL = 'sonnet'
export const AI_FALLBACK_MODEL = 'opus'
export const AI_EFFORT = 'low'

/** Сколько шагов модели: не нашла за столько - не найдёт. */
export const AI_MAX_TURNS = '30'

/** Две с половиной минуты: тридцать вызовов на холодном кэше, и есть Cancel. */
export const AI_TIMEOUT_MS = 150_000

/** Инструменты - только чтение; папка корпуса больше ничего не держит. */
export const AI_TOOLS = ['Grep', 'Read', 'Glob'] as const

/** Сколько от слов поиска модели показывает шаг - дальше ничего не говорит. */
export const AI_SUBJECT_CHARS = 60

/** Строка потока длиннее - чудовище, которое никто не допишет: буфер сбрасывается. */
export const AI_MAX_LINE_CHARS = 2 * 1024 * 1024

/** Сколько от слов CLI об ошибке влезает в полосу над списком. */
export const AI_ERROR_CHARS = 160

/**
 * Рамка одной строкой и без кавычек - она едет аргументом (кавычка в аргументе режет
 * командную строку на Windows). Причины - на языке запроса: настройка человека «отвечай
 * по-русски» здесь не к месту, модель никому не отвечает.
 */
export const AI_SYSTEM_PROMPT =
  'You look through the past conversations of one person with a coding agent, stored as plain text files in the working directory. ' +
  'Use Grep, Read and Glob to find the messages that match the request and reply with one JSON object only - no preamble and no markdown fence. ' +
  'You are not talking to anyone, so any standing rule about the language of your replies does not apply: write each reason in the language of the request.'

/** План для модели и форма ответа - на stdin, вместе с запросом. */
export const AI_INSTRUCTIONS = `The working directory holds the past conversations of one project between a person and a coding agent, as plain text:

- sessions.txt lists every conversation, newest first: its id, when its first and last messages were written, how many messages it has, and its title.
- <id>.txt holds one conversation. Each message starts with a header line \`## <uuid> <time> <you|claude>\` ("you" is the person, "claude" is the agent), and its text runs until the next header.

Find the messages that best match the request below. The person may remember only roughly what was said and when, and may write in another language than the conversations did: think of the words that would really stand in the text, in every language the conversations may use, and grep for several of them. When the request says anything about time or topic, read sessions.txt first to narrow it down. Read around a match before keeping it, to be sure it is what the person means; the nearest header line above a match gives the message's uuid.

Reply with one JSON object and nothing else:

{"hits": [{"conversationId": "<the id of the file>", "uuid": "<the uuid from the message's header line>", "reason": "<one sentence, in the language of the request, on why this is it>"}]}

Best match first, ten at most, and an empty list - {"hits": []} - when nothing really matches. Never make up an id or a uuid: copy each one from a file you have read.`
