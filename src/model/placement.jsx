// @flow

import uniq from 'lodash/uniq';
import requestJSON from '../lib/request.jsx';
import defaults from '../lib/defaults.jsx';
import getInstallId from './install-id.jsx';
import Reward, { incentiveTextForRewards, summarize as summarizeRewards } from './reward.jsx';
import { transactionsFromJSON } from './transaction.jsx';


const AllowedAdStates = [
  'INITIAL',
  'REQUESTING_AD',
  'NOFILL',
  'RECEIVED_AD',
  'LOADING_AD',
  'AD_READY',
  'SHOWING_AD',
  'CALL2ACTION',
  'CALL2ACTIONCLICKED',
  'GOAL_REACHED',
  'DISMISSED',
];

const StatesThatAllowRequests = [
  'INITIAL',
  'NOFILL',
  'AD_READY', // after expiration
  'DISMISSED',
];

function operatingSystemFromUserAgent() {
  const ua = navigator.userAgent;
  if (ua.match(/Windows/)) {
    return 'Windows';
  } else if (ua.match(/Windows/)) {
    return 'Android';
  } else if (ua.match(/iPhone/)) {
    return 'iOS';
  } else if (ua.match(/Macintosh/)) {
    return 'Macintosh';
  } else if (ua.match(/Android/)) {
    return 'Android';
  } else if (ua.match(/Linux/)) {
    return 'Linux';
  }
  return 'Unknown';
}

function adMetaInfoFromResponse(response) {
  const potentialRewards = (response.rewards || []).map(reward => new Reward(reward));
  const incentiveText = incentiveTextForRewards(potentialRewards);
  const maximalReward = summarizeRewards(potentialRewards)[0];
  const images = response.images.map(image => {
    const preformattedImageUrl = image.url;
    return Object.assign(image, {
      url(width, height) {
        if (!this.urlTemplate) return preformattedImageUrl;
        return this.urlTemplate
            .replace(/{{width}}/, width || 0)
            .replace(/{{height}}/, height || 0);
      },
    });
  });
  return {
    potentialRewards,
    incentiveText,
    ad: response.ad,
    images,
    maximalReward,
    squaredThumbnailUrl(width = 200) {
      return images.find(image => image.type === 'header').url(width);
    },
  };
}

export default class Placement {
  constructor(options = {}) {
    if (!options) {
      throw new Error('Please supply valid placement options.');
    }

    this.options = Object.assign({}, options);
    this.options.baseUrl = this.options.baseUrl || defaults.baseUrl;

    if (typeof this.options.baseUrl !== 'string') {
      throw new Error('Please supply a valid base URL.');
    }

    if (typeof this.options.apiKey !== 'string') {
      throw new Error('Please supply a valid API key.');
    }

    if (typeof this.options.placementId !== 'string') {
      throw new Error('Please supply a valid placement ID.');
    }

    this.state = 'INITIAL';
  }


  setState(newState) {
    if (!AllowedAdStates.includes(newState)) {
      throw new Error('Invalid placement state');
    }
    console.log('Placement', this.options.placementId, 'going from', this.state, '->', newState);
    this.state = newState;
    if (typeof this.options.onStateChange === 'function') {
      this.options.onStateChange(this, newState);
    }
  }


  makeAPIRequest(options) {
    let requestFunction = this.options.requestFunction || requestJSON;
    const installId = this.options.installId || getInstallId();
    const url = `${this.options.baseUrl.replace(/\/?/, '')}/${this.options.apiKey}/${installId}`;
    requestFunction(Object.assign({ url, method: 'POST' }, options));
  }


  requestAd(options) {
    clearTimeout(this.nextAdRequestTimeout);
    if (!StatesThatAllowRequests.includes(this.state)) {
      console.log('Kwizzad: Cannot make a request in', this.state, 'state.');
      return;
    }

    this.setState('REQUESTING_AD');

    const { onError, user } = options;

    if (typeof options.onAdLoading === 'function') {
      options.onAdLoading(this);
    }

    if (typeof options.sdkVersion === 'undefined') {
      throw new Error('SDK version must be defined.');
    }

    this.lastAdRequestOptions = options;

    this.userId = user && user.id;

    const language = navigator.language.slice(0, 2);

    this.makeAPIRequest({
      data: [{
        type: 'adRequest',
        placementId: this.options.placementId,
        deviceInformation: navigator.userAgent,
        language: language,
        languages: uniq((navigator.languages || [language]).map(l => l.slice(0, 2))),
        userData: {
          apiVersion: '1.0',
          PlatformType: operatingSystemFromUserAgent(),
          sdkType: 'Web',
          userId: user && user.id,
          userName: user && user.name,
          sdkVersion: options.sdkVersion,
          userAgent: navigator.userAgent,
          gender: user && user.gender && user.gender.toUpperCase(),
          facebookUserId: user && user.facebookUserId,
        },
      }],
      callback: (error, responses) => {
        if (error || !(responses instanceof Array)) {
          this.setState('NOFILL');
          if (typeof onError === 'function') {
            onError(error || new Error('Unexpected ad response format'));
          }
          return;
        }
        responses.forEach(response => this.handleResponse(response, options));
      },
    });
  }


