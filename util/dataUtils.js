import { error } from "console";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const dataUtil = {};
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dataUtil.baseDir = path.join(__dirname, ".././data");

dataUtil.create = (dir, fileName, data, callback) => {
  const file = `${dataUtil.baseDir}/${dir}/${fileName}.json`;
  fs.open(file, "wx", (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      const stringData = JSON.stringify(data);
      fs.write(fileDescriptor, stringData, (err) => {
        if (!err) {
          fs.close(fileDescriptor, (err) => {
            if (!err) {
              callback(false);
            } else {
              callback(400, { error: "could not close the data file." });
            }
          });
        } else {
          callback(400, { error: "could not write the data." });
        }
      });
    } else {
      callback(400, {
        error: "could not create the data or the data already exists.",
      });
    }
  });
};

dataUtil.read = (dir, fileName, callback) => {
  const file = `${dataUtil.baseDir}/${dir}/${fileName}.json`;
  fs.open(file, "r", (err, fileDescriptor) => {
    if (!err) {
      const buffer = Buffer.alloc(1024); // Allocate buffer
      fs.read(fileDescriptor, buffer, 0, buffer.length, 0, (err, userData) => {
        if (!err) {
          const dataString = buffer.toString("utf8", 0, userData);
          const data = JSON.parse(dataString);
          fs.close(fileDescriptor, (err) => {
            if (!err) {
              callback(false, data);
            } else {
              callback(400, { error: "could not close the data file." });
            }
          });
        } else {
          callback(400, { error: "could not read the data file." });
        }
      });
    } else {
      callback(404, { error: "the specified data does not exist." });
    }
  });
};

dataUtil.delete = (dir, fileName, callback) => {
  const file = `${dataUtil.baseDir}/${dir}/${fileName}.json`;
  fs.unlink(file, (err) => {
    if (!err) {
      callback(false, {});
    } else {
      callback(400, { error: "could not delete the data." });
    }
  });
};

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
                  callback(400, { error: "could not close the file." });
                }
              });
            } else {
              callback(400, { error: "could not write the data file." });
            }
          });
        } else {
          callback(400, { error: "could not empty the data file." });
        }
      });
    } else {
      callback(404, { error: "the data does not exist." });
    }
  });
};
