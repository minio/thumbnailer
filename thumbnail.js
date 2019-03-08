/*
 * Thumbnail generator using Bucket Event Notification
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

var Minio = require('minio');
var sharp = require('sharp');
var uuidV4 = require('uuid/v4');
var config = require('config');

var mcConfig = config.get('config');

var mc = new Minio.Client(mcConfig)
var poller = mc.listenBucketNotification(mcConfig.bucket, mcConfig.prefix,
                                         mcConfig.suffix, mcConfig.events);
console.log("Listening for events on", "\""+mcConfig.bucket+"\"");

// Allocate resize transformer from sharp().
// resize to 40 pixels wide and 40 pixes in height,
var transformer = sharp().resize(40, 40)

// Sharp defaults to jpeg, to use other formats use
// sharp() documentation at http://sharp.dimens.io/en/stable/

const imageType = 'image/jpg';

// Wait on notification from the poller.
poller.on('notification', record => {
    var bname = record.s3.bucket.name;
    var oname = decodeURIComponent(record.s3.object.key);
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
                                                  "with md5sum \""+etag+"\"");
                                  });
                 });
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
    poller.stop();
    process.exit();
});
