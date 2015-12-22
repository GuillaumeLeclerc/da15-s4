/* vim: set softtabstop=2 shiftwidth=2 expandtab : */


import Me from '../abstractions/me.js'
import _ from 'lodash'
import Chance from 'chance'

const rng = new Chance();
const EventEmitter = require('events');

class RB extends EventEmitter{

  deliver (packet) {
    if (packet.t === 'rb') {
      const id = packet.id;
      if (this.delivered[id] === undefined) {
        const origin = packet.o;
        this.delivered[id] = 1;
        packet.o = Me.id;
        this.emit('Deliver', _.clone(packet.m));
        this.beb.emit('Broadcast', packet);
        packet.kkk = rng.guid();
      } else {
        this.delivered[id]++;
        if (this.delivered[id] === this.numberOfNodes + 1) {
          delete this.delivered[id];
        }
      }
    }
  }

  constructor(beb) {

    super();
    EventEmitter.call(this);
    this.beb = beb;
    this.delivered = {};
    this.numberOfNodes = this.beb.getNodesCount();

    this.once('Init', () => {
      this.beb.emit('Init');
    });

    this.beb.once('Ready', () => {
      this.emit('Ready');
    });

    this.on('Broadcast', (message) => {
      const packet = {
        t: 'rb',
        m: message,
        o: Me.id,
        id: rng.guid()
      }
      this.deliver(_.clone(packet));
    });

    this.beb.on('Deliver', (packet) => {
      this.deliver(packet);
    });
  }

  getNodesCount () {
    return this.beb.getNodesCount();
  }

  getLinkMap () {
    return this.beb.getLinkMap();
  }
}

export default RB;
