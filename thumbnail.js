/*
 * Lambda function example with Minio Bucket Event Notification,
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
var uuidV4 = require('uuid/v4');

var mc = new Minio.Client({
    endPoint: 'play.minio.io',
    port: 9000,
    secure: true,
    accessKey: 'Q3AM3UQ867SPQQA43P2F',
    secretKey: 'zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG'
});

var poller = mc.listenBucketNotification('harsha', 'img-', '.jpg',
                                         ['s3:ObjectCreated:*']);
const imageType = 'image/jpg';

poller.on('notification', record => {
    var size = record.s3.object.size;
    var bname = record.s3.bucket.name;
    var oname = record.s3.object.key;
    mc.getObject(bname, oname,
                 function(err, dataStream) {
                     if (err) {
                         return console.log(err);
                     }
                     mc.putObject(bname,
                                  uuidV4()+"-thumbnail.jpg",
                                  dataStream,
                                  size,
                                  imageType, function(err, etag) {
                                      if (err) {
                                          return console.log(err);
                                      }
                                      console.log(etag);
                                  });
                 });
    poller.stop();
})
