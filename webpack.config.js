/* eslint import/no-extraneous-dependencies:0 */
const webpack = require('webpack');
const nib = require('nib');
const path = require('path');
const package = require('./package.json');

const ExtractTextPlugin = require('extract-text-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const config = {
  context: __dirname,

  entry: [
    'babel-polyfill',
    './app/kwizzad.jsx',
  ],

  output: {
    filename: 'kwizzad.js',
    path: path.join(__dirname, '/public'),
  },

  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loaders: [
          'babel-loader',
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.styl$/,
        loader: 'style-loader!css-loader!stylus-loader',
      },
      {
        test: /\.woff$/,
        loader: 'url',
        query: {
          name: 'font/[hash].[ext]',
          limit: 5000,
          mimetype: 'application/font-woff',
        },
      },

    ],
  },
  resolve: {
    root: [
      path.join(__dirname, 'node_modules'),
      __dirname,
    ],
    extensions: ['', '.js', '.jsx', '.json', '.styl', '.woff'],
    // alias: {
    //   react: 'react-lite',
    //   'react-dom': 'react-lite',
    // },
  },
  plugins: [
    new ExtractTextPlugin('main.css', { allChunks: true }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      },
      'PACKAGE_VERSION': `'${package.version}'`,
    }),
    // new BundleAnalyzerPlugin(),
  ],
  devServer: {
    historyApiFallback: true,
    publicPath: '/public/',
    index: '/public/',
    inline: true,
    hot: true,
  },
  stylus: {
    use: [nib],
    preferPathResolver: 'webpack',
    import: ['~nib/lib/nib/index.styl'],
  },
};

if (process.env.NODE_ENV === 'production') {
  config.plugins = config.plugins.concat([
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin(),
  ]);
}

module.exports = config;
