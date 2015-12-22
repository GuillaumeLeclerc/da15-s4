/* vim: set softtabstop=2 shiftwidth=2 expandtab : */

const EventEmitter = require('events');

class Node extends EventEmitter {

  constructor(ip, port) {
    super();
    EventEmitter.call(this);
    this.ip = ip;
    this.port = port;
  }

  setLink(p2tpl) {
    this.link = p2tpl;
    this.link.on('Ready', () => {
      this.emit('Ready');
    });
  }
}

export default Node
