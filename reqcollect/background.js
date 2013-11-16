// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
/*
var req = new XMLHttpRequest();
req.open(
    "GET",
    "http://api.flickr.com/services/rest/?" +
        "method=flickr.photos.search&" +
        "api_key=90485e931f687a9b9c2a66bf58a3861a&" +
        "text=hello%20world&" +
        "safe_search=1&" +  // 1 is "safe"
        "content_type=1&" +  // 1 is "photos only"
        "sort=relevance&" +  // another good one is "interestingness-desc"
        "per_page=20",
    true);
req.onload = showPhotos;
req.send(null);

function showPhotos() {
  var photos = req.responseXML.getElementsByTagName("photo");

  for (var i = 0, photo; photo = photos[i]; i++) {
    var img = document.createElement("image");
    img.src = constructImageURL(photo);
    document.body.appendChild(img);
  }
}

// See: http://www.flickr.com/services/api/misc.urls.html
function constructImageURL(photo) {
  return "http://farm" + photo.getAttribute("farm") +
      ".static.flickr.com/" + photo.getAttribute("server") +
      "/" + photo.getAttribute("id") +
      "_" + photo.getAttribute("secret") +
      "_s.jpg";
}
*/

var openedFs = null;
var queue = [];

function flush()
{
    if(openedFs == null) {
        console.log("file system is not opened yet");
        return;
    }
    //console.log(queue.length);
    if(queue.length > 0)
    {
        var d = new Date();
        var dateString = (d.getMonth() + 1) + "-" + d.getDate();
        openedFs.root.getFile("v2.log." +dateString+".txt", {create: true}, function(fileEntry) {
    //    fileEntry.remove(function() { console.log('hi'); }, errorHandler);
    //    openedFs = null;
    //    return;

            fileEntry.createWriter(function(fileWriter) {
                if(fileWriter.length != 0) {
                    //console.log("len: " + fileWriter.length);
                    fileWriter.seek(fileWriter.length); // Start write position at EOF.
                }
                var blobArray = [];
                while(queue.length > 0)
                {
                    var details = queue.shift();
                    blobArray.push(JSON.stringify(details));
                }
                var blob = new Blob(blobArray, {type: 'text/plain'});
                fileWriter.write(blob);
            }, errorHandler);
        }, errorHandler);
    }
}

setInterval(flush, 5000);

function writeRequestToLog(details)
{
    //console.log(details);
    queue.push(details);
}
/*
chrome.webRequest.onCompleted.addListener(
  function(details) {
    writeRequestToLog(details);
  },
  {urls: ["<all_urls>"]}
  );*/

chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    if(details.tabId != -1) {
        chrome.tabs.get(details.tabId, 
        function (tab) { 
            details.taburl = tab.url;
            writeRequestToLog(details);
            //console.log(details); console.log(tab); 
            } )
    }
    else {
        writeRequestToLog(details);
    }
    //console.log(details);
  },
  {urls: ["<all_urls>"]},
  ["requestHeaders"]
  );



function onInitFs(fs) {
    console.log('file system opened');
    openedFs = fs;
}

function errorHandler(e) {
  var msg = '';

  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR';
      break;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      msg = 'Unknown Error';
      break;
  };

  console.log('Error: ' + msg);
}

window.webkitRequestFileSystem(window.PERSISTENT, 500*1024*1024 /*500MB*/, onInitFs, errorHandler);

/*chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    console.log(details);
    for (var i = 0; i < details.requestHeaders.length; ++i) {
      
      if (details.requestHeaders[i].name === 'User-Agent') {
        //details.requestHeaders.splice(i, 1);
        //break;
      }
    }
    return {requestHeaders: details.requestHeaders};
  },
  {urls: ["<all_urls>"]},
  ["blocking", "requestHeaders"]);*/
