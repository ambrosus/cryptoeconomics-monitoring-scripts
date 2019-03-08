interface IBlockRange {
  fromBlock: number;
  toBlock: number;
}

interface IEvent {
  blockNumber: number;
  logIndex: number;
}

export {IBlockRange, IEvent};
