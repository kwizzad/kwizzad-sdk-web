/* eslint-disable no-console */

const s3 = require('s3');
const AWS = require('aws-sdk');
const optimist = require('optimist')
.describe('d', 'Where to deploy, e.g. "develop" or "feature"')
.alias('d', 'destination')
.default('d', 'develop');
const fs = require('fs');

const settingsFileName = `./deploy/${optimist.argv.destination}.js`;
if (!fs.existsSync(settingsFileName)) {
  console.error(
    settingsFileName,
    'does not exist. Please create it (you can copy deploy/example.js) before building.'
    );
}

const settings = require(settingsFileName);

console.log('Deploying with settings from', settingsFileName, '…');

const client = s3.createClient({
  maxAsyncS3: 3,     // this is the default
  s3RetryCount: 3,    // this is the default
  s3RetryDelay: 1000, // this is the default
  multipartUploadThreshold: 20971520, // this is the default (20 MB)
  multipartUploadSize: 15728640, // this is the default (15 MB)
  s3Options: settings.aws.options,
});

function randomString(n) {
  const a = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from(Array(n), () => a.charAt(Math.floor(Math.random() * a.length))).join('');
}

function invalidateCloudFront() {
  const distributionId = settings.aws.cloudFront.distributionId;
  const reference = randomString(16);
  console.log('Invalidating CloudFront distribution', distributionId, ', reference:', reference);
  const params = {
    DistributionId: distributionId,
    InvalidationBatch: {
      CallerReference: reference,
      Paths: {
        Quantity: 1,
        Items: ['/*'],
      },
    },
  };

  (new AWS.CloudFront(settings.aws.options)).createInvalidation(params, (err, data) => {
    if (err) {
      console.log('Could not create invalidation:', err, err.stack);
    } else {
      console.log('Invalidation created:', data);
    }
  });
}

const params = {
  localDir: './public',
    // default false, whether to remove s3 objects that have no corresponding local file.
  deleteRemoved: true,
  s3Params: {
    Bucket: settings.aws.s3.bucket,
    Prefix: 'kwizzad-web-sdk',
    // other options supported by putObject, except Body and ContentLength.
    // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
  },
};

const uploader = client.uploadDir(params);
uploader.on('error', err => {
  console.error('unable to sync: ', err.stack);
});

uploader.on('progress', () => {
  console.log('progress', uploader.progressAmount, uploader.progressTotal);
});

uploader.on('end', () => {
  console.log('Done uploading.');
  invalidateCloudFront();
});
