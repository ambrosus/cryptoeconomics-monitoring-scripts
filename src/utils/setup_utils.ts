import Web3 from 'web3';
import {
  HeadWrapper,
  ShelteringWrapper,
  BlockchainStateWrapper,
  RolesWrapper,
  BundleStoreWrapper
} from 'ambrosus-node-contracts';
import {
  BlockRange
} from './type_utils';

declare var process : {
  env: {
    NUMBER_OF_BLOCKS_TO_SYNC: number
  }
}

const setupWeb3 = (rpc: string): Web3 => {
  return new Web3(rpc);
};

const setupContracts = (web3: Web3): any => { 
  const headContractAddress: string = '0x0000000000000000000000000000000000000F10';
  const headWrapper = new HeadWrapper(headContractAddress, web3);
  const blockchainStateWrapper = new BlockchainStateWrapper(web3);

  const shelteringWrapper = new ShelteringWrapper(headWrapper, web3);
  const rolesWrapper = new RolesWrapper(headWrapper, web3);
  const bundleStoreWrapper = new BundleStoreWrapper(headWrapper, web3);

  return {bundleStoreWrapper, shelteringWrapper, blockchainStateWrapper, rolesWrapper};
};

const defineBlockRange = async (blockchainStateWrapper: any): Promise<BlockRange> => {
  const toBlock: number = await blockchainStateWrapper.getCurrentBlockNumber();
  const fromBlock: number = toBlock - process.env.NUMBER_OF_BLOCKS_TO_SYNC;
  return {fromBlock, toBlock};
};

export {setupWeb3, setupContracts, defineBlockRange};