  requestAnotherAdAfter(milliseconds) {
    if (milliseconds < 0) {
      throw new Error('Invalid time interval');
    }
    const options = this.lastAdRequestOptions;
    if (!options) {
      console.log('Cannot request another ad when there was no first ad request.');
      return;
    }
    console.log('Requesting another ad after', milliseconds, 'ms');
    clearTimeout(this.nextAdRequestTimeout);
    this.nextAdRequestTimeout = setTimeout(() => this.requestAd(options), milliseconds);
  }


  requestAnotherAdOnDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const milliseconds = +date - now;
    if (milliseconds > 0) {
      this.requestAnotherAdAfter(milliseconds);
    }
  }


  confirmTransactions(transactions) {
    const confirmationEvents = transactions.map(transaction => ({
      type: 'transactionConfirmed',
      adId: transaction.adId,
      transactionId: transaction.transactionId,
    }));
    this.makeAPIRequest({
      data: confirmationEvents,
      callback: (error, responses) => {
        if (error) {
          console.log('Could not confirm transactions.', error, responses);
        }
      },
    });
  }


  isValidAdResponse(response) {
    const propertyNames = ['url', 'placementId', 'adId'];
    return propertyNames.every(propertyName => typeof response[propertyName] === 'string');
  }


  handleAdResponse(response, options) {
    this.lastAdResponse = response;
    if (!this.isValidAdResponse(response)) {
      console.log('Ad response has unknown/invalid format.', JSON.stringify(response));
      this.setState('NOFILL');
      return;
    }
    this.loadAd(response, options);
  }


  handleOpenTransactions(response, options = this.lastAdRequestOptions) {
    const confirmFunction = this.confirmTransactions.bind(this);
    const transactions = transactionsFromJSON(response.transactions, confirmFunction);
    if (!transactions) {
      return;
    }
    if (options && typeof options.onOpenTransactions === 'function') {
      options.onOpenTransactions(transactions);
    }
  }


  handleNoFillResponse(response, options) {
    this.setState('NOFILL');
    if (options && typeof options.onNoFill === 'function') {
      options.onNoFill(this);
    }
    if (response.retryAfter) {
      this.requestAnotherAdOnDate(response.retryAfter);
    }
  }


  handleResponse(response, options) {
    switch (response.type) {
      case 'adResponse': this.handleAdResponse(response, options); break;
      case 'openTransactions': this.handleOpenTransactions(response, options); break;
      case 'adNoFill': this.handleNoFillResponse(response, options); break;
      default: console.log('Unknown response type', response.type); break;
    }
  }


  loadAd(response, options) {
    this.setState('LOADING_AD');
    this.adId = response.adId;
    if (typeof options.onAdResponse === 'function') {
      options.onAdResponse(response, options);
    }

    if (response.expiry) {
      this.requestAnotherAdOnDate(response.expiry);
    }

    // For now, our ad can be shown directly, we don't wait for the DOM to be rendered within
    // the iframe.
    this.setState('AD_READY');
    if (typeof options.onAdAvailable === 'function') {
      const showAd = () => this.showAd(response, options);
      options.onAdAvailable(showAd, adMetaInfoFromResponse(response));
    }
  }


  showAd(response, options) {
    console.log('Showing ad', response, options);
    clearTimeout(this.nextAdRequestTimeout);
    const expireDate = new Date(response.expiry);
    if (new Date() < expireDate) {
      console.log('Showing ad...');
      this.setState('SHOWING_AD');
      if (typeof options.onShow === 'function') {
        options.onShow();
        this.makeAPIRequest({
          data: [{
            type: 'adStarted',
            adId: this.adId,
            customParameters: this.userId ? [
              { key: 'userId', value: this.userId },
            ] : [],
          }],
          callback: (error, responses) => {},
        });
      }
    } else {
      this.setState('DISMISSED');
      this.requestAnotherAdAfter(1000);
      console.log('Ad expired, dismissed.');
    }
  }


  dismissAd() {
    clearTimeout(this.nextAdRequestTimeout);
    this.setState('DISMISSED');
    this.makeAPIRequest({
      data: [{
        type: 'adDismissed',
        adId: this.adId,
      }],
      callback: (error, responses) => {
        if (error || !(responses instanceof Array)) {
          console.log('Could not send dismissedAd event.', error, responses);
          return;
        }
        this.requestAnotherAdAfter(1000);
        responses.forEach(response => this.handleResponse(response));
      },
    });
  }


  // Not used yet.
  shouldCloseButtonBeVisible() {
    switch (this.state.closeType) {
      case 'AFTER_CALL2ACTION':
      case 'AFTER_CALL2ACTION_PLUS':
        return ['CALL2ACTIONCLICKED', 'GOAL_REACHED'].includes(this.state.adState);
      case 'BEFORE_CALL2ACTION':
        return ['CALL2ACTION', 'CALL2ACTIONCLICKED', 'GOAL_REACHED'].includes(this.state.adState);
      default: // OVERALL
        return true;
    }
  }
}