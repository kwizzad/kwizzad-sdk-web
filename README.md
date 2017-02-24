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
