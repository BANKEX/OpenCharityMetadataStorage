import { DAPP, INTERVALS, OC } from 'configuration';
import DappService from '../../services/dapp-service';
import { readyToIndex } from '../../modules/search/services/search-service';
import Web3 from 'web3';
import app from 'app';
import rp from 'request-promise';

rp.defaults({
  simple: false,
  resolveWithFullResponse: true,
  encoding: 'utf-8',
});

// BlockChain connection
const tryBlockChainConnect = async () => {
  if (app.state.dapp[0]==0) {
    process.stdout.write('BlockChain...');
    const intProcess = setInterval(() => process.stdout.write('.'), 200);
    const web3 = new Web3(new Web3.providers.WebsocketProvider(DAPP.ws));
    try {
      await web3.eth.getBlockNumber();
      clearInterval(intProcess);
      process.stdout.write('connected\n');
      app.state.web3 = web3;
      app.state.dapp[0] = 1;
      subscribeBlockChainConnectionError();
      await dappInit();
    } catch (err) {
      clearInterval(intProcess);
      app.state.dapp[0] = 0;
      setTimeout(tryBlockChainConnect, INTERVALS.dapp.reconnection);
    }
  }
};
const subscribeBlockChainConnectionError = () => {
  const intGetBlocks = setInterval(async () => {
    try {
      await app.state.web3.eth.getBlockNumber().then((r) => process.stdout.write(''));
    } catch (e) {
      console.log('blockChain getBlockNumber error');
    }
  }, INTERVALS.dapp.checkConnection);

  app.state.web3.eth.subscribe('logs', {}, async (error, log) => {
    if (error) {
      if (error.type == 'close') {
        console.log(new Date().toLocaleString() + ' - socket connection lost');
        clearInterval(intGetBlocks);
        app.state.web3 = false;
        app.state.dapp[0] = 0;
        tryBlockChainConnect();
      } else {
        console.log(new Date().toLocaleString());
        console.error(error);
      }
    } else {
      console.log('log - ' + new Date().toLocaleString());
      // console.log(log);
    }
  });
};

// OpenCharity Main Domain Connection
const getInitListFromOC = async () => {
  const type = 0;
  const options = {
    method: 'GET',
    uri: OC+'/api/settings/getOrganizationList/'+type,
  };
  return JSON.parse(await rp(options));
};
const loadInitList = async () => {
  clearTimeout(app.state.reloadingTimeout);
  process.stdout.write('SmartContracts...');
  const intProcess = setInterval(() => process.stdout.write('.'), 200);
  let initList;
  try {
    initList = await getInitListFromOC();
    clearInterval(intProcess);
    process.stdout.write('reloaded\n');
    app.state.initList = initList;
    app.state.dapp[1] = 1;
    app.state.reloadingTimeout = setTimeout(loadInitList, INTERVALS.dapp.refreshInitList);
    await dappInit();
  } catch (e) {
    clearInterval(intProcess);
    process.stdout.write('!!!-crashed-!!!\n');
    app.state.dapp[1] = (app.state.initList) ? 1 : 0;
    app.state.reloadingTimeout = setTimeout(loadInitList, INTERVALS.dapp.reconnection);
  }
};

// DAPP init
const dappInit = async () => {
  if (app.state.dapp.join('')=='11') {
    process.stdout.write('BlockChainInit');
    const intProcess = setInterval(() => process.stdout.write('.'), 200);
    try {
      await DappService.init();
      clearInterval(intProcess);
      await new Promise((resolve) => {
        let twice = false;
        const intProcess = setInterval(() => {
          process.stdout.write('.');
          if (readyToIndex) {
            if (twice) {
              clearInterval(intProcess);
              process.stdout.write('done\n');
              resolve();
            } else {
              twice = true;
            }
          } else {
            twice = false;
          }
        }, 500);
      });
    } catch (e) {
      clearInterval(intProcess);
      process.stdout.write('!!!-crashed-!!!\n');
      console.error(e);
    }
  }
};

export default async () => {
  await tryBlockChainConnect();
  await loadInitList();
};
