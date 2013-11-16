console.log(chrome.extension.getURL("/"));
$("#filesystem").attr('href', 'filesystem:'+chrome.extension.getURL("/persistent")); 
