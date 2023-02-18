const config = require('./babel.config')

module.exports = {
  ...config,

  ignore: ['**/*.spec.js', '**/_specs_/**'],
}
