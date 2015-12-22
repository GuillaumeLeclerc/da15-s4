/* vim: set softtabstop=2 shiftwidth=2 expandtab : */

import dgram from 'dgram'

class UDPDispatcher {

  constructor (myIp, myPort) {
    this.myIp = myIp;
    this.myPort = myPort;
    this.socket = dgram.createSocket('udp4');
    this.listeners = {};
  }

  bind() {
    return new Promise((a, r) => {
      this.socket.bind(this.myPort, this.myIp, () => {
        this.socket.on('message', (message, sender) => {
          const packet = JSON.parse(message.toString('ascii'));
          if(this.listeners[packet.o]) {
            this.listeners[packet.o](packet.m);
          }
        });
        a();
      })
    });
  }

  listen(addr, port, callback) {
    this.socket.ref();
    const tuple = `${addr}:${port}`;
    if (this.listeners[tuple] !== undefined) {
      throw new Error('Someone is already listening this');
    } else {
      this.listeners[tuple] = callback;
    }
  }

  stopListening(addr, port) {
    this.socket.unref();
    const tuple = `${addr}:${port}`;
    delete this.listeners[tuple];
  }

}

export default UDPDispatcher;

