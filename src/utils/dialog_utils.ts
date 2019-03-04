import chalk from 'chalk';
import {Bar, Presets} from 'cli-progress';

const printInfo = (text: string): void => {
  console.log(chalk.yellow(text));
};

const printSuccess = (text: string): void => {
  console.log(chalk.green(text));
};

const setupBar = (actionsCount: number): Bar => {
  const bar: Bar =  new Bar({stopOnComplete: true}, Presets.shades_classic);
  bar.start(actionsCount, 0);
  return bar;
};

export {printInfo, printSuccess, setupBar};
