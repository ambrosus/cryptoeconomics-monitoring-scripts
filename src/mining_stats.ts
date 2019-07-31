import {setupWeb3, setupContracts, chainUrl} from './utils/setup_utils';
import {printInfo, setupBar, printHelp, parseArgs, presentResults} from './utils/dialog_utils';
import {sortChronologically, convertWeiToAmber} from './utils/event_utils';
import {constants} from 'ambrosus-node-contracts';

const additionalOptions = [{
  name: 'roundcount',
  alias: 'r',
  type: Number,
  description: 'How many recent consensus rounds we want to scan'
}];

const miningStats = async (): Promise<void> => {
  const options = parseArgs(additionalOptions);
  const web3 = await setupWeb3(options.rpc || chainUrl(options.env));
  if (!options.roundcount || options.roundcount < 0) {
    printHelp({
      header: 'Mining stats',
      content: `Gathers info about latest Apollos' activity.`
    });
    return;
  }

  const {validatorSetWrapper, blockchainStateWrapper, rolesEventEmitterWrapper} = await setupContracts(web3, options.headcontract);
  const currentBlockNumber = await blockchainStateWrapper.getCurrentBlockNumber();

  printInfo(`Fetching ${currentBlockNumber} blocks`);
  const nodeOnboardingEvents = await rolesEventEmitterWrapper.nodeOnboardings(0, currentBlockNumber);
  const nodeRetirementEvents = await rolesEventEmitterWrapper.nodeRetirements(0, currentBlockNumber);
  const gatheredEvents = [...nodeOnboardingEvents, ...nodeRetirementEvents];

  printInfo(`Sorting and filtering events...`);
  const sortedAndFilteredEvents = sortChronologically(gatheredEvents.filter((event) => event.returnValues.role === constants.APOLLO));

  const totalEventsNumber = sortedAndFilteredEvents.length;
  printInfo(`${totalEventsNumber} events successfully extracted`);

  printInfo(`Processing events...`);
  const eventsProgressBar = await setupBar(totalEventsNumber);

  const nodesState = {};

  for (let index = 0; index < totalEventsNumber; index++) {
    const nodeAddress = sortedAndFilteredEvents[index].returnValues.nodeAddress;
    switch (sortedAndFilteredEvents[index].event) {
      case 'NodeOnboarded':
        nodesState[nodeAddress] = {
          nodeAddress,
          blocksMined: 0,
          validator: false,
          onboarded: true,
          deposit: convertWeiToAmber(sortedAndFilteredEvents[index].returnValues.placedDeposit)
        };
        break;
      case 'NodeRetired':
        delete nodesState[nodeAddress];
        break;
    }
    eventsProgressBar.increment(1);
  }

  printInfo(`Checking current validator set...`);
  const validatorSet = await validatorSetWrapper.getValidators();

  const nodeStateCheckedWithValidatorSet = validatorSet.reduce((nodes, current) => {
    if (nodes[current] !== undefined) {
      nodes[current].validator = true;
    } else {
    nodes[current] = {
      nodeAddress: current,
      blocksMined: 0,
      onboarded: false,
      validator: true};
    }
    return nodes;
  }, nodesState);

  const blockCount = options.roundcount * Object.keys(nodeStateCheckedWithValidatorSet).length;

  printInfo(`Fetching blocks...`);
  const blocksProgressBar = await setupBar(blockCount);

  for (let index = 0; index < blockCount; index++) {
    const block = await web3.eth.getBlock(currentBlockNumber - index);
    if (nodeStateCheckedWithValidatorSet[block.miner] !== undefined) {
      nodeStateCheckedWithValidatorSet[block.miner].blocksMined++;
    }
    blocksProgressBar.increment(1);
  }

  const gatheredApollosData = Object.values(nodeStateCheckedWithValidatorSet);

  await presentResults(gatheredApollosData, options.out);
};

miningStats().catch(console.log);
