let attachBlob;
const fileChange = (e) => {attachBlob = e.target.files[0]};
fileUL.addEventListener('change', fileChange, false);

const sendBlobToServer = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const xhr = new XMLHttpRequest();
    xhr.open('post', '/api/meta/postData');
    xhr.setRequestHeader('X-Content-Type-Options', 'nosniff');
    reader.readAsArrayBuffer(blob);
    reader.onload = function (event) {
      xhr.send(event.target.result);
      xhr.onload = function (event) {
        switch (event.target.status) {
          case 200:
            resolve(event.target.responseText);
            break;
          default:
            reject(event.target.responseText);
        }
      };
    }
  });
};

const upload = async () => {
  try {
    respUL.innerHTML = '';
    // if (!titleUL.value || !descriptionUL.value) throw new Error('Title & Description are required fields');
    if (attachBlob) {
      const attachHash = await sendBlobToServer(attachBlob);
      const data = {
        title: titleUL.value,
        description: descriptionUL.value,
        attachment: {
          hash: attachHash,
          name: attachBlob.name,
          type: attachBlob.type,
          size: attachBlob.size
        }
      };
      console.log(data);
      respUL.innerHTML = await sendBlobToServer(new Blob([JSON.stringify(data)]));
    } else {
      if (confirm('Upload without attachment?')) {
        const data = {
          title: titleUL.value,
          description: descriptionUL.value,
        };
        console.log(data);
        respUL.innerHTML = await sendBlobToServer(new Blob([JSON.stringify(data)]));
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
        if (simple.attachment) {
          DLattach.innerHTML = '<a href="/api/meta/getData/' + simple.attachment.hash + '" download="' + simple.attachment.name + '">attach</a>';
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


