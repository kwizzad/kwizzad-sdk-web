const webpackConfig = require('./webpack.config');

module.exports = (config) => {
  config.set({
    plugins: [
      'karma-chrome-launcher',
      'karma-mocha',
      'karma-should',
      'karma-sourcemap-loader',
      'karma-mocha-reporter',
      'karma-babel-preprocessor',
      'karma-webpack',
    ],
    browsers: ['Chrome'],
    // singleRun: true,
    frameworks: ['mocha', 'should'],
    logLevel: config.LOG_DEBUG,
    files: [
      { pattern: '**/*-test.jsx' },
    ],
    preprocessors: {
      'app/**/*.jsx': ['babel', 'sourcemap', 'webpack'],
      'test/*-test.jsx': ['babel', 'sourcemap', 'webpack'],
      'test/**/*-test.jsx': ['babel', 'sourcemap', 'webpack'],
    },
    reporters: ['mocha'],
    webpack: webpackConfig,
    webpackServer: {
      noInfo: true,
    },
  });
};
