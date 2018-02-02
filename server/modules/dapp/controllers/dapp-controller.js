import {DIRS, DAPP} from 'configuration';
import Web3 from 'web3';
import AppError from 'AppErrors';

const web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(DAPP.provider));
const organizations = ['0xf959e72cbfd729888adeee819563e1122545f46b'];
const abi = (type) => (require('../abi/'+type).abi);
const TOKEN = new web3.eth.Contract(abi('OpenCharityToken.json'), DAPP.token);
const ORG = new web3.eth.Contract(abi('Organization.json'), organizations[0]);

export default {
  async getOrganization(ctx) { //надо будет переделывать
    const name = await ORG.methods.name().call();
    const charityEventCount = await ORG.methods.charityEventCount().call();
    const incomingDonationCount = await ORG.methods.incomingDonationCount().call();
    ctx.body = { data: { name, charityEventCount, incomingDonationCount } };
  },

  async getCharityEvents(ctx) {
    const charityEventCount = await ORG.methods.charityEventCount().call();
    const charityEventList = [];
    for (let i = 0; i < charityEventCount; i++) {
      const address = await ORG.methods.charityEventIndex(i).call();
      const isActive = await ORG.methods.charityEvents(address).call();
      (isActive) ? charityEventList.push(address) : null;
    }
    const data = await Promise.all(charityEventList.map(async (address) => {
      const contract = new web3.eth.Contract(abi('CharityEvent.json'), address);
      const name = await contract.methods.name().call();
      const payed = await contract.methods.payed().call();
      const target = await contract.methods.target().call();
      const raised = await TOKEN.methods.balanceOf(address).call();
      return { name, payed, target, raised };
    }));
    ctx.body = { data };
  },

  async getIncomingDonations(ctx) {
    const incomingDonationCount = await ORG.methods.incomingDonationCount().call();
    const incomingDonationList = [];
    for (let i = 0; i < incomingDonationCount; i++) {
      const address = await ORG.methods.incomingDonationIndex(i).call();
      const isActive = await ORG.methods.incomingDonations(address).call();
      (isActive) ? incomingDonationList.push(address) : null;
    }
    const data = await Promise.all(incomingDonationList.map(async (address) => {
      const contract = new web3.eth.Contract(abi('IncomingDonation.json'), address);
      const realWorldIdentifier = await contract.methods.realWorldIdentifier().call();
      const note = await contract.methods.note().call();
      const amount = await TOKEN.methods.balanceOf(address).call();
      return { realWorldIdentifier, amount, note };
    }));
    ctx.body = { data };
  },
  async getCharityEvent(ctx) {
    const address = ctx.params.hash;
    const contract = new web3.eth.Contract(abi('CharityEvent.json'), address);
    const name = await contract.methods.name().call();
    const payed = await contract.methods.payed().call();
    const target = await contract.methods.target().call();
    const raised = await TOKEN.methods.balanceOf(address).call();
    ctx.body = { data: { name, payed, target, raised } };
  },
  async getIncomingDonation(ctx) {
    const address = ctx.params.hash;
    const contract = new web3.eth.Contract(abi('IncomingDonation.json'), address);
    const realWorldIdentifier = await contract.methods.realWorldIdentifier().call();
    const note = await contract.methods.note().call();
    const amount = await TOKEN.methods.balanceOf(address).call();
    ctx.body = { data: { realWorldIdentifier, amount, note } };
  },
};
