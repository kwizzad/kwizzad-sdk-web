import React from 'react';
import ReactDOM from 'react-dom';
import Placement from './model/placement';
import KwizzadDialog from './components/kwizzad-dialog';
import { setLocale } from './lib/i18n';

import './kwizzad.styl';

if (module.hot) {
  // eslint-disable-next-line global-require
  require('webpack/hot/dev-server');
}

// This is necessary to enable hot module reloads in development.
// eslint-disable-next-line
__webpack_public_path__ = __webpack_public_path__ || '/public/';


export default class Kwizzad {
  constructor(options) {
    this.options = options;
    this.options.placement = new Placement({
      placementId: this.options.placementId,
      apiKey: this.options.apiKey,
    });
    setLocale('de');
  }

  setLocale(locale) {
    setLocale(locale);
  }

  render() {
    // Create container <div> for dialog
    const bodyElement = document.getElementsByTagName('body')[0];
    this.containerElement = document.createElement('div');
    this.containerElement.classList.add('kwizzad-container');
    bodyElement.appendChild(this.containerElement);

    const props = this.options;
    ReactDOM.render(
      <KwizzadDialog
        {...props}
        ref={ref => { this.dialog = ref; }}
        onShow={() => {
          this.containerElement.classList.add('kwizzad-container-visible');
          setTimeout(() => this.containerElement.classList.add('kwizzad-container-show'), 200);
        }}
        onClose={() => {
          this.containerElement.classList.remove('kwizzad-container-show');
          setTimeout(() => this.containerElement.classList.remove('kwizzad-container-visible'), 1000);
        }}
      />,
      this.containerElement
    );

    return this;
  }

  requestAd(options) {
    if (!this.dialog) {
      throw new Error('Please call render() before calling requestAd().');
    }
    this.dialog.requestAd(options);
  }
}

// Allow the website that load the SDK asynchronously and to define a callback when we
// finish loading.
if (typeof window.onKwizzadLoaded === 'function') {
  window.onKwizzadLoaded(Kwizzad);
}
