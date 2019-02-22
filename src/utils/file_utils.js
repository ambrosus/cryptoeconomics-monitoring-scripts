import fs from 'fs';

const writeFile = (path, contents) =>
  new Promise((resolve, reject) => {
    const data = JSON.stringify(contents, null, 2);
    fs.writeFile(path, data, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });

  const makeDirectory = (path) =>
    new Promise((resolve, reject) => {
      fs.mkdir(path, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  
  const getPath = (path) =>
    new Promise((resolve, reject) => {
      fs.lstat(path, (err, stats) => {
        if (err) {
          reject(err);
        } else {
          resolve(stats);
        }
      });
    });

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
