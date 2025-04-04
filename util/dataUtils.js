import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const dataUtil = {};
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dataUtil.baseDir = path.join(__dirname, ".././data");

// Creating a specified file
dataUtil.create = (dir, fileName, data, callback) => {
  const file = `${dataUtil.baseDir}/${dir}/${fileName}.json`;
  fs.open(file, "wx", (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      const stringData = JSON.stringify(data);
      fs.write(fileDescriptor, stringData, (err) => {
        if (!err) {
          fs.close(fileDescriptor, (err) => {
            if (!err) {
              callback(false, { Success: "file is created." });
            } else {
              callback(400, { Error: "could not close the file." });
            }
          });
        } else {
          callback(400, { Error: "could not write the data." });
        }
      });
    } else {
      callback(400, {
        Error: "could not create the file or already exists.",
      });
    }
  });
};

// Reading a specified file
dataUtil.read = (dir, fileName, callback) => {
  const file = `${dataUtil.baseDir}/${dir}/${fileName}.json`;
  fs.open(file, "r", (err, fileDescriptor) => {
    if (!err) {
      const buffer = Buffer.alloc(1024); // Allocate buffer for raw data
      fs.read(fileDescriptor, buffer, 0, buffer.length, 0, (err, userData) => {
        if (!err) {
          const dataString = buffer.toString("utf8", 0, userData); // decoding buffer data to string format
          const data = JSON.parse(dataString);
          fs.close(fileDescriptor, (err) => {
            if (!err) {
              callback(false, data);
            } else {
              callback(400, { Error: "could not close the file." });
            }
          });
        } else {
          callback(400, { Error: "could not read the file." });
        }
      });
    } else {
      callback(404, { Error: "the file does not exist." });
    }
  });
};

// Deleting a specified file
dataUtil.delete = (dir, fileName, callback) => {
  const file = `${dataUtil.baseDir}/${dir}/${fileName}.json`;
  fs.unlink(file, (err) => {
    if (!err) {
      callback(false, {});
    } else {
      callback(400, { Error: "could not delete the file." });
    }
  });
};

// Modifying a file
dataUtil.update = (dir, fileName, data, callback) => {
  const userFile = `${dataUtil.baseDir}/${dir}/${fileName}.json`;
  fs.open(userFile, "r+", (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      // Deleting the content
      fs.truncate(userFile, (err) => {
        const stringData = JSON.stringify(data);
        if (!err) {
          fs.writeFile(userFile, stringData, (err) => {
            if (!err) {
              fs.close(fileDescriptor, (err) => {
                if (!err) {
                  callback(false, data);
                } else {
                  callback(400, { Error: "could not close the file." });
                }
              });
            } else {
              callback(400, { Error: "could not write the data file." });
            }
          });
        } else {
          callback(400, { Error: "could not empty the data file." });
        }
      });
    } else {
      callback(404, { Error: "the data does not exist." });
    }
  });
};

dataUtil.move = (dirFrom, dirTo, fileName, callback) => {
  const source = `${dataUtil.baseDir}/${dirFrom}/${fileName}.json`;
  const destination = `${dataUtil.baseDir}/${dirTo}/${fileName}.json`;

  fs.rename(source, destination, (err) => {
    if (!err) {
      callback(false);
    } else {
      callback("error during file moving.");
    }
  });
};
