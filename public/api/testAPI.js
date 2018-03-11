let imageBlob, attachBlobs;
const imageChange = (e) => {imageBlob = e.target.files};
imageUL.addEventListener('change', imageChange, false);
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
    const respObj = {
      type: typeUL.value,
      searchDescription: '',
      data: {}
    };

    if (descriptionUL.value) {
      respObj.data.description = descriptionUL.value;
    }

    if (imageBlob) {
      const imageHash = await sendBlobsToServer(imageBlob);
      respObj.data.image = {
        name: imageBlob[0].name,
        extension: imageBlob[0].type,
        size: imageBlob[0].size,
        storageHash: imageHash[0]
      }
    }

    if (attachBlobs) {
      const attachHashes = await sendBlobsToServer(attachBlobs);
      respObj.data.attachments = attachHashes.map((hash, index) => {
        return {
          name: attachBlobs[index].name,
          extension: attachBlobs[index].type,
          size: attachBlobs[index].size,
          storageHash: hash
        }
      });
    }

    console.log(respObj);
    respUL.innerHTML = await sendBlobsToServer([new Blob([JSON.stringify(respObj)])]);
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
  let searchRequest;
  try {
    searchRequest = JSON.parse(textSI.value);
    console.log(searchReq.query.AND);
  } catch(e) {
    const searchRequestValue = textSI.value;
    const typeRequest = selSI.value;
    searchRequest = {
      query: {
        AND: {
          '*' : searchRequestValue.toLowerCase().split(' ').filter(elem => elem!=''),
          'type': (typeRequest=='') ? undefined : [typeRequest.toLowerCase()]
        }
      }
    };
  }
  xhr.send(JSON.stringify(searchRequest));
  xhr.onload = (event) => {
    try {
      const resp = JSON.parse(event.target.responseText);
      console.log(`${resp.length} docs found`);
      if (resp.length>0) {
        respSI.innerHTML = resp.map((elem) => {
          return '<div>' + JSON.stringify(elem) + '</div>';
        });
      } else {
        respSI.innerHTML = 'Nothing ...';
      }
    } catch (e){
      respSI.innerHTML = event.target.responseText;
    }
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

const getOrgs = () => {
  listOrgs.value = '';
  const xhr = new XMLHttpRequest();
  xhr.open('get', '/api/settings/organizations/');
  xhr.send();
  xhr.onload = (event) => {
    listOrgs.value = event.target.responseText;
  };
};

const editListOrgs = () => {
  respOrgs.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('post', '/api/settings/organizations/');
  xhr.setRequestHeader('Content-type', 'application/json');
  xhr.send(JSON.stringify({
    password: passOrgs.value,
    orgs: listOrgs.value
  }));
  xhr.onload = (event) => {
    respOrgs.innerHTML = event.target.responseText;
  };
};

getOrgs();