/* vim: set softtabstop=2 shiftwidth=2 expandtab : */

import _ from 'lodash'
import readline from 'readline'
import EventEmitter from 'events'

class InstructionReader extends EventEmitter {

  constructor (readStream) {
    super()
    EventEmitter.call(this);

    this.inputStream = readStream;
    this.buffer = [];
    this.ready = false;

    this.reader = readline.createInterface({
      input: this.inputStream,
      terminal: false
    });

    this.reader.on('line', (line) => {
      this.buffer.push(line);
      this.propagate();
    });
  }

  nextInstruction() {
    this.ready = true;
    this.propagate();
  }

  propagate () {
    if (this.ready && this.buffer.length > 0) {
      try {
        this.ready = false;
        const instruction = this.buffer.shift();
        const args = instruction.split(',')
        const operation = args.shift();
        if (operation === 'get') {
          if (args.length != 1) {
            throw new Error('get operation expect exactly one argument ' + args.length + ' given');
          }
          this.emit('get', args[0]);
        } else if (operation === 'put') {
          if (args.length != 2) {
            throw new Error('put operation expect exactly two argument ' + args.length + ' given');
          }
          this.emit('put', args[0], args[1]);
        } else {
          throw new Error('Unkown operation: "' + operation + '"');
        }
      } catch (e) {
        this.ready = true;
        console.error(e.stack);
        _.delay(this.propagate.bind(this), 0);
      }
    }
  }

}

export default InstructionReader
