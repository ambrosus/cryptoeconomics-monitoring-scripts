import fs from 'fs';
const fsPromises = fs.promises;

const writeFile = async (path: string, contents: any): Promise<void> => {
  const data = JSON.stringify(contents, null, 2);
  await fsPromises.writeFile(path, data);
};

const makeDirectory = async (path: string): Promise<void> => {
  await fsPromises.mkdir(path);
};

const checkPath = async (path: string): Promise<void>  => {
  await fsPromises.lstat(path);
};

const ensureOutputDirectoryExists = async (outputDirectory: string): Promise<void> => {
  try {
    await checkPath(outputDirectory);
  } catch (error) {
    await makeDirectory(outputDirectory);
  }
};

const saveData = async (data: any, filemane: string): Promise<void>  => {
  await ensureOutputDirectoryExists(process.env.OUTPUT_DIRECTORY);
  await writeFile(`${process.env.OUTPUT_DIRECTORY}/${filemane}`, data);
};

export {saveData};
