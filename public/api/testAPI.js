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
        type: imageBlob[0].type,
        size: imageBlob[0].size,
        storageHash: imageHash[0]
      }
    }

    if (attachBlobs) {
      const attachHashes = await sendBlobsToServer(attachBlobs);
      respObj.data.attachments = attachHashes.map((hash, index) => {
        return {
          name: attachBlobs[index].name,
          type: attachBlobs[index].type,
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
  DLimage.innerHTML = '';
  DLattach.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('get', '/api/meta/getData/'+hashDL.value);
  xhr.send();
  xhr.onload = (event) => {
    console.log(event.target);
    if (event.target.status == 200) {
      try {
        const json = JSON.parse(event.target.responseText);
        respDL.innerHTML = event.target.responseText;
        if (json.data.image) {
          DLimage.innerHTML = '<image width="10%" src="/api/meta/getData/' + json.data.image.storageHash + '" >';
        }
        if (json.data.attachments) {
          DLattach.innerHTML = json.data.attachments.map((attach) => ('<a href="/api/meta/getData/' + attach.storageHash + '" download="' + attach.name+ '">'+attach.name+'</a>'));
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
    console.log(searchRequest.query.AND);
  } catch(e) {
    const searchRequestValue = textSI.value;
    const typeRequest = selSI.value+'';
    searchRequest = {
      pageSize: sizeSI.value,
      offset: (pageSI.value-1)*sizeSI.value,
      query: {
        AND: {
          '*' : searchRequestValue.toLowerCase().split(' ').filter(elem => elem!=''),
          'type': (typeRequest=='') ? undefined : [typeRequest]
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

const deleteMeta = () => {
  if (confirm('Are you sure?')) {
    respDel.innerHTML = '';
    const xhr = new XMLHttpRequest();
    xhr.open('post', '/api/meta/delData/');
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.send(JSON.stringify({hash: hashDel.value}));
    xhr.onload = (event) => {
      respDel.innerHTML = event.target.responseText;
    };
  }
};

const updateMeta = () => {
  respUPD.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('post', '/api/meta/updateData/');
  xhr.setRequestHeader('Content-type', 'application/json');
  xhr.send(JSON.stringify({
    oldHash: oldUPD.value,
    newHash: newUPD.value
  }));
  xhr.onload = (event) => {
    respUPD.innerHTML = event.target.responseText;
  };
};

const revision = (type) => {
  respREV.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('get', '/api/meta/revision/'+type);
  xhr.send();
  xhr.onload = (event) => {
    respREV.innerHTML = event.target.responseText;
    console.log(JSON.parse(event.target.responseText));
  };
};

const recover = (type) => {
  respREC.innerHTML = '';
  const xhr = new XMLHttpRequest();
  xhr.open('post', '/api/meta/recover/');
  xhr.setRequestHeader('Content-type', 'application/json');
  xhr.send(JSON.stringify({ password: passREC.value, type: type }));
  xhr.onload = (event) => {
    respREC.innerHTML = event.target.responseText;
  };
};

getOrgs();