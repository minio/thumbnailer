/*
 * Function as Service example with Minio Bucket Webhook Notification
 * (C) 2017 Minio, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var express = require('express')
var app = express()
var bodyParser = require('body-parser');

var Minio = require('minio');
var sharp = require('sharp');
var config = require('config');

var mcConfig = config.get('config');
if (mcConfig.endPoint === '<endpoint>') {
    console.log('Please configure your endpoint in \"config/webhook.json\".');
    process.exit(1);
}

// Allocate a new minio-js client.
var mc = new Minio.Client(mcConfig)

// Generates a webhook config json.
var webhookConfig = function() {
    var config = {"webhook": {}}
    config.webhook["1"] = {}
    config.webhook["1"].enable = true
    config.webhook["1"].endpoint = "http://localhost:3000"
    return JSON.stringify(config, null, '\t')
}

// Allocate resize transformer from sharp().
// resize to 40 pixels wide and 40 pixes in height,
var transformer = sharp().resize(40, 40)

// Sharp defaults to jpeg, to use other formats use
// sharp() documentation at http://sharp.dimens.io/en/stable/
const imageType = 'image/jpg';

app.use(bodyParser.json()); // for parsing application/json

app.post('/', function (req, res) {
    var bname = req.body.Records[0].s3.bucket.name;
    var oname = req.body.Records[0].s3.object.key;
    mc.getObject(bname, oname,
                 function(err, dataStream) {
                     if (err) {
                         return console.log(err);
                     }
                     var thumbnailName = oname.split('.')[0]+"-thumbnail.jpg";
                     console.log("Uploading new thumbail to",
                                 "\""+mcConfig.destBucket+"\"");
                     mc.putObject(mcConfig.destBucket,
                                  thumbnailName,
                                  dataStream.pipe(transformer),
                                  imageType, function(err, etag) {
                                      if (err) {
                                          return console.log(err);
                                      }
                                      console.log("Successfully uploaded",
                                                  "\""+thumbnailName+"\"",
                                                  "\""+etag+"\"");
                                  });
                 });
    res.send("");
})


var server = app.listen(3000, function () {
    console.log('Webhook listening on all interfaces at port 3000!')
    console.log('Please update minio server config `~/.minio/config.json` to enable webhook notification target.')
    console.log(webhookConfig())
    console.log('Once you have edited `~/.minio/config.json` please restart your minio server.')
    console.log('')
    console.log('Now we proceed to use "mc" to enable receiving events over webhook.')
    console.log('')
    if ((mcConfig.destBucket) && (mcConfig.bucket)) {
        console.log('   $ mc mb myminio/'+mcConfig.bucket)
        console.log('   $ mc mb myminio/'+mcConfig.destBucket)
    }
    var msg = '   $ mc events add myminio/images arn:minio:sqs:us-east-1:1:webhook --events put'
    if (mcConfig.prefix) {
        msg += ' --prefix ' + mcConfig.prefix
    }
    if (mcConfig.suffix) {
        msg += ' --suffix ' + mcConfig.suffix
    }
    console.log(msg)
})

if (process.platform === "win32") {
    var rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on("SIGINT", function () {
        process.emit("SIGINT");
    });
}

process.on("SIGINT", function () {
    // graceful shutdown
    server.close(function () {
        console.log( "Closed out remaining connections.");
        // Close db connections, etc.
    });
    process.exit();
});
