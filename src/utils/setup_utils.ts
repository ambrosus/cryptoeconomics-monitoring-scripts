import Web3 from 'web3';
import {
  HeadWrapper,
  ShelteringWrapper,
  BlockchainStateWrapper,
  RolesWrapper,
  BundleStoreWrapper
} from 'ambrosus-node-contracts';

declare var process : {
  env: {
    NUMBER_OF_BLOCKS_TO_SYNC: number
  }
}

const setupWeb3 = async (rpc) => {
  return new Web3(rpc);
};

const setupContracts = async (web3) => { 
  const headContractAddress = '0x0000000000000000000000000000000000000F10';
  const headWrapper = new HeadWrapper(headContractAddress, web3);
  const blockchainStateWrapper = new BlockchainStateWrapper(web3);

  const shelteringWrapper = new ShelteringWrapper(headWrapper, web3);
  const rolesWrapper = new RolesWrapper(headWrapper, web3);
  const bundleStoreWrapper = new BundleStoreWrapper(headWrapper, web3);

  return {bundleStoreWrapper, shelteringWrapper, blockchainStateWrapper, rolesWrapper};
};

const defineBlockRange = async (blockchainStateWrapper) => {
  const toBlock = await blockchainStateWrapper.getCurrentBlockNumber();
  const fromBlock = toBlock - process.env.NUMBER_OF_BLOCKS_TO_SYNC;
  return {fromBlock, toBlock};
};

export {setupWeb3, setupContracts, defineBlockRange};