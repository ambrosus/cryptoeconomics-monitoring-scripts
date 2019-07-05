import {setupWeb3, setupContracts, chainUrl} from './utils/setup_utils';
import {printInfo, setupBar, printHelp, parseArgs, printSuccess} from './utils/dialog_utils';
import {saveData} from './utils/file_utils';
import {sortChronologically, convertWeiToAmber} from './utils/event_utils';
import {constants} from 'ambrosus-node-contracts';


const miningStats = async (): Promise<void> => {
  const options = parseArgs();
  const web3 = await setupWeb3(options.rpc || chainUrl(options.env));
  if (!options.roundcount || options.roundcount < 0) {
    printHelp({
      header: 'Mining stats',
      content: `Gathers info about latest Apollos' activity.`
    });
    return;
  }

  const {blockchainStateWrapper, rolesEventEmitterWrapper} = await setupContracts(web3, options.headcontract);
  const currentBlockNumber = await blockchainStateWrapper.getCurrentBlockNumber();

  printInfo(`Fetching ${currentBlockNumber} blocks`);
  const nodeOnboardingEvents = await rolesEventEmitterWrapper.nodeOnboardings(0, currentBlockNumber);
  const nodeRetirementEvents = await rolesEventEmitterWrapper.nodeRetirements(0, currentBlockNumber);
  const gatheredEvents = [...nodeOnboardingEvents, ...nodeRetirementEvents];

  printInfo(`Sorting and filtering events...`);
  const sortedAndFilteredEvents = sortChronologically(gatheredEvents.filter(event => event.returnValues.role === constants.APOLLO));

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
          deposit: convertWeiToAmber(sortedAndFilteredEvents[index].returnValues.placedDeposit),
          blocksMined: 0
        };
        break;
      case 'NodeRetired':
        delete nodesState[nodeAddress];
        break;
    }
    eventsProgressBar.increment(1);
  }

  const blockCount = options.roundcount * Object.keys(nodesState).length;

  printInfo(`Fetching blocks...`);
  const blocksProgressBar = await setupBar(blockCount);

  for (let index = 0; index < blockCount; index++) {
    const block = await web3.eth.getBlock(currentBlockNumber - index);
    if(nodesState[block.miner] !== undefined) {
      nodesState[block.miner].blocksMined++
    }
    blocksProgressBar.increment(1);
  }

  const gatheredApollosData = Object.values(nodesState);

  if (options.out) {
    printInfo(`Saving output...`);
    await saveData(gatheredApollosData, options.out);
    printSuccess(`Done!`);
  } else {
    console.log(JSON.stringify(gatheredApollosData, null, 2));
  }
};

miningStats().catch(console.log);
