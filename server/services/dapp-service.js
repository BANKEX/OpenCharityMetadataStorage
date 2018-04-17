import { DAPP, INTERVALS } from 'configuration';
import { Metamap } from '../modules/search';
import { addBatchToLine, addBatchToDelLine } from '../modules/search/services/search-service';
import { checkFile } from '../modules/meta/services/fileService';
import app from 'app';
import fs from 'fs';

const subscribtions = {};

function DappObject(type, objExt) {
  const extractTags = (mask) => {
    return mask;
  };
  
  const options = {
    '1': 'name',
    '2': 'realWorldIdentifier',
  };
  this.type = type;
  this.searchDescription = extractTags(objExt.tags);
  this.data = {
    title: objExt[options[type]],
    address: objExt.address,
    ORGaddress: objExt.ORGaddress,
  };
  this.id = objExt.address;
}

function MetamapObject(objExt) {
  this.address = objExt.address;
  this.hash = objExt.metaStorageHash;
}

const init = async () => {
  const getMinBlock = async () => {
    const creationBlocks = await Promise.all(app.state.initList.list.map(async (ORGaddress) => {
      const ORGcontract = new app.state.web3.eth.Contract(app.state.initList.abis['Organization'], ORGaddress);
      return Number(await ORGcontract.methods.creationBlockNumber().call());
    }));
    return app.state.web3.utils.toHex(Math.min.apply(null, creationBlocks));
  };
  const refreshCollections = async (ORGaddress, type) => {
    const options = {
      'CE': {
        addedEvent: 'CharityEventAdded',
        dappType: '1',
      },
      'ID': {
        addedEvent: 'IncomingDonationAdded',
        dappType: '2',
      },
    };

    const ORGcontract = new app.state.web3.eth.Contract(app.state.initList.abis['Organization'], ORGaddress);
    const added = await ORGcontract.getPastEvents(options[type].addedEvent, {fromBlock: app.state.minBlock});
    await Promise.all(added.map(async (event) => {
      const objBC = await getFullObject(null, event, type, null);

      if (objBC.metaStorageHash) {
        const metamap = await Metamap.findOne({address: objBC.address});
        if (metamap) {
          await Metamap.update({address: objBC.address}, new MetamapObject(objBC));
        } else {
          await Metamap.create(new MetamapObject(objBC));
        }

        const filePath = checkFile(objBC.metaStorageHash);
        if (filePath) {
          const parsedFile = JSON.parse(fs.readFileSync(filePath));
          parsedFile.id = objBC.metaStorageHash;
          addBatchToLine(parsedFile);
          process.stdout.write('+');
        } else {
          process.stdout.write('-');
        }
      }
      // push to search-index
      addBatchToLine(new DappObject(options[type].dappType, objBC));
      app.state.actual.push(objBC.address);

      return null;
    }));
  };
  const deleteInactiveAddresses = async () => {
    const inactiveAddresses = app.state.previous.filter((el) => (!app.state.actual.includes(el)));
    await Promise.all(inactiveAddresses.map(async (address) => {
      addBatchToDelLine(address);
      const metamap = await Metamap.findOne({ address });
      if (metamap) {
        const examplesHash = await Metamap.find({ hash: metamap.hash});
        const saveIt = examplesHash.find((el) => app.state.actual.includes(el.address)) || false;
        if (!saveIt) {
          process.stdout.write('X');
          addBatchToDelLine(metamap.hash);
        } else {
          process.stdout.write('S');
        }
      } else {
        process.stdout.write('x');
      }
      return null;
    }));
    await Metamap.deleteMany({ address: inactiveAddresses });
  };
  const subscribe = (_ORGAddressList) => {
    const charityEventAdded = async (event) => {
      console.log(new Date().toLocaleString() + ' - CE added/edited');
      const objBC = await getFullObject(null, event, 'CE', null);
      app.state.actual.push(objBC.address);
      addBatchToLine(new DappObject('1', objBC));
      // console.log(objBC);
      updateMeta(objBC.address, objBC.metaStorageHash);
    };
    const incomingDonationAdded = async (event) => {
      console.log(new Date().toLocaleString() + ' - ID added/edited');
      const objBC = await getFullObject(null, event, 'ID', null);
      app.state.actual.push(objBC.address);
      addBatchToLine(new DappObject('2', objBC));
      // console.log(objBC);
      if (objBC.metaStorageHash) updateMeta(objBC.address, objBC.metaStorageHash);
    };
    const updateMeta = async (ownerAddress, metaStorageHash) => {
      if (metaStorageHash) {
        const metamap = await Metamap.findOne({address: ownerAddress});
        if (metamap) {
          await Metamap.update({address: ownerAddress}, {hash: metaStorageHash});
        } else {
          await Metamap.create({address: ownerAddress, hash: metaStorageHash});
        }

        const filePath = checkFile(metaStorageHash);
        if (filePath) {
          const parsedFile = JSON.parse(fs.readFileSync(filePath));
          parsedFile.id = metaStorageHash;
          addBatchToLine(parsedFile);
        } else {
          console.log('Updated json not found');
        }
      }
    };
    const metaStorageHashUpdated = async (event) => {
      console.log(new Date().toLocaleString()+ ' MetaUpdated');
      const { ownerAddress, metaStorageHash } = event.returnValues;
      await updateMeta(ownerAddress, metaStorageHash);
    };

    _ORGAddressList.forEach((ORGaddress) => {
      subscribtions[ORGaddress] = [];
      const ORGcontract = new app.state.web3.eth.Contract(app.state.initList.abis['Organization'], ORGaddress);
      subscribtions[ORGaddress][0] = ORGcontract.events.CharityEventAdded({ fromBlock: 'latest' }).on('data', charityEventAdded);
      subscribtions[ORGaddress][1] = ORGcontract.events.IncomingDonationAdded({ fromBlock: 'latest' }).on('data', incomingDonationAdded);
      subscribtions[ORGaddress][2] = ORGcontract.events.MetaStorageHashUpdated({ fromBlock: 'latest' }).on('data', metaStorageHashUpdated);
      subscribtions[ORGaddress][3] = ORGcontract.events.CharityEventEdited({ fromBlock: 'latest' }).on('data', charityEventAdded);
      // ORGcontract.events.IncomingDonationEdited({ fromBlock: 'latest' }).on('data', incomingDonationAdded);
    });
  };
  const unsubscribe = (_ORGAddressList) => {
    _ORGAddressList.forEach((ORGaddress) => {
      subscribtions[ORGaddress].forEach((subs) => {
        subs.unsubscribe((err, res) => {
          process.stdout.write((res) ? 'U' : 'E');
        });
      });
    });
  };

  app.state.previous = app.state.actual;
  app.state.actual = [];
  app.state.previousORG = app.state.actualORG;
  app.state.actualORG = app.state.initList.list;
  app.state.token = new app.state.web3.eth.Contract(app.state.initList.abis['OpenCharityToken'], DAPP.token);
  app.state.minBlock = await getMinBlock();

  // Collections create/update
  await Promise.all(app.state.initList.list.map(async (ORGaddress) => {
    await refreshCollections(ORGaddress, 'CE');
    await refreshCollections(ORGaddress, 'ID');
    return null;
  }));

  // deleting not actual addresses
  await deleteInactiveAddresses();

  // subscribe for added orgs
  const newORG = app.state.actualORG.filter(el => (!app.state.previousORG.includes(el)));
  subscribe(newORG);
  // unsubscribe not actual Orgs
  const delORG = app.state.previousORG.filter(el => (!app.state.actualORG.includes(el)));
  unsubscribe(delORG);
};

