/* vim: set softtabstop=2 shiftwidth=2 expandtab : */

import dgram from 'dgram'
import UDPDispatcher from './UDPDispatcher.js'

const EventEmitter = require('events');

class FLL extends EventEmitter{

  static dispatcher = null;


  constructor(myAddr, myPort, destAddr, destPort) {
    //super construction
    super();
    EventEmitter.call(this);

    this.socket = dgram.createSocket('udp4');
    this.myAddr = myAddr;
    this.myPort = myPort;
    this.destAddr = destAddr;
    this.destPort = destPort;

    this.on('Init', () => {
      if (FLL.dispatcher === null) {
        FLL.dispatcher = new UDPDispatcher(myAddr, myPort);
        FLL.dispatcher.bind().then(() => {
          this.emit('Ready');
        });
      } else {
          this.emit('Ready');
      }

      FLL.dispatcher.listen(this.destAddr, this.destPort, (message) => {
        this.emit('Deliver', message);
      });
    });

    // SEND Event<Message>
    this.on('Send', (message) => {
      const packet = {
        o: myAddr + ':' + myPort,
        m: message
      }
      const buffer = new Buffer(JSON.stringify(packet), 'ascii');
      this.socket.send(buffer, 0, buffer.length, this.destPort, this.destAddr);
    });

  }

  close () {
    FLL.dispatcher.stopListening(this.myAddr, this.myPort);
    //this.socket.unref();
  }
}

export default FLL;
