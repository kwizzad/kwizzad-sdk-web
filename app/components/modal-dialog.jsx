/* eslint-disable max-len */

import React, { Component } from 'react';
import { default as p } from 'app/lib/prefix-css-classes';
import './modal-dialog.styl';


export default class ModalDialog extends Component {
  render() {
    const isVisible = this.props.isVisible;

    if (!isVisible && !this.props.isRenderedIfInvisible) {
      return null;
    }

    const hasKeyboard = this.props.isKeyboardShown;

    return (
      <div className={p(`modal-dialog modal-dialog-${this.props.className} ${!isVisible ? p('modal-dialog-hidden') : ''}`)}>
        <div className={p('modal-dialog-fullscreen-overlay')} onClick={this.props.onClose} />
        <div className={p(`modal-dialog-inner ${hasKeyboard ? 'with-shown-keyboard' : ''}`)}>
          <div className={p('modal-dialog-content')}>
            <button className={p('close-dialog')} onClick={this.props.onClose}>
              <svg width="0.5em" height="0.5em" viewBox="168 231 31 31" version="1.1">
                {this.props.closeButtonElement || <polygon id="×" stroke="none" fill="#FFFFFF" fillRule="evenodd" points="180.121094   246.582031 168.90625 235.296875 172.351562 231.816406     183.601562 243.066406   194.957031 231.816406 198.4375 235.191406   187.046875   246.582031 198.367188   257.902344 194.957031 261.277344   183.601562 250.027344   172.351562 261.207031   168.976562 257.832031" />}
              </svg>
            </button>
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}


// Validate all props that are used inside the component to warn early if they're not supplied
// correctly
ModalDialog.propTypes = {
  onClose: React.PropTypes.func.isRequired,
  isVisible: React.PropTypes.bool.isRequired,
  className: React.PropTypes.string.isRequired,
  isKeyboardShown: React.PropTypes.bool,
  isRenderedIfInvisible: React.PropTypes.bool,
  closeButtonElement: React.PropTypes.element,
  children: React.PropTypes.node
};
