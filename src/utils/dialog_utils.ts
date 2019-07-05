import chalk from 'chalk';
import commandLineUsage from 'command-line-usage';
import commandLineArgs, {CommandLineOptions} from 'command-line-args';
import {Bar, Presets} from 'cli-progress';

const printInfo = (text: string): void => {
  console.log(chalk.yellow(text));
};

const printSuccess = (text: string): void => {
  console.log(chalk.green(text));
};

const optionDefinitions = [
  {name: 'blockcount', alias: 'n', type: Number, description: 'How many recent blocks we want to scan'},
  {name: 'roundcount', alias: 'r', type: Number, description: 'How many recent consensus rounds we want to scan'},
  {
    name: 'env',
    alias: 'e',
    type: String,
    typeLabel: '{underline main|dev|test}',
    description: 'Select between environments'
  },
  {name: 'out', alias: 'o', type: String, description: 'Output file path'},
  {name: 'rpc', type: String, description: 'Custom RPC'},
  {
    name: 'headcontract',
    type: String,
    description: 'Head contract address',
    defaultValue: '0x0000000000000000000000000000000000000F10'
  }
];

const printHelp = (header: { header: string, content?: string }, additionalOptions = []): void => {
  console.log(commandLineUsage([header, {
    header: 'Options',
    optionList: [...optionDefinitions, ...additionalOptions]
  }]));
};

const parseArgs = (additionalOptions = []): CommandLineOptions => commandLineArgs([
  ...optionDefinitions, ...additionalOptions
]);

const setupBar = (actionsCount: number): Bar => {
  const bar: Bar = new Bar({stopOnComplete: true}, Presets.shades_classic);
  bar.start(actionsCount, 0);
  return bar;
};

export {printInfo, printSuccess, setupBar, printHelp, parseArgs};
