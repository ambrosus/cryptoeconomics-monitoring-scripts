import {setupWeb3, setupContracts, chainUrl} from './utils/setup_utils';
import {printInfo, setupBar, printSuccess, parseArgs, printHelp} from './utils/dialog_utils';
import {saveData} from './utils/file_utils';
import {sortChronologically, convertRoleCodeToRoleName, convertWeiToAmber} from './utils/event_utils';

const syncBundles = async (): Promise<void> => {
  const options = parseArgs();
  const web3 = await setupWeb3(options.rpc || chainUrl(options.env));

  const {blockchainStateWrapper, rolesEventEmitterWrapper} = await setupContracts(web3, options.headcontract);
  const currentBlockNumber = await blockchainStateWrapper.getCurrentBlockNumber();

  printInfo(`Fetching ${currentBlockNumber} blocks`);
  const nodeOnboardingEvents = await rolesEventEmitterWrapper.nodeOnboardings(0, currentBlockNumber);
  const nodeRetirementEvents = await rolesEventEmitterWrapper.nodeRetirements(0, currentBlockNumber);
  const nodeUrlChangeEvents = await rolesEventEmitterWrapper.nodeUrlChanges(0, currentBlockNumber);
  const gatheredEvents = [...nodeOnboardingEvents, ...nodeRetirementEvents, ...nodeUrlChangeEvents];
  const totalEventsNumber = gatheredEvents.length;
  printInfo(`${totalEventsNumber} events successfully extracted`);

  printInfo(`Sorting events...`);
  const sortedEvents = sortChronologically(gatheredEvents);

  printInfo(`Processing events...`);
  const progressBar = await setupBar(totalEventsNumber);

  let nodesState = {};

  for(let index = 0; index < totalEventsNumber; index++) {
    const nodeAddress = sortedEvents[index].returnValues.nodeAddress;
    switch(sortedEvents[index].event) {
      case 'NodeOnboarded':
        nodesState[nodeAddress] = {
          nodeAddress,
          role: convertRoleCodeToRoleName(sortedEvents[index].returnValues.role),
          deposit: convertWeiToAmber(sortedEvents[index].returnValues.placedDeposit),
          url: sortedEvents[index].returnValues.nodeUrl
        };
        break;
      case 'NodeUrlChanged':
        nodesState[nodeAddress].url = sortedEvents[index].returnValues.nodeUrl;
        break;
      case 'NodeRetired':
        delete nodesState[nodeAddress];
        break;
    }
    progressBar.increment(1);
  }

  const nodeStateArray = Object.values(nodesState);
  if (options.out) {
    printInfo(`Saving output...`);
    await saveData(nodeStateArray, options.out);
    printSuccess(`Done!`);
  } else {
    console.log(JSON.stringify(nodeStateArray, null, 2));
  }
};

syncBundles().catch(console.log);
