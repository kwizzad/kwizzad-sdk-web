# Kwizzad Web SDK

This repository is for the Kwizzad web SDK, which helps you embed Kwizzad campaigns into your
website.


## For publishers: How to embed the SDK into your website

- Get an API key and placement ID(s) from your account manager. Your account manager can also
  provide a test placement ID that always returns an ad for testing purposes.
- If you simply want to try around with the SDK, run `npm install; npm start` from the command line
  and open `http://localhost:8080/` in a web browser, which opens an example publisher web app
  that integrates Kwizzad.
- In your app, include the Kwizzad SDK Javascript in your app like in `index.html`: Append
  `<script src="kwizzad.js" async defer></script>` to the end of your HTML `<body>` tag, and have a
  look at the `<script>` for an example how to make an ad request with Kwizzad. For details, see
  below.
- Ensure you load the web page over HTTP and not directly from the file system. When serving the
  page via a file:// URL, restrictions apply. On Mac, you can run a HTTP server from the root
  directory for testing with `python -m SimpleHTTPServer 8000`, then open
  [http://localhost:8000/public/](http://localhost:8000/public/).

### Requesting and presenting ads

We recommend you request an ad from Kwizzad right when your page has finished loading.

When an ad is available, you get a callback from the SDK with a method to actually show the ad,
and with potential rewards that your users can get by playing the ad.

You can incentivize your users to open the ad with this potential reward information (for example
with a button: 'Click here to earn up to 10,000 coins!'). The SDK provides you a button caption you
can use.

If you want to customize the look & feel of the UI element that opens an ad (for example using
graphics or even animation), the SDK also provides your app with all necessary information (reward
amount, maximal amount, currency and reward type -- users can get rewards for different steps of
the experience).

On dismissal, you get an information about if/how the user got pending transactions for rewards.
You can then display this information to your user--either summarized or with a dialog for each
single pending reward. As soon as your app confirms a transaction, its reward will be paid out.

Transactions work like an inbox, so you might transactions again (asynchronously) until you confirm
them.


### Example implementation

Have a look at [`index.html`](./public/index.html), which demonstrates how to integrate Kwizzad ads
into your website.

For implementing, you need a UI element in the DOM that the user can click/tap to open an ad.
Kwizzad lets you customize when an ad is actually opened. The handling works like this:

```javascript
// Kwizzad calls this function as soon as the library is loaded.
window.onKwizzadLoaded = function(Kwizzad) {
  var lastShowAdFunction = null;
  var button = document.getElementById('kwizzad-button');

  // Request and preload an ad. If you want your page to become responsive faster, you can
  // choose to call `render`/`requestAd` later, when your page's main content has finished loading.
  var kwizzad = new Kwizzad({
    apiKey: 'b81e71a86cf1314d249791138d642e6c4bd08240f21dd31811dc873df5d7469d',
    placementId: 'web_sdk_test',
  }).render().requestAd({
    // By supplying user data, your users can get better targeted ads. Each attribute is optional.
    user: {
      id: '1337',              // unique ID that identifies the user inside your app
      gender: 'female',        // 'male', 'female' or null
      name: 'Stefanie Müller', // user realname inside your app, if existing
      facebookUserId: '123'    // if your users log in over Facebook
    },

    onAdLoading: function() {
      button.innerHTML = "Loading ad…";
      button.disabled = true;
    },

    // Kwizzad SDK calls this back when there is an ad for your request.
    onAdAvailable: function(showAd, potentialRewards) {
      // potentialRewards is an array of reward objects that the user can earn.
      button.innerHTML = potentialRewards.incentiveText;
      button.disabled = false;
      if (lastShowAdFunction) {
        button.removeEventListener('click', lastShowAdFunction);
      }
      lastShowAdFunction = showAd;
      button.addEventListener('click', lastShowAdFunction);
    },

    // Called back when the user played the campaign or dismissed the ad.
    onAdDismissed: function() {
      button.innerHTML = 'Waiting for next quiz...';
      button.disabled = true;
    },

    // Called back with reward information that the user has to confirm.
    onOpenTransactions: function(openTransactions) {
      // Here you should show a rewarding UI that displays all pending transactions.

      // Each transaction in `openTransactions` contains one or more reward objects.
      // The server will send the same transactions again until your code confirms them by
      // calling their `confirm` method, like an inbox.

      // It's a good idea to show a summary of all pending rewards so the user can confirm
      // all at once, but it's up to you if you want to show a single notification for each
      // reward.

      if (confirm(openTransactions.summarizedRewardConfirmationText)) {
        openTransactions.confirmAll();
      }
    },

    // Called back if no ad is available for your request. Note that Kwizzad
    // automatically retries to fetch ads in the background and calls `onAdAvailable` then.
    // Here you can customize your UI element appearance for the case when there is no ad.
    onNoFill: function() {
      button.innerHTML = 'No quiz available.';
    },
  });
};
```


## For developers: contribution guidelines

* Please install an ESLint plugin in your editor to meet our code conventions.
* Push new code to the develop branch or make a pull request when it's stable.


### How do I get set up as a contributor?

  - Check out
  - Run `npm install; npm start`
  - Open `http://localhost:8080/`


### Directory structure

- `app` – Contains the main app's JS code.
  - `components` - shared React components
  - `lib` – for shared library code
  - `style` – Shared Stylus/CSS code. Please put styling code that is not shared in the same folder as the component that uses it.
- `deploy` – JSON configuration files for deployments
- `public` – Public hosted assets like images, favicons, fonts. Contains html files used in iframes.


### Automatic deployment

You don't have to do much for deployment: Push to one of the branches that is automatically
built by our Jenkins server. After a while, your build will be online.


### Manual deployment (…or how to set up builds on Jenkins)

* Create `deploy/develop.js` (look at `deploy/example.js` for an example what content to put in).
  For each environment, you must create a settings file in `deploy/`.
* Make a build with `npm run build`
* Upload to s3 with `node s3-upload.js -d develop` (`develop`).
* This also invalidates the AWS CloudFront cache. It can take 10 or more minutes until the cache is delivering all new files, so when testing, ensure you are actually looking at the newest version.
