import { DIRS, DAPP, INTERVALS } from 'configuration';
import { Metamap } from '../modules/search';
import { addBatchToLine, addBatchToDelLine } from '../modules/search/services/search-service';
import { checkFile } from '../modules/meta/services/fileService';
import app from 'app';
import fs from 'fs';

function DappObject(type, objExt) {
  const extractTags = (mask) => {
    return mask;
  };
  
  const titleTypes = {
    '1': 'name',
    '2': 'realWorldIdentifier',
  };
  this.type = type;
  this.searchDescription = extractTags(objExt.tags);
  this.data = {
    title: objExt[titleTypes[type]],
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
  app.state.previous = app.state.actual;
  app.state.actual = [];
  app.state.previousORG = app.state.actualORG;
  app.state.actualORG = app.state.initList.list;
  const CharityEventObjectExt = async (event) => {
    const singleCharityEvent = async (CEaddress) => {
      const CEcontract = new app.state.web3.eth.Contract(app.state.initList.abis['CharityEvent'], CEaddress);
      const name = await CEcontract.methods.name().call();
      const payed = await CEcontract.methods.payed().call();
      const target = await CEcontract.methods.target().call();
      const tags = await CEcontract.methods.tags().call();
      const metaStorageHash = await CEcontract.methods.metaStorageHash().call();
      const raised = await app.state.token.methods.balanceOf(CEaddress).call();
      return { name, payed, target, raised, tags, metaStorageHash };
    };

    const _this = {};
    _this.address = event.returnValues.charityEvent;
    _this.ORGaddress = event.address;
    const { timestamp } = await app.state.web3.eth.getBlock(event.blockHash);
    _this.date = (new Date(timestamp * 1000)).toLocaleString();
    const charityEventObject = await singleCharityEvent(_this.address);
    Object.getOwnPropertyNames(charityEventObject).forEach((key) => {
      _this[key] = charityEventObject[key];
    });
    return _this;
  };
  const IncomingDonationObjectExt = async (event) => {
    const singleIncomingDonation = async (IDaddress) => {
      const IDcontract = new app.state.web3.eth.Contract(app.state.initList.abis['IncomingDonation'], IDaddress);
      const realWorldIdentifier = await IDcontract.methods.realWorldIdentifier().call();
      const note = await IDcontract.methods.note().call();
      const tags = await IDcontract.methods.tags().call();
      const amount = await app.state.token.methods.balanceOf(IDaddress).call();
      return { realWorldIdentifier, amount, note, tags };
    };

    const _this = {};
    _this.address = event.returnValues.incomingDonation;
    _this.ORGaddress = event.address;
    const { timestamp } = await app.state.web3.eth.getBlock(event.blockHash);
    _this.date = (new Date(timestamp * 1000)).toLocaleString();
    const incomingDonationObject = await singleIncomingDonation(_this.address);
    Object.getOwnPropertyNames(incomingDonationObject).forEach((key) => {
      _this[key] = incomingDonationObject[key];
    });
    return _this;
  };
  const getCharityEventAddressList = async (ORGaddress) => {
    const ORGcontract = new app.state.web3.eth.Contract(app.state.initList.abis['Organization'], ORGaddress);
    const added = await ORGcontract.getPastEvents('CharityEventAdded', {fromBlock: 0});

    await Promise.all(added.map(async (event) => {
      const charityEventObjectExt = await CharityEventObjectExt(event);
      // push to metamap
      if (charityEventObjectExt.metaStorageHash) {
        const metamap = await Metamap.findOne({address: charityEventObjectExt.address});
        if (metamap) {
          await Metamap.update({address: charityEventObjectExt.address}, new MetamapObject(charityEventObjectExt));
        } else {
          await Metamap.create(new MetamapObject(charityEventObjectExt));
        }

        const filePath = checkFile(charityEventObjectExt.metaStorageHash);
        if (filePath) {
          const parsedFile = JSON.parse(fs.readFileSync(filePath));
          parsedFile.id = charityEventObjectExt.metaStorageHash;
          addBatchToLine(parsedFile);
          process.stdout.write('+');
        } else {
          process.stdout.write('-');
        }
      }
      // push to search-index
      addBatchToLine(new DappObject('1', charityEventObjectExt));
      app.state.actual.push(charityEventObjectExt.address);
      return null;
    }));
  };
  const getIncomingDonationAddressList = async (ORGaddress) => {
    const ORGcontract = new app.state.web3.eth.Contract(app.state.initList.abis['Organization'], ORGaddress.toLowerCase());
    const added = await ORGcontract.getPastEvents('IncomingDonationAdded', {fromBlock: 0});

    await Promise.all(added.map(async (event) => {
      const incomingDonationObjectExt = await IncomingDonationObjectExt(event);
      // push to metamap
      if (incomingDonationObjectExt.metaStorageHash) {
        const metamap = await Metamap.findOne({address: incomingDonationObjectExt.address});
        if (metamap) {
          await Metamap.update({address: incomingDonationObjectExt.address}, new MetamapObject(incomingDonationObjectExt));
        } else {
          await Metamap.create(new MetamapObject(incomingDonationObjectExt));
        }
        const filePath = checkFile(incomingDonationObjectExt.metaStorageHash);
        if (filePath) {
          const parsedFile = JSON.parse(fs.readFileSync(filePath));
          parsedFile.id = incomingDonationObjectExt.metaStorageHash;
          addBatchToLine(parsedFile);
        } else {
          process.stdout.write('x');
        }
      }
      // push to search-index
      addBatchToLine(new DappObject('2', incomingDonationObjectExt));
      app.state.actual.push(incomingDonationObjectExt.address);
      return null;
    }));
  };
  const deleteInactiveAddresses = async () => {
    const inactiveAddresses = app.state.previous.filter((el) => (!app.state.actual.includes(el)));
    await Promise.all(inactiveAddresses.map(async (address) => {
      addBatchToDelLine(address);
      const metamap = await Metamap.findOne({ address });
      if (metamap) {
        process.stdout.write('+');
        addBatchToDelLine(metamap.hash);
      } else {
        process.stdout.write('-');
      }
      return null;
    }));
    await Metamap.deleteMany({ address: inactiveAddresses });
  };

  const subscribe = (_ORGAddressList) => {
    const charityEventAdded = async (event) => {
      console.log(new Date().toLocaleString());
      const charityEventObjectExt = await CharityEventObjectExt(event);
      if (charityEventObjectExt.metaStorageHash) {
        await Metamap.create(new MetamapObject(charityEventObjectExt));
      }
      app.state.previous.push(charityEventObjectExt.address);
      addBatchToLine(new DappObject('1', charityEventObjectExt));
      console.log(charityEventObjectExt);
    };
    const incomingDonationAdded = async (event) => {
      console.log(new Date().toLocaleString());
      const incomingDonationObjectExt = await IncomingDonationObjectExt(event);
      if (incomingDonationObjectExt.metaStorageHash) {
        await Metamap.create(new MetamapObject(incomingDonationObjectExt));
      }
      app.state.previous.push(incomingDonationObjectExt.address);
      addBatchToLine(new DappObject('2', incomingDonationObjectExt));
      console.log(incomingDonationObjectExt);
    };
    const metaStorageHashUpdated = async (event) => {
      console.log(new Date().toLocaleString());
      console.log('MetaUpdated');
      const ORGaddress = event.address;
      const { ownerAddress, metaStorageHash } = event.returnValues;
      console.log(event);
    };

    _ORGAddressList.forEach((ORGaddress) => {
      const ORGcontract = new app.state.web3.eth.Contract(app.state.initList.abis['Organization'], ORGaddress);
      ORGcontract.events.CharityEventAdded({ fromBlock: 'latest' }).on('data', charityEventAdded);
      ORGcontract.events.IncomingDonationAdded({ fromBlock: 'latest' }).on('data', incomingDonationAdded);
      ORGcontract.events.MetaStorageHashUpdated({ fromBlock: 'latest' }).on('data', metaStorageHashUpdated);
    });
  };
  
  app.state.token = new app.state.web3.eth.Contract(app.state.initList.abis['OpenCharityToken'], DAPP.token);
  
  await Promise.all(app.state.initList.list.map(async (ORGaddress) => {
    await getCharityEventAddressList(ORGaddress);
    await getIncomingDonationAddressList(ORGaddress);
    return null;
  }));

  await deleteInactiveAddresses();

  const newORG = app.state.actualORG.filter(el => (!app.state.previousORG.includes(el)));
  subscribe(newORG);
};

export default {
  init,
};
