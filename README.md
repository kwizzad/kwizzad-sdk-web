# Kwizzad Web SDK

This repository is for the Kwizzad web SDK, which helps you embed Kwizzad campaigns into your
website.


## For publishers: How to embed the SDK into your website

- Get an API key and placement ID(s) from your account manager. Your account manager can also
  provide a test placement ID that always returns an ad for testing purposes.
- Include the Kwizzad SDK Javascript in your app, either with `npm install --save kwizzad-sdk` or
  by including this snippet in your `<head>`:
  ```html
    <script src='//go.kwizzad.com/kwizzad-web-sdk.min.js' async defer></script>
  ```

### Requesting and presenting ads

We recommend you request an ad from Kwizzad right when your page has finished loading.

When an ad is available, you get a callback from the SDK with a method to actually show the ad,
and with potential rewards that your users can get by playing the ad. You can incentivize your
users to open the ad with this potential reward information (for example with a
button: 'Click here to earn 10,000 coins!').

On dismissal, you get an information about if/how the user got a reward. You can then present this
information to your user.

Here is an example implementation:

```javascript
// For NPM / ES6 modules: import Kwizzad from 'kwizzad-sdk';

window.kwizzadLoaded = function(Kwizzad) {
  // Request an ad when the page is loaded
  var kwizzad = new Kwizzad({ apiKey: 'YOUR_API_KEY' });
  kwizzad.requestAd({
    // By supplying user data, your users can get better targeted ads. Each attribute is optional.
    user: {
      id: '12345', // Unique ID that identifies the user inside your app
      gender: 'female', // 'male', 'female' or null
      name: 'Stefanie Müller', // user realname inside your app, if existing
      facebookUserId: '1234abc' // if your users log in over Facebook, you can use this ID.
    },

    placementId: 'YOUR_PLACEMENT_ID', // get this ID from your account manager

    // Kwizzad SDK calls this back when there is an ad for your request.
    onAdAvailable: function(showAd, potentialRewards) {
      // potentialRewards is an array of reward objects that the user can earn.
      // See below for the detailed structure.
      console.log('Potential rewards:', potentialRewards);
      showAd(); // displays the ad. You can choose when to call this.
    },

    // A function that Kwizzad can call back when the user played the campaign or dismissed the ad.
    onAdDismissed: function(pendingTransactions) {
      // You should show a UI that displays all pending transactions for the user.
      // Each transaction contains one or more rewards. The server will send the same
      // transactions again until your code confirms them by calling their `confirm` method,
      // like an inbox.
      pendingTransactions.forEach(function (transaction) {
        // Feel free to design a dialog that fits your UX and that feels rewarding!
        // Also available here:
        // - transaction.reward.amount
        // - transaction.reward.maxAmount
        // - transaction.reward.currency
        // - transaction.reward.humanDescription
        if (confirm(transaction.rewardConfirmationText())) {
          // Removes the transaction from the inbox and triggers payout
          transaction.confirm();
        }
      });
    },

    // If no ad is available for your request, you get this callback.
    onNoFill: function() {
      console.log('No ad available.');
    },
  });
});
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
