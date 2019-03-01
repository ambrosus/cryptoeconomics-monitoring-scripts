import fs from 'fs';
const fsPromises = fs.promises;

const writeFile = async (path, contents) => {
  const data = JSON.stringify(contents, null, 2);
  await fsPromises.writeFile(path, data);
}

const makeDirectory = async (path) => {
  await fsPromises.mkdir(path);
}

const getPath = async (path) => {
  await fsPromises.lstat(path);
}

const ensureOutputDirectoryExists = async (outputDirectory) => {
  try {
    await getPath(outputDirectory);
  } catch (error) {
    await makeDirectory(outputDirectory);
  }
};

const saveData = async (data, filemane) => {
  await ensureOutputDirectoryExists(process.env.OUTPUT_DIRECTORY);
  await writeFile(`${process.env.OUTPUT_DIRECTORY}/${filemane}`, data);
};

export {saveData};