// main object forming
const getDates = async (ORGaddress, address, type) => {
  const ORGcontract = new app.state.web3.eth.Contract(app.state.initList.abis['Organization'], ORGaddress);
  const options = {
    'CE': {
      addedEvent: 'CharityEventAdded',
      editedEvent: 'CharityEventEdited',
      filter: { charityEvent: address },
    },
    'ID': {
      addedEvent: 'IncomingDonationAdded',
      editedEvent: 'IncomingDonationEdited',
      filter: { incomingDonation: address },
    },
  };
  const added = await ORGcontract.getPastEvents(options[type].addedEvent, { fromBlock: app.state.minBlock, filter: options[type].filter });
  const blockAdd = await app.state.web3.eth.getBlock(added[0].blockHash);
  const cdate = blockAdd.timestamp*1000;
  let mdate = cdate;
  // до тех пор пока нет редактирования ID - потом убрать этот if
  if (type == 'CE') {
    const edited = await ORGcontract.getPastEvents(options[type].editedEvent, { fromBlock: app.state.minBlock, filter: options[type].filter });
    if (edited.length) {
      const blockEd = await app.state.web3.eth.getBlock(edited[edited.length - 1].blockHash);
      mdate = blockEd.timestamp*1000;
    }
  }
  return { cdate, mdate };
};
const getORGaddress = async (address, type) => {
  const options = {
    'CE': {
      addedEvent: 'CharityEventAdded',
      sha3: 'CharityEventAdded(address)',
    },
    'ID': {
      addedEvent: 'IncomingDonationAdded',
      sha3: 'IncomingDonationAdded(address,uint256,uint256)',
    },
  };
  const topic1 = app.state.web3.utils.sha3(options[type].sha3);
  const topic2 = app.state.web3.utils.padLeft(address, 64);
  const opts = {
    address: app.state.initList.list,
    topics: [topic1, topic2],
    fromBlock: app.state.minBlock,
  };
  const logs = await app.state.web3.eth.getPastLogs(opts);
  return logs[0].address;
};
const singleCharityEvent = async (CEaddress) => {
  const CEcontract = new app.state.web3.eth.Contract(app.state.initList.abis['CharityEvent'], CEaddress);
  const name = await CEcontract.methods.name().call();
  // const payed = await CEcontract.methods.payed().call();
  // const target = await CEcontract.methods.target().call();
  const tags = await CEcontract.methods.tags().call();
  const metaStorageHash = await CEcontract.methods.metaStorageHash().call();
  // const raised = await app.state.token.methods.balanceOf(CEaddress).call();
  return { name, tags, metaStorageHash };
};
const singleIncomingDonation = async (IDaddress) => {
  const IDcontract = new app.state.web3.eth.Contract(app.state.initList.abis['IncomingDonation'], IDaddress);
  const realWorldIdentifier = await IDcontract.methods.realWorldIdentifier().call();
  const note = await IDcontract.methods.note().call();
  const tags = await IDcontract.methods.tags().call();
  // const amount = await app.state.token.methods.balanceOf(IDaddress).call();
  return { realWorldIdentifier, note, tags };
};
const getFullObject = async (address, event, type, ORGaddress) => {
  const options = {
    'CE': {
      eventValue: 'charityEvent',
      singleFunc: singleCharityEvent,
    },
    'ID': {
      eventValue: 'incomingDonation',
      singleFunc: singleIncomingDonation,
    },
  };

  const _this = {};
  if (address && !event) {
    _this.address = address;
    _this.ORGaddress = ORGaddress || await getORGaddress(address, type);
    // const { cdate, mdate } = await getDates(_this.ORGaddress, _this.address, type);
    // _this.cdate = cdate;
    // _this.mdate = mdate;
    const singleObject = await options[type].singleFunc(_this.address);
    Object.getOwnPropertyNames(singleObject).forEach((key) => {
      _this[key] = singleObject[key];
    });
  }

  if (!address && event) {
    _this.address = event.returnValues[options[type].eventValue];
    _this.ORGaddress = event.address;
    // const { cdate, mdate } = await getDates(_this.ORGaddress, _this.address, type);
    // _this.cdate = cdate;
    // _this.mdate = mdate;
    const singleObject = await options[type].singleFunc(_this.address);
    Object.getOwnPropertyNames(singleObject).forEach((key) => {
      _this[key] = singleObject[key];
    });
  }

  return _this;
};
const getAddresses = async (ORGaddress, type) => {
  const options = {
    'CE': {
      countFunc: 'charityEventCount',
      indexFunc: 'charityEventIndex',
    },
    'ID': {
      countFunc: 'incomingDonationCount',
      indexFunc: 'incomingDonationIndex',
    },
  };
  const ORGcontract = new app.state.web3.eth.Contract(app.state.initList.abis['Organization'], ORGaddress);
  const count = await ORGcontract.methods[options[type].countFunc]().call();
  const res = [];
  for (let i=0; i<count; i++) {
    res[i] = await ORGcontract.methods[options[type].indexFunc](i).call();
  }
  return res;
};

export default {
  init,
};
