/* vim: set softtabstop=2 shiftwidth=2 expandtab : */

import fs from 'fs'
import _ from 'lodash'
import readline from 'readline'
import StorageEngine from './storage.js'

import InstructionReader from './instructionReader.js'

class Executor {

  constructor (inputFile, outputFile, broadcast) {

    this.readStream = fs.createReadStream(inputFile);
    this.writeStream = fs.createWriteStream(outputFile, {
      flags: 'w'
    });

    this.storageEngine = new StorageEngine(broadcast);

    this.started = new Promise((resolve) => {
      this.start = resolve;
    });

    this.ready = new Promise((resolve) => {
      this.storageEngine.emit('Init');
      this.storageEngine.once('Ready', () => {
        console.log('storage ready');
        resolve();
      });
    });

    this.instructionReader = new InstructionReader(this.readStream);

    this.storageEngine.on('get-end', (value) => {
      this.writeStream.write(value + '\n');
      this.instructionReader.nextInstruction();
    });

    this.storageEngine.on('put-end', () => {
      this.instructionReader.nextInstruction();
    });

    this.instructionReader.on('get', (key) => {
      console.log('reading ' + key);
      this.storageEngine.emit('get', key);
    });

    this.instructionReader.on('put', (key, value) => {
      console.log('putting ' + key + ' = ' + value);
      this.storageEngine.emit('put', key, value);
    });

    Promise.all([this.started, this.ready]).then(() => {
      this.instructionReader.nextInstruction();
    });
  }
}

export default Executor
