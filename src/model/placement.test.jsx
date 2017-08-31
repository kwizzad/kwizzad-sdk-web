// import expect from 'expect';
import should from 'should';
import Placement from './placement.jsx';
import Transaction from './transaction.jsx';
import Reward from './reward.jsx';
import omit from 'lodash/omit';

const mockedRewards = [
  { type: 'call2ActionStarted', amount: 3, maxAmount: 5, currency: 'spears' },
  // the next reward should be added to previous reward in incentive text because currency is the same
  { type: 'callback', amount: 3, maxAmount: 5, currency: 'spears' },
  { type: 'callback', amount: 10, maxAmount: 20, currency: 'flintstones' },
].map(r => new Reward(r));

const maximalReward = new Reward({ currency: 'spears', amount: 6, maxAmount: 10 });

const incentiveText = 'Earn up to 10 spears and up to 20 flintstones with a quiz';
const ad = {
  headline: 'War of Clans',
  teaser: 'Welcome to the ruthless world of Vikings!',
  brand: 'War of Clans',
};

const mockedAdResponse = {
  adType: 'adFullscreen',
  url: 'http://komet.example.com',
  closeButtonVisibility: 'BEFORE_CALL2ACTION',
  kometArchiveUrl: 'https://labs.tvsmiles.tv/versions/2016-11-24-11.43.32.077-abc.tar.gz',
  rewards: mockedRewards,
  placementId: 'tvsa',
  type: 'adResponse',
  adId: 'xyz',
  ad: ad,
  images: [
    {
      type: 'header',
      filename: 'abc.jpg',
      url: 'http://images.tvsapp.info/campaigns/abc.300x0-hdpi-normal.jpg',
      urlTemplate: 'http://images.tvsapp.info/campaigns/abc.{{width}}x{{height}}-hdpi-normal.jpg',
      width: 300,
      height: 300,
    }
  ],
};

const mockedOpenTransactions = [
  {
    adId: 'adId2',
    transactionId: '4712',
    conversionTimestamp: '2016-04-24T16:00:00Z',
    reward: {
      amount: 5,
      currency: 'spears',
      type: 'call2ActionStarted',
    },
  },
  {
    adId: 'adId1',
    transactionId: '4711',
    conversionTimestamp: '2016-04-24T16:00:00Z',
    reward: {
      amount: 20,
      currency: 'flintstones',
      type: 'callback',
    },
  },
];

const mockedOpenTransactionsResponse = {
  type: 'openTransactions',
  transactions: mockedOpenTransactions,
};

const requestOptions = {
  user: {
    id: '12345',
    gender: 'female',
    name: 'Stefanie Müller',
    facebookUserId: '777',
  },
  sdkVersion: '1.2.3',
};

