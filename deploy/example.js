/*
    Create a file called develop.js with the same json here below.

    On Jenkins, it's a good idea to have this file somewhere on the
    build server and just symlink it in the build process configuration.

    Don't share the credentials with the outside world and
    May the force be with you
*/

module.exports = {
    aws: {
        // any other options are passed to new AWS.S3()
        // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property

        options: {
            accessKeyId: 'YOUR_ACCESS_KEY',
            secretAccessKey: 'YOUR_SECRET_ACCESS_KEY',
            region: 'eu-west-1',
        },
        s3: {
            bucket: 'YOUR_BUCKET_NAME',
        },
        cloudFront: {
            distributionId: 'YOUR_DISTRIBUTION_ID',
        },
    },
};
