import chalk from "chalk";
import cliProgress from 'cli-progress';

const printInfo = (text) => {
  console.log(chalk.yellow(text));
}

const printSuccess = (text) => {
  console.log(chalk.green(text));
}

const setupBar = (actionsCount) => {
  const bar =  new cliProgress.Bar({stopOnComplete: true}, cliProgress.Presets.shades_classic);
  bar.start(actionsCount, 0);
  return bar;
}

export {printInfo, printSuccess, setupBar};