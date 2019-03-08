import Web3 from 'web3';
import {
  HeadWrapper,
  ShelteringWrapper,
  BlockchainStateWrapper,
  RolesWrapper,
  BundleStoreWrapper,
  RolesEventEmitterWrapper
} from 'ambrosus-node-contracts';

const setupWeb3 = (rpc: string): Web3 => {
  return new Web3(rpc);
};

const setupContracts = (web3: Web3, headContractAddress: string): any => {
  const headWrapper = new HeadWrapper(headContractAddress, web3);
  const blockchainStateWrapper = new BlockchainStateWrapper(web3);

  const shelteringWrapper = new ShelteringWrapper(headWrapper, web3);
  const rolesWrapper = new RolesWrapper(headWrapper, web3);
  const bundleStoreWrapper = new BundleStoreWrapper(headWrapper, web3);
  const rolesEventEmitterWrapper = new RolesEventEmitterWrapper(headWrapper, web3);

  return {bundleStoreWrapper, shelteringWrapper, blockchainStateWrapper, rolesWrapper, rolesEventEmitterWrapper};
};

const chainUrl = (env?: string): string => (env && env !== 'main') ? `https://network.ambrosus-${env}.com` : 'https://network.ambrosus.com';

export {setupWeb3, setupContracts, chainUrl};