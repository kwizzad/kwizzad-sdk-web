/* globals PACKAGE_VERSION */

import React from 'react';
import pick from 'lodash/pick';
import ReactDOM from 'react-dom';
import Placement from './model/placement.jsx';
import KwizzadDialog from './components/kwizzad-dialog.jsx';
import { overrideLocale } from './lib/i18n';

import './kwizzad.css';

function preventZoomTouchHandler(event: TouchEvent) {
  event = event.originalEvent || event;
  if (event.scale !== 1) {
    event.preventDefault();
  }
}

export default class Kwizzad {
  static PACKAGE_VERSION = typeof PACKAGE_VERSION === 'undefined' ? '0.0.0' : PACKAGE_VERSION;

  constructor(props) {
    this.props = props;
    overrideLocale(props.locale);
    this.props.placement = new Placement(pick(props,
      'placementId',
      'apiKey',
      'baseUrl',
    ));
  }

  render() {
    // Create container <div> for dialog
    const bodyElement = document.getElementsByTagName('body')[0];
    this.containerElement = document.createElement('div');
    this.containerElement.classList.add('kwizzad-container');
    bodyElement.appendChild(this.containerElement);

    const props = this.props;

    const closeFn = () => {
      this.containerElement.classList.remove('kwizzad-container-show');
      setTimeout(() => {
        this.containerElement.classList.remove('kwizzad-container-visible');
      }, 1000);
      document.removeEventListener('touchmove', preventZoomTouchHandler);
    };

    ReactDOM.render(
      <KwizzadDialog
        {...props}

        ref={(ref) => { this.dialog = ref; }}

        onShow={() => {
          this.containerElement.classList.add('kwizzad-container-visible');
          setTimeout(() => this.containerElement.classList.add('kwizzad-container-show'), 200);
          document.addEventListener('touchmove', preventZoomTouchHandler, false);
        }}

        onClose={closeFn}
      />,
      this.containerElement,
    );

    return this;
  }

  requestAd(options) {
    if (!this.dialog) {
      throw new Error('Please call render() before calling requestAd().');
    }
    this.dialog.requestAd(Object.assign({}, options, { sdkVersion: PACKAGE_VERSION }));
  }
}

// Allow the website that load the SDK asynchronously and to define a callback when we
// finish loading.
if (typeof window.onKwizzadLoaded === 'function') {
  window.onKwizzadLoaded(Kwizzad);
}


window.Kwizzad = Kwizzad;
