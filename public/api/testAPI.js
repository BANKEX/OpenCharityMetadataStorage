let attachBlobs;
const fileChange = (e) => {attachBlobs = e.target.files};
fileUL.addEventListener('change', fileChange, false);

const sendBlobsToServer = (blobs) => {
  return new Promise((resolve, reject) => {
    let counter=0;
    const hashes = [];
    for (let i=0, len=blobs.length; i<len; i++) {
      const blob = blobs[i];
      const reader = new FileReader();
      const xhr = new XMLHttpRequest();
      xhr.open('post', '/api/meta/postData');
      xhr.setRequestHeader('X-Content-Type-Options', 'nosniff');
      reader.readAsArrayBuffer(blob);
      reader.onload = function (event) {
        xhr.send(event.target.result);
        xhr.onload = (event) => {
          if (event.target.status==200) {
            hashes[i] = event.target.responseText;
            counter++;
            if (counter==len) resolve(hashes);
          } else {reject(event.target.responseText)}
        };
      }
    }
  });
};

const upload = async () => {
  try {
    respUL.innerHTML = '';
    if (attachBlobs) {
      const attachHashes = await sendBlobsToServer(attachBlobs);
      const attachments = attachHashes.map((hash, index) => {
        return {
          hash: hash,
          name: attachBlobs[index].name,
          type: attachBlobs[index].type,
          size: attachBlobs[index].size
        }
      });
      const data = {
        eventName: titleUL.value,
        eventDetails: descriptionUL.value,
        images: attachments
      };
      console.log(data);
      respUL.innerHTML = await sendBlobsToServer([new Blob([JSON.stringify(data)])]);
    } else {
      if (confirm('Upload without attachment?')) {
        const data = {
          title: titleUL.value,
          description: descriptionUL.value,
        };
        console.log(data);
        respUL.innerHTML = await sendBlobsToServer([new Blob([JSON.stringify(data)])]);
      }
    }
  } catch(err) {
    alert(err);
  }
};

const download = () => {
  respDL.innerHTML = '';
  DLattach.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('get', '/api/meta/getData/'+hashDL.value);
  xhr.send();
  xhr.onload = (event) => {
    console.log(event.target);
    if (event.target.status == 200) {
      try {
        const simple = JSON.parse(event.target.responseText);
        respDL.innerHTML = event.target.responseText;
        if (simple.images) {
          DLattach.innerHTML = simple.images.map((attach) => ('<a href="/api/meta/getData/' + attach.hash + '" download="' + attach.name + '">'+attach.name+'</a>'));
        }
      } catch (e) {
        if (event.target.responseText.indexOf('----------------------------')==0) {
          respDL.innerHTML = event.target.responseText;
        } else {
          respDL.innerHTML = 'Binary data'; 
        }
      }
    } else {
      respDL.innerHTML = event.target.responseText;
    }
  };
};

const search = () => {
  respSI.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('post', '/api/meta/search/');
  xhr.setRequestHeader('Content-type', 'application/json');
  let searchReq;
  try {
    searchReq = JSON.parse(textSI.value.toLowerCase())
  } catch(e) {
    searchReq = false;
  }
  body = (searchReq) ? searchReq : {text: textSI.value.toLowerCase()};
  xhr.send(JSON.stringify(body));
  xhr.onload = (event) => {
    respSI.innerHTML = event.target.responseText;
  };
};

const reindex = () => {
  respRE.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('post', '/api/meta/reindex/');
  xhr.setRequestHeader('Content-type', 'application/json');
  xhr.send(JSON.stringify({ password: passRE.value}));
  xhr.onload = (event) => {
    respRE.innerHTML = event.target.responseText;
  };
};

const drop = () => {
  respDrop.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('post', '/api/meta/drop/');
  xhr.setRequestHeader('Content-type', 'application/json');
  xhr.send(JSON.stringify({ password: passDrop.value}));
  xhr.onload = (event) => {
    respDrop.innerHTML = event.target.responseText;
  };
};