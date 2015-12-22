/* vim: set softtabstop=2 shiftwidth=2 expandtab : */

import _ from 'lodash'

const EventEmitter = require('events');

class BEB extends EventEmitter{

  constructor() {
    super();
    EventEmitter.call(this);
    this.links = [];
    this.linksToId = {};
    this.ready = 0;

    this.once('Init', () => {
      _.each(this.links, (link) => {
        link.emit('Init');
      });
    });

    this.on('Broadcast', (message) => {
      const packet = {
        m: message,
        c: 'beb'
      }
      _.each(this.links, (link) => {
        link.emit('Send', packet);
      });
    });

  }

  getNodesCount() {
    return this.links.length;
  }

  addLink(link, to) {
    this.links.push(link);
    this.linksToId[to] = link;
    link.on('Ready', () => {
      this.ready++;
      if (this.ready === this.links.length) {
        this.emit('Ready');
      }
    });

    link.on('Deliver', (message) => {
      if (message.c === 'beb') {
        this.emit('Deliver', message.m);
      }
    });
  }

  getLinkMap () {
    return this.linksToId;
  }

}

export default BEB;
