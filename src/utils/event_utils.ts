import {IBlockRange, IEvent} from './type_utils';
import Web3 from 'web3';
import {constants} from 'ambrosus-node-contracts';

const {utils} = new Web3();

const sortChronologically = (events: IEvent[]): IEvent[] => {
  return events.sort((left, right) => {
    if  (left.blockNumber !== right.blockNumber) {
      return left.blockNumber - right.blockNumber;
    }
    return left.logIndex - right.logIndex;
  });
};

const defineBlockRange = async (blockchainStateWrapper: any, numberOfBlocksToSync: number): Promise<IBlockRange> => {
  const toBlock: number = await blockchainStateWrapper.getCurrentBlockNumber();
  const fromBlock: number = Math.max(0, toBlock - numberOfBlocksToSync);
  return {fromBlock, toBlock};
};

const convertRoleCodeToRoleName = (roleCode) => {
  if (roleCode === constants.ATLAS || roleCode === constants.HERMES || roleCode === constants.APOLLO) {
    return constants.ROLE_REVERSE_CODES[roleCode];
  }
  return constants.ROLE_REVERSE_CODES[constants.NONE];
};

const convertWeiToAmber = (amount) => {
  return utils.fromWei(amount, 'ether');
};

export {sortChronologically, defineBlockRange, convertRoleCodeToRoleName, convertWeiToAmber};
