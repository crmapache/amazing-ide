/**
 * Строгая дизайн-система держится здесь, а не на внимательности: сырые цвета,
 * шрифты, радиусы, слои и отступы в стилях компонентов не проходят линтер.
 * Значения живут только в packages/ui/src/styles/tokens.css, компоненты берут их
 * через var(--...). Нужного токена нет - его добавляют в tokens.css, а не пишут
 * число на месте.
 */

/** Свойства, которым разрешены только токены (и пара безопасных ключевых слов). */
const TOKEN_ONLY_PROPERTIES = [
  '/color$/',
  'fill',
  'stroke',
  'background',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'border-radius',
  'z-index',
  'box-shadow',
  'gap',
  'row-gap',
  'column-gap',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'transition-duration',
  'transition-timing-function',
]

export default {
  extends: ['stylelint-config-standard-scss'],
  plugins: ['stylelint-declaration-strict-value'],
  ignoreFiles: ['**/node_modules/**', '**/out/**', '**/dist/**'],
  rules: {
    // CSS Modules: классы читаются из JS как styles.fooBar, поэтому camelCase.
    'selector-class-pattern': [
      '^[a-z][a-zA-Z0-9]*$',
      { message: 'Класс CSS Modules - camelCase (styles.fooBar)' },
    ],
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklch'],
    'declaration-property-value-disallowed-list': {
      transition: ['/\\ball\\b/'],
      'transition-property': ['all'],
    },
    'scale-unlimited/declaration-strict-value': [
      TOKEN_ONLY_PROPERTIES,
      {
        ignoreValues: [
          '0',
          'auto',
          'none',
          'inherit',
          'initial',
          'unset',
          'currentcolor',
          'transparent',
        ],
        expandShorthand: true,
        disableFix: true,
        message: 'Только токен дизайн-системы var(--...) (packages/ui/src/styles/tokens.css)',
      },
    ],
  },
  overrides: [
    {
      // Здесь токены и объявляются: сырые значения тут на своём месте.
      files: ['packages/ui/src/styles/tokens.css'],
      rules: {
        'color-no-hex': null,
        'function-disallowed-list': null,
        'scale-unlimited/declaration-strict-value': null,
      },
    },
  ],
}
