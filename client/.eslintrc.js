const rules = require('common/eslint.cjs')

module.exports = {
  env: {
    es6: true,
    browser: true,
  },
  extends: ['react-app', 'eslint:recommended', 'plugin:prettier/recommended'],
  rules,
}
