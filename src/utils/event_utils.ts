import {BlockRange} from './type_utils';
import Web3 from 'web3';

const {utils} = new Web3();

declare var process: {
  env: {
    NUMBER_OF_BLOCKS_TO_SYNC: number
  }
};

const sortChronologically = (events) => {
  return events.sort((left, right) => {
    if  (left.blockNumber !== right.blockNumber) {
      return left.blockNumber - right.blockNumber;
    }
    return left.logIndex - right.logIndex;
  });
};

const defineBlockRange = async (blockchainStateWrapper: any): Promise<BlockRange> => {
  const toBlock: number = await blockchainStateWrapper.getCurrentBlockNumber();
  const fromBlock: number = toBlock - process.env.NUMBER_OF_BLOCKS_TO_SYNC;
  return {fromBlock, toBlock};
};

const convertRoleCodeToRoleName = (roleCode) => {
  switch (roleCode) {
    case '1':
      return 'ATLAS';
    case '2':
      return 'HERMES';
    case '3':
      return 'APOLLO';
    default:
      return 'NONE';
  }
};

const convertWeiToAmber = (amount) => {
  return utils.fromWei(amount, 'ether');
}

export {sortChronologically, defineBlockRange, convertRoleCodeToRoleName, convertWeiToAmber};
