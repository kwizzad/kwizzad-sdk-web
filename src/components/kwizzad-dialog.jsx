import React, { Component } from 'react';
import parseQueryParams from '../lib/query-params.jsx';
import ModalDialog from './modal-dialog.jsx';
import Iframe from './iframe.jsx';
import PropTypes from 'prop-types';

import './kwizzad-dialog.css';

let lastCloseEventListener = null;

export default class KwizzadDialog extends Component {
  constructor(props) {
    super(props);
    // Simple replacement for ReactRouter etc. -- we don't need pushState support, as our
    // URL does not change like in other single page applications. Path + Query parameters can
    // optionally be given behind a hash character (#), e.g. like this:
    // `http://host/page.html#/path/goes/here?foo=bar`

    const pathRegexp = /^#?\/?([^/]+)\/([^/?]+)/;
    const { hash, pathname } = window.location;
    const match = hash ? hash.match(pathRegexp) : pathname.match(pathRegexp);
    const hashQueryParamsString = (hash && (hash.match(/\?.*$/) || [])[0]) || '';
    const queryParamsString = hash ? hashQueryParamsString : window.location.search;

    this.state = {
      queryParams: parseQueryParams(queryParamsString),
      isVisible: false,
    };

    if (match) {
      const [, resourceType, resourceId] = match;
      this.setState({ [resourceType]: resourceId });
    }
  }

  requestAd(options) {
    const requestOptions = {
      onAdResponse: (response) => {
        const url = response.url;
        const param = `timestamp=${Date.now()}`;
        this.setState({ src: url.match(/#/) ? url.replace(/#/, `?${param}#`) : `${url}&${param}` });
      },
      onShow: () => {
        if (typeof this.props.onShow === 'function') { this.props.onShow(); }
        this.setState({ isVisible: true });
      },
    };
    this.props.placement.requestAd(Object.assign(requestOptions, options));
    this.onAdDismissed = options.onAdDismissed;
    return this;
  }

  componentWillMount() {
    this.setHeight = () => {
      const height = window.innerHeight;
      if (height !== 0) {
        this.setState({ height });
        // Height might not be set yet on first rendering, so set it again after one frame
        setTimeout(() => {
          this.setState({ height });
        });
      }
    };

    window.addEventListener('resize', this.setHeight);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setHeight);
  }

  render() {
    if (lastCloseEventListener) {
      window.removeEventListener('message', lastCloseEventListener);
    }

    const lastCloseFn = () => {
      this.setState({ isVisible: false });
      this.props.placement.dismissAd();
      if (typeof this.onAdDismissed === 'function') {
        this.onAdDismissed();
      }
      if (typeof this.props.onClose === 'function') { this.props.onClose(); }
    };

    lastCloseEventListener = e => {
      if (e.data === 'kwizzad.call2Action') {
        lastCloseFn();
      }
    };

    // Listen to message from child window
    window.addEventListener('message', lastCloseEventListener, false);

    return (<ModalDialog
      className="iframe"
      isRenderedIfInvisible
      onClose={lastCloseFn}
      isVisible={Boolean(this.state.src) && this.state.isVisible}
      height={this.state.height}
    >
      <Iframe {...this.state} />
    </ModalDialog>);
  }
}


KwizzadDialog.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    gender: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    facebookUserId: PropTypes.string.isRequired,
  }),
  placement: PropTypes.shape({
    requestAd: PropTypes.func.isRequired,
    dismissAd: PropTypes.func.isRequired,
  }).isRequired,
  apiKey: PropTypes.string.isRequired,
  placementId: PropTypes.string.isRequired,
  onShow: PropTypes.func,
  onClose: PropTypes.func,
};
