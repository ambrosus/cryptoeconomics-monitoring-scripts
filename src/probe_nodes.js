import {setupWeb3, setupContracts, saveData, defineBlockRange} from './utils/script_essentials';
import {printInfo, printSuccess, setupBar} from './utils/dialogs';

const probeNodes = async () => {

  throw Error('Not implemented yet.')

  const web3 = await setupWeb3(process.env.ENVIRONMENT);
  const {blockchainStateWrapper} = await setupContracts(web3);
  const {toBlock, fromBlock} = await defineBlockRange(blockchainStateWrapper);

  printInfo(`Fetching ${process.env.NUMBER_OF_BLOCKS_TO_SYNC} blocks (${fromBlock} -> ${toBlock})`);
  // Fetch all events and put in one array
  printInfo(`${rolesStateMutationEvents.length} events successfully extracted`);

  //Sort events

  printInfo(`Processing events...`);
  const progressBar = await setupBar(rolesStateMutationEvents.length);

  let gatheredNodesData = [];

  for(let index = 0; index < rolesStateMutationEvents.length; index++) {

    //Process all node events. Apply one by one and calculate current state

    gatheredNodesData.push(completeNodeData);
    progressBar.increment();
  }

  printInfo(`Saving output...`)
  await saveData(gatheredNodesData);
  
  printSuccess(`Done!`);
};

probeNodes();