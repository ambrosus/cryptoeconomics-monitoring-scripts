# Cryptoeconomics Monitoring Scripts

This repository contains set of scripts allowing to browse current state of AMB-NET cryptoeconomy.

## Installation

To make use of this of repository, first you need to download it to your local machine.
You can do it either by downloading a `.zip` archive and unpacking it, or by using following command:

```
git clone https://github.com/ambrosus/cryptoeconomics-monitoring-scripts.git
```

After downloading, go into main project directory with:
```
cd cryptoeconomics-monitoring-scripts
```
and install all required dependencies by running following command:

```
yarn
```

## Running scripts

To run a script execute one of the following commands:

```
yarn sync_bundles
yarn sync_nodes
yarn challenge_stats
yarn mining_stats
```

To work properly, scripts need a set of parameters. You can either use one of predefined set of parameters or provide them manually.
Predefined parameters sets can be found in `package.json` file. Example of running one of the scripts with predefined set of parameters:
```
yarn test:sync_bundles
```
Example of running one of the scripts with manually provided set of parameters:
```
yarn sync_bundles -o custom_output_directory/bundles.json -e test -n 1000
```

## Script parameters

To view all available script parameters, run script with no parameters. It will not be executed, but instead it will print description of all available parameters.
