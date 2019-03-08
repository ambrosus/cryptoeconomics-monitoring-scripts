import {IBlockRange, IEvent} from './type_utils';
import Web3 from 'web3';

const {utils} = new Web3();

const sortChronologically = <T extends IEvent> (events: T[]): T[] => {
  return events.sort((left, right) => {
    if  (left.blockNumber !== right.blockNumber) {
      return left.blockNumber - right.blockNumber;
    }
    return left.logIndex - right.logIndex;
  });
};

const defineBlockRange = async (blockchainStateWrapper: any, numberOfBlocksToSync: number): Promise<IBlockRange> => {
  const toBlock: number = await blockchainStateWrapper.getCurrentBlockNumber();
  const fromBlock: number = toBlock - numberOfBlocksToSync;
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
};

export {sortChronologically, defineBlockRange, convertRoleCodeToRoleName, convertWeiToAmber};
