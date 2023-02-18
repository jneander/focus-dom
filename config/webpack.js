const path = require('path')

const webpack = require('webpack')

const pkgPath = path.join(__dirname, '..')
const srcPath = path.join(pkgPath, 'src')

module.exports = {
  devtool: 'eval',

  mode: 'none',

  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.ts$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',

                  {
                    modules: false,

                    targets: {
                      browsers: [
                        'last 2 chrome versions',
                        'last 2 firefox versions',
                        'last 2 edge versions',
                        'last 2 ios versions',
                        'last 2 opera versions',
                        'last 2 safari versions',
                        'last 2 ChromeAndroid versions',
                      ],
                    },

                    useBuiltIns: false,
                  },
                ],

                '@babel/preset-typescript',
              ],
            },
          },
        ],
      },
    ],
  },

  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },

  output: {
    filename: 'js/[name].js',
    path: path.join(pkgPath, '__build__'),
    pathinfo: false,
    publicPath: '/',
  },

  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
    }),
  ],

  resolve: {
    extensions: ['.js', '.ts'],
    modules: [srcPath, 'node_modules'],
  },

  stats: {
    colors: true,
  },
}
