/* globals PACKAGE_VERSION */
import requestJSON from 'app/lib/request';
import defaults from 'app/lib/defaults';
import getInstallId from './install-id';
import Reward, { incentiveTextForRewards } from './reward';


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


export default class Placement {
  constructor(options = {}) {
    if (!options) {
      throw new Error('Please supply valid placement options.');
    }

    this.options = options;
    this.options.baseUrl = this.options.baseUrl || defaults.baseUrl;

    if (typeof this.options.baseUrl !== 'string') {
      throw new Error('Please supply a valid base URL.');
    }

    if (typeof this.options.apiKey !== 'string') {
      throw new Error('Please supply a valid API key.');
    }

    this.state = 'INITIAL';
  }


  setState(newState) {
    if (!AllowedAdStates.includes(newState)) {
      throw new Error('Invalid placement state');
    }
    this.state = newState;
    if (typeof this.options.onStateChange === 'function') {
      this.options.onStateChange(this, newState);
    }
    console.log('Placement now in state', newState);
  }


  makeAPIRequest(options) {
    const installId = getInstallId();
    const url = `${this.options.baseUrl}${this.options.apiKey}/${installId}`;
    requestJSON(Object.assign({ url, method: 'POST' }, options));
  }


  requestAd(options) {
    this.setState('REQUESTING_AD');

    const handleResponse = this.handleResponse.bind(this);
    const { onError, user } = options;

    this.makeAPIRequest({
      data: [{
        type: 'adRequest',
        placementId: this.options.placementId,
        deviceInformation: navigator.userAgent,
        adId: this.adId,
        userData: {
          sdkVersion: PACKAGE_VERSION,
          PlatformType: 'Web',
          apiVersion: '1.0',
          gender: user && user.gender && user.gender.toUpperCase(),
          userId: user && user.id,
          userName: user && user.name,
        },
      }],
      callback: (error, responses) => {
        if (error) {
          this.setState('NOFILL');
          onError(error);
          return;
        }
        if (responses instanceof Array) {
          responses.forEach(response => handleResponse.call(this, response, options));
        } else {
          this.setState('NOFILL');
          onError(new Error('Unexpected ad response format'));
        }
      },
    });
  }


  isValidAdResponse(response) {
    return !['adType', 'expiry', 'url', 'placementId', 'adId'].find(propertyName =>
      !(typeof response[propertyName] === 'string')
    );
  }


  handleAdResponse(response, options) {
    this.lastAdResponse = response;
    if (!this.isValidAdResponse(response)) {
      console.log('Ad response has unknown/invalid format.');
      this.setState('NOFILL');
    }
    this.loadAd(response, options);
  }


  handleResponse(response, options) {
    switch (response.type) {
      case 'adResponse': this.handleAdResponse(response, options); break;
      case 'openTransactions': break;
      default: console.log('Unknown response type', response.type); break;
    }

    // [{
    //     "adType": "adFullscreen",
    //     "expiry": "2017-02-07T12:31:13Z",
    //     "url": "https://kadev.kwizzad.com/labs/trackingtoken/1LTExMDYxNDAwMw?disableAdStartedEvent=1",
    //     "reward": {
    //         "type": "callback",
    //         "amount": 30000000,
    //         "currency": "smiles"
    //     },
    //     "rewards": [{
    //       "amount": 70,
    //       "currency": "loot",
    //       "type": "callback"
    //     },
    //     {
    //       "amount": 10,
    //       "currency": "loot",
    //       "type": "call2ActionStarted"
    //     },
    //     {
    //       "amount": 10,
    //       "currency": "loot",
    //       "type": "goalReached"
    //     }],
    //     "closeButtonVisibility": "BEFORE_CALL2ACTION",
    //     "kometArchiveUrl": "https://labs.tvsmiles.tv/versions/2016-11-24-11.43.32.077-09786744812c405326f0ffe337247723c0bb2c30.tar.gz",
    //     "placementId": "tvsa",
    //     "type": "adResponse",
    //     "adId": "1LTExMDYxNDAwMw"
    // }];
  }


  loadAd(response, options) {
    this.setState('LOADING_AD');
    options.onAdResponse(response, options);

    const potentialRewards = response.rewards.map(reward => new Reward(reward));
    potentialRewards.incentiveText = incentiveTextForRewards(potentialRewards);
    const showAd = () => this.showAd(response, options);
    this.setState('AD_READY');
    options.onAdAvailable(showAd, potentialRewards);
  }


  showAd(response, options) {
    console.log('Showing ad', response, options);
    const expireDate = new Date(response.expiry);
    if (new Date() < expireDate) {
      console.log('Showing ad...');
      this.setState('SHOWING_AD');
      if (typeof options.onShow === 'function') {
        options.onShow();
      }
    } else {
      this.setState('DISMISSED');
      if (typeof options.onDismiss === 'function') {
        options.onDismiss();
      }
      console.log('Ad expired, dismissed.');
    }
  }


  // TODO: Implement this
  // isGoalReached(url) {
  //
  // }


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
