/* globals PACKAGE_VERSION */

import React from 'react';
import pick from 'lodash/pick';
import ReactDOM from 'react-dom';
import Placement from './model/placement.jsx';
import KwizzadDialog from './components/kwizzad-dialog.jsx';
import { setLocale } from './lib/i18n.jsx';

import './kwizzad.css';

export default class Kwizzad {
  static PACKAGE_VERSION = PACKAGE_VERSION;

  constructor(options) {
    this.options = options;
    this.options.placement = new Placement(pick(options,
      'placementId',
      'apiKey',
      'baseUrl',
    ));
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

        ref={(ref) => { this.dialog = ref; }}

        onShow={() => {
          this.containerElement.classList.add('kwizzad-container-visible');
          setTimeout(() => this.containerElement.classList.add('kwizzad-container-show'), 200);
        }}

        onClose={() => {
          this.containerElement.classList.remove('kwizzad-container-show');
          setTimeout(() => {
            this.containerElement.classList.remove('kwizzad-container-visible');
          }, 1000);
        }}
      />,
      this.containerElement,
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

window.Kwizzad = Kwizzad;
