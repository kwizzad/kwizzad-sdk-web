import expect from 'expect';
import Placement from './placement';
import Transaction from './transaction';
import Reward from './reward';

const mockedRewards = [
  { type: 'call2ActionStarted', amount: 3, maxAmount: 5, currency: 'spears' },
  { type: 'callback', amount: 10, maxAmount: 20, currency: 'flintstones' },
].map(r => new Reward(r));

const incentiveText = 'Earn up to 5 spears and up to 20 flintstones with a quiz!';

const mockedAdResponse = {
  adType: 'adFullscreen',
  url: 'http://komet.example.com',
  closeButtonVisibility: 'BEFORE_CALL2ACTION',
  kometArchiveUrl: 'https://labs.tvsmiles.tv/versions/2016-11-24-11.43.32.077-abc.tar.gz',
  rewards: mockedRewards,
  placementId: 'tvsa',
  type: 'adResponse',
  adId: 'xyz',
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


describe('Placement', () => {
  let requests;

  const options = {
    baseUrl: 'https://api.example.com',
    apiKey: 'abc123',
    placementId: 'tvsa',
    installId: 'aabbccdd-aabb-ccdd-eeff-112233445566',
    requestFunction: (requestOptions) => { // mock requests, saving their options.
      requests.push(requestOptions);
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
    const requestOptions = {
      user: {
        id: '12345',
        gender: 'female',
        name: 'Stefanie Müller',
        facebookUserId: '777',
      },
    };

    it('sends an ad request to the server', () => {
      new Placement(options).requestAd(requestOptions);
      requests.length.should.equal(1);
      requests[0].data.length.should.equal(1);
      const data = requests[0].data[0];
      data.type.should.equal('adRequest');
      data.placementId.should.equal('tvsa');
      data.deviceInformation.should.match(/Mozilla\/.*/);
      data.userData.should.eql({
        apiVersion: '1.0',
        PlatformType: 'Web',
        userId: '12345',
        facebookUserId: '777',
        userName: 'Stefanie Müller',
        sdkVersion: '0.7.1',
        gender: 'FEMALE',
      });
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

        it('hands you over potential rewards + incentive text', () => {
          const placement = new Placement(options);
          let rewards;
          const opts = Object.assign({
            onAdAvailable: (showAd, potentialRewards) => { rewards = potentialRewards; },
          }, requestOptions);
          placement.requestAd(opts);
          receiveResponses();
          const expectedRewards = [].concat(mockedRewards);
          expectedRewards.incentiveText = incentiveText;
          rewards.should.eql(expectedRewards);
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
    it('dismisses the ad');
    it('calls onOpenTransactions callback when transactions are available');
    it('sets a timeout to request another ad');
  });

  describe('#requestAnotherAdAfter', () => {
    it('requests an ad using the same ad request options as last time');
    it('removes existing timeouts');
  });

  describe('#confirmTransactions', () => {
    it('confirms all given transactions to the backend');
  });
});
