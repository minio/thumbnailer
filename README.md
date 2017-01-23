# Thumbnailer

A thumbnail generator example using Minio's [listenBucketNotification API](http://docs.minio.io/docs/javascript-client-api-reference#listenBucketNotification). This is a simple example of how one can build a AWS Lambda like functionality on a laptop.

## Dependencies

Dependencies are managed by [yarn](https://yarnpkg.com/en/docs/install)

Just run `yarn` it would install all the necessary dependencies.
```sh
yarn
```

If you fancy `npm install` - that still works too.
```sh
npm install
```

## Configure

Please edit `config/default.json` with your local parameters, currently the example points to https://play.minio.io:9000

<blockquote>This example works only with Minio server using an extended API</blockquote>

## Run

Once configured proceed to run.

```sh
node thumbnail.js
Listening for events on "images"
```

Now upload an image using `mc`

```sh
mc cp ./toposort/graph.jpg play/images/
./toposort/graph.jpg:  34.29 KB / 34.29 KB ┃▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓┃ 100.00% 386.91 KB/s 0s
```

You will see thumbnail being generated after uploading the image using `mc`.

```sh
node thumbnail.js
Listening for events on "images"
Uploading new thumbail to "images-processed"
Successfully uploaded "174aac49-7a88-4cfb-943e-c364aee1ffbd-thumbnail.jpg" "ca78ee1cc48358b4dbd883a589523e54"
```

To validate if the thumbnail was created at destination bucket use `mc`.

```sh
mc ls play/images-processed
[2017-01-22 23:44:51 PST]   629B 174aac49-7a88-4cfb-943e-c364aee1ffbd-thumbnail.jpg
```