describe('Placement', () => {
  let requests;

  const options = {
    baseUrl: 'https://api.example.com',
    apiKey: 'abc123',
    placementId: 'tvsa',
    installId: 'aabbccdd-aabb-ccdd-eeff-112233445566',
    requestFunction: (opts) => { // mock requests, saving their options.
      requests.push(opts);
    },
  };

  beforeEach(() => {
    requests = [];
  });

  it('can be initialized', () => {
    expect(new Placement(options).state).toBe('INITIAL');
  });

  describe('#setState', () => {
    it('does not allow to set a state not in the list of allowed states', () => {
      (() => new Placement(options).setState('FORBIDDEN_STATE')).should.throw();
    });
  });

  describe('#makeAPIRequest', () => {
    it('uses correct method and URL', () => {
      new Placement(options).makeAPIRequest({ a: 'b' });
      requests.should.eql([{
        a: 'b',
        url: 'https://api.example.com/abc123/aabbccdd-aabb-ccdd-eeff-112233445566',
        method: 'POST',
      }]);
    });
  });

  describe('#requestAd', () => {
    it('sends an ad request to the server', () => {
      new Placement(options).requestAd(requestOptions);
      requests.length.should.equal(1);
      requests[0].data.length.should.equal(1);
      const data = requests[0].data[0];
      data.type.should.equal('adRequest');
      data.placementId.should.equal('tvsa');
      data.deviceInformation.should.match(/AppleWebKit\/.*/);
      omit(data.userData, 'userAgent').should.eql({
        apiVersion: '1.0',
        PlatformType: 'Unknown',
        sdkType: 'Web',
        userId: '12345',
        facebookUserId: '777',
        userName: 'Stefanie Müller',
        sdkVersion: '1.2.3',
        gender: 'FEMALE',
      });
      data.userData.userAgent.should.match(/AppleWebKit\//);
      requests[0].callback.should.be.an.instanceOf(Function);
    });

    it('calls onError with correct parameters on errors', () => {
      [
        [[new Error('test')], 'test'],
        [[null, {}], 'Unexpected ad response format'],
      ].forEach(([args, expectedMessage]) => {
        let caughtError;
        const placement = new Placement(options);
        placement.requestAd(Object.assign({
          onError(error) { caughtError = error; },
        }, requestOptions));
        requests[requests.length - 1].callback.apply(undefined, args);
        caughtError.should.eql(new Error(expectedMessage));
        placement.state.should.equal('NOFILL');
      });
    });

    it('calls onNoFill if no ad is available', () => {
      const placement = new Placement(options);
      let called = false;
      placement.requestAd(Object.assign({
        onNoFill(p) { called = true; p.should.equal(placement); },
      }, requestOptions));
      requests[0].callback(undefined, [{
        type: 'adNoFill',
      }]);
      called.should.equal(true);
    });

    describe('handling a valid ad response with 2 rewards', () => {
      function receiveResponses(firstResponseExtensions = {}, extraResponses = []) {
        const firstResponse = Object.assign({}, firstResponseExtensions, mockedAdResponse);
        const responses = [firstResponse].concat(extraResponses);
        requests[0].callback(null, responses);
      }

      it('sets states correctly', () => {
        const placement = new Placement(options);
        placement.requestAd(Object.assign(requestOptions));
        placement.state.should.equal('REQUESTING_AD');
        receiveResponses();
        placement.state.should.equal('AD_READY');
      });

      it('hands over ad response via callback', () => {
        const placement = new Placement(options);
        let adResponse;
        placement.requestAd(Object.assign({ onAdResponse(r) { adResponse = r; } }, requestOptions));
        receiveResponses();
        adResponse.should.eql(mockedAdResponse);
      });

      it('calls onAdLoading callback', () => {
        const placement = new Placement(options);
        let called = false;
        placement.requestAd(Object.assign({
          onAdLoading: (p) => { called = true; p.should.equal(placement); },
        }, requestOptions));
        receiveResponses();
        called.should.equal(true);
      });

      it('calls onOpenTransactions callback when transactions are available', () => {
        const placement = new Placement(options);
        let called = false;
        placement.requestAd(
          Object.assign({ onOpenTransactions: () => { called = true; } }, requestOptions)
        );
        receiveResponses({}, [mockedOpenTransactionsResponse]);
        called.should.equal(true);
      });

      it('sends correct adId in adDismissed event to the server', () => {
        const placement = new Placement(options);
        placement.requestAd(requestOptions);
        receiveResponses();
        placement.requestAnotherAdAfter = () => {}; // avoid side effects
        placement.dismissAd();
        requests.length.should.equal(2);
        requests[1].data.should.eql([{ type: 'adDismissed', adId: 'xyz' }]);
      });

      it('expires the ad after given expiration date', () => {
        const placement = new Placement(options);
        placement.requestAd(requestOptions);
        let milliseconds;
        placement.requestAnotherAdAfter = (ms) => { milliseconds = ms; };
        const fiveMinutes = 5 * 60 * 1000;
        receiveResponses({ expiry: new Date(+new Date() + fiveMinutes).toISOString() });
        milliseconds.should.be.approximately(fiveMinutes, 5);
      });

      describe('onOpenTransactions callback', () => {
        let transactions;
        beforeEach(() => {
          const placement = new Placement(options);
          placement.requestAd(
            Object.assign({ onOpenTransactions: (t) => { transactions = t; } }, requestOptions)
          );
          receiveResponses({}, [mockedOpenTransactionsResponse]);
        });

        it('hands over a transactions array with 2 summary strings', () => {
          const expectedTransactions = mockedOpenTransactions
            .map(transaction => new Transaction(transaction));
          expectedTransactions.summarizedRewardsText = '5 spears and 20 flintstones';
          expectedTransactions.summarizedRewardConfirmationText =
            'Congratulations, you earned 5 spears and 20 flintstones!';
          delete transactions.confirmAll;
          transactions.should.eql(expectedTransactions);
        });

        it('allows the publisher app to confirm all transactions at once', () => {
          transactions.confirmAll.should.be.instanceOf(Function);
          requests.length.should.equal(1);
          transactions.confirmAll();
          requests.length.should.equal(2);
          requests[1].data.should.eql([
            {
              type: 'transactionConfirmed',
              adId: 'adId2',
              transactionId: '4712',
            },
            {
              type: 'transactionConfirmed',
              adId: 'adId1',
              transactionId: '4711',
            },
          ]);
        });

        it('allows the publisher app to confirm single transactions', () => {
          requests.length.should.equal(1);
          transactions.forEach(t => { t.confirm(); });
          requests.length.should.equal(3);
          requests.slice(1).map(r => r.data).should.eql([
            [{
              type: 'transactionConfirmed',
              adId: 'adId2',
              transactionId: '4712',
            }],
            [{
              type: 'transactionConfirmed',
              adId: 'adId1',
              transactionId: '4711',
            }],
          ]);
        });
      });

      describe('onAdAvailable callback', () => {
        it('is called', () => {
          const placement = new Placement(options);
          let called = false;
          const opts = Object.assign({ onAdAvailable: () => { called = true; } }, requestOptions);
          placement.requestAd(opts);
          receiveResponses();
          called.should.equal(true);
        });

        it('hands you over ad meta information', () => {
          const placement = new Placement(options);

          let receivedAdMetaInfo;

          const opts = Object.assign({
            onAdAvailable: (showAd, adMetaInfo) => { receivedAdMetaInfo = adMetaInfo; },
          }, requestOptions);

          placement.requestAd(opts);
          receiveResponses();

          const expectedRewards = [].concat(mockedRewards);
          receivedAdMetaInfo.potentialRewards.should.eql(expectedRewards);
          receivedAdMetaInfo.incentiveText.should.eql(incentiveText);
          receivedAdMetaInfo.maximalReward.should.eql(maximalReward);
          receivedAdMetaInfo.ad.should.eql(ad);
          receivedAdMetaInfo.squaredThumbnailUrl(100).should.eql('http://images.tvsapp.info/campaigns/abc.100x0-hdpi-normal.jpg');

          // - `adMetaInfo.potentialRewards`: an array of reward objects that the user can earn.
          // - `adMetaInfo.maximalReward`: a reward object representing the maximal reward
          //   the user can get from this campaign.
          // - `adMetaInfo.incentiveText`: A short text that motivates the user to play the
          //   campaign.
          // - `adMetaInfo.squaredThumbnailUrl(100)`: returns a squared thumbnail URL with an
          //   image that fits the campaign's topic/brand.
          // - `adMetaInfo.ad.headline`: A short headline that describes the campaign.

        });

        describe('showAd function parameter', () => {
          [
            [new Date(+new Date() + 10000).toISOString(), 'SHOWING_AD', true],
            ['1970-01-01Z', 'DISMISSED', false],
          ].forEach(([expiry, expectedState, expectedShown]) => {
            it(`leads into state ${expectedState} for expire date ${expiry} when called`, () => {
              const placement = new Placement(options);
              let showAdFunction;
              let shown = false;
              const opts = Object.assign({
                onAdAvailable(showAd) { showAdFunction = showAd; },
                onShow() { shown = true; },
              }, requestOptions);
              placement.requestAd(opts);
              receiveResponses({ expiry });
              placement.state.should.equal('AD_READY');
              showAdFunction();
              placement.state.should.equal(expectedState);
              shown.should.equal(expectedShown);
            });
          });
        });
      });
    });
  });

  describe('#dismissAd', () => {
    let placement;
    let milliseconds;

    beforeEach(() => {
      placement = new Placement(options);
      milliseconds = undefined;
      placement.requestAnotherAdAfter = (ms) => { milliseconds = ms; };
    });

    it('sets DISMISSED state', () => {
      placement.dismissAd();
      placement.state.should.equal('DISMISSED');
    });

    it('sends an adDismissed event to the server', () => {
      placement.adId = 'should be visible in response';
      placement.dismissAd();
      requests.length.should.equal(1);
      requests[0].data.should.eql([{ type: 'adDismissed', adId: placement.adId }]);
    });

    it('sets a timeout to request another ad if adDismissed event worked', () => {
      placement.dismissAd();
      requests[0].callback(undefined, []);
      milliseconds.should.equal(1000);
    });

    it('sets no timeout if adDismissed event did not work', () => {
      console.log('The following error is expected. Don\'t worry!');
      placement.dismissAd();
      requests[0].callback(new Error('some error'));
      should.equal(milliseconds, undefined);
    });

    it('calls onOpenTransactions callback when transactions are available', () => {
      let transactions;
      placement.requestAd(
        Object.assign({ onOpenTransactions: (t) => { transactions = t; } }, requestOptions)
      );
      requests.length.should.equal(1);
      placement.dismissAd();
      requests.length.should.equal(2);
      requests[1].callback(null, [mockedOpenTransactionsResponse]);
      transactions.length.should.equal(2);
    });
  });

  describe('#requestAnotherAdAfter', () => {
    it('fails when making a request while another one runs', (done) => {
      const placement = new Placement(options);
      placement.requestAd(requestOptions);
      requests.length.should.equal(1);
      placement.requestAnotherAdAfter(0);
      setTimeout(() => {
        requests.length.should.equal(1);
        done();
      }, 10);
    });

    it('requests an ad using the same ad request options as last time', (done) => {
      const timeoutTestRequests = [];
      const placement = new Placement(Object.assign({}, options, {
        placementId: 'test',
        requestFunction: (opts) => { // mock requests, saving their options.
          console.log(JSON.stringify(opts, 2, true));
          timeoutTestRequests.push(opts);
        },
      }));
      placement.requestAd(requestOptions);
      timeoutTestRequests.length.should.equal(1);
      // Faking a adNoFill answer will allow the placement to make a new request directly.
      timeoutTestRequests[0].callback(undefined, [{ type: 'adNoFill' }]);
      placement.requestAnotherAdAfter(0);
      setTimeout(() => {
        timeoutTestRequests.length.should.equal(2);
        timeoutTestRequests[1].should.eql(timeoutTestRequests[0]);
        done();
      }, 100);
    });
  });
});
