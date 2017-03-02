/* globals PACKAGE_VERSION */
import requestJSON from 'app/lib/request';
import defaults from 'app/lib/defaults';
import getInstallId from './install-id';
import Reward, { incentiveTextForRewards } from './reward';
import { transactionsFromJSON } from './transaction';


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
  'DISMISSED',
];

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
    console.log('Placement going from', this.state, '->', newState);
    this.state = newState;
    if (typeof this.options.onStateChange === 'function') {
      this.options.onStateChange(this, newState);
    }
  }


  makeAPIRequest(options) {
    const requestFunction = this.options.requestFunction || requestJSON;
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

    this.lastAdRequestOptions = options;

    this.makeAPIRequest({
      data: [{
        type: 'adRequest',
        placementId: this.options.placementId,
        deviceInformation: navigator.userAgent,
        userData: {
          apiVersion: '1.0',
          PlatformType: 'Web',
          userId: user && user.id,
          userName: user && user.name,
          sdkVersion: PACKAGE_VERSION,
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
    const options = this.lastAdRequestOptions;
    clearTimeout(this.nextAdRequestTimeout);
    this.nextAdRequestTimeout = setTimeout(() => this.requestAd(options), milliseconds);
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
      const retryDate = new Date(response.retryAfter);
      const milliseconds = +retryDate - new Date();
      if (milliseconds > 0) {
        this.requestAnotherAdAfter(milliseconds);
      }
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

    const potentialRewards = (response.rewards || []).map(reward => new Reward(reward));
    potentialRewards.incentiveText = incentiveTextForRewards(potentialRewards);
    const showAd = () => this.showAd(response, options);
    this.setState('AD_READY');
    if (typeof options.onAdAvailable === 'function') {
      options.onAdAvailable(showAd, potentialRewards);
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
        if (error) {
          console.log('Could not send dismissedAd event.', error, responses);
          return;
        }
        this.requestAnotherAdAfter(1000);
        if (responses instanceof Array) {
          responses.forEach(response => this.handleResponse(response));
        }
      },
    });
  }


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
