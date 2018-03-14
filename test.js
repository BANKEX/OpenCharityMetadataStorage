const getAttachHashes = (obj) => {
  let arr = [];
  Object.getOwnPropertyNames(obj).forEach((key) => {
    if (typeof obj[key] == 'object') arr = arr.concat(getAttachHashes(obj[key]));
    if (key == 'storageHash') {
      arr.push(obj[key]);
    }
  });
  return arr;
};


const obj1 = {
  a: 'sdfsdf',
  b: {
    c: {
      storageHash: 'qw1',
      sdfsf: 3234,
      sds: [
        {
          storageHash: 'qw2',
          name: {
            storageHash: 'qw21',
          }
        }, {
          storageHash: 'qw3'
        }, {
          ewewqe:'sdfsf'
        }
      ]
    },
    storageHash: {a:'qw4',b:3}
  },
  323: 423499,
  storageHash: 'qw5'
};

const obj2 = {
  a: 'sdfsdf',
  b: {
    c: {
      storageHash: {a:'qw4',b:3},
      sdfsf: 3234,
      sds: [
        {
          storageHash: 'qw3'
        }, {
          ewewqe:'sdfsf'
        }
      ]
    },
    storageHash: 'qw1'
  },
  323: 423499,
  storageHash: 'qw5'
};

const oldAttachments = getAttachHashes(obj1); console.log(oldAttachments);
const newAttachments = getAttachHashes(obj2); console.log(newAttachments);
const noUseAttachments = oldAttachments.filter((hash) => (newAttachments.indexOf(hash)==-1));
console.log(noUseAttachments);