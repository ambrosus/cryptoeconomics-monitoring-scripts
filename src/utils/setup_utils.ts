import Web3 from 'web3';
import {
  HeadWrapper,
  ValidatorSetWrapper,
  ShelteringWrapper,
  BlockchainStateWrapper,
  RolesWrapper,
  BundleStoreWrapper,
  RolesEventEmitterWrapper,
  ChallengesEventEmitterWrapper,
  AtlasStakeStoreWrapper,
  ValidatorProxyWrapper
} from 'ambrosus-node-contracts';

const setupWeb3 = (rpc: string): Web3 => {
  return new Web3(rpc);
};

const setupContracts = async (web3: Web3, headContractAddress: string): Promise<any> => {
  const headWrapper = new HeadWrapper(headContractAddress, web3);
  const validatorProxyWrapper = new ValidatorProxyWrapper(headWrapper, web3);
  const validatorSetContractAddress = await (await validatorProxyWrapper.contract()).methods.validatorSet().call();
  const validatorSetWrapper = new ValidatorSetWrapper(validatorSetContractAddress, web3);
  const blockchainStateWrapper = new BlockchainStateWrapper(web3);

  const shelteringWrapper = new ShelteringWrapper(headWrapper, web3);
  const rolesWrapper = new RolesWrapper(headWrapper, web3);
  const bundleStoreWrapper = new BundleStoreWrapper(headWrapper, web3);
  const rolesEventEmitterWrapper = new RolesEventEmitterWrapper(headWrapper, web3);
  const challengesEventEmitterWrapper = new ChallengesEventEmitterWrapper(headWrapper, web3);
  const atlasStakeStoreWrapper = new AtlasStakeStoreWrapper(headWrapper, web3);

  return {bundleStoreWrapper, shelteringWrapper, blockchainStateWrapper, rolesWrapper, rolesEventEmitterWrapper,
    challengesEventEmitterWrapper, atlasStakeStoreWrapper, validatorSetWrapper};
};

const chainUrl = (env?: string): string => (env && env !== 'main') ? `https://network.ambrosus-${env}.com` : 'https://network.ambrosus.com';

export {setupWeb3, setupContracts, chainUrl};
