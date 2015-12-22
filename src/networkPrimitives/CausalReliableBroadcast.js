/* vim: set softtabstop=2 shiftwidth=2 expandtab : */

import _ from 'lodash'
import Me from '../abstractions/me.js'

const EventEmitter = require('events');

class CRB extends EventEmitter{

  constructor (RB) {
    super();
    EventEmitter.call(this);
    this.rb = RB;

    this.once('Init', () => {
      this.vc = Array(this.getNodesCount()).fill(0);
      this.lsn = 0;
      this.pending = [];
      this.rb.emit('Init');
    });

    this.rb.once('Ready', () => {
      this.emit('Ready');
    });

    this.on('Broadcast', (message) => {
      const lvc = _.clone(this.vc);
      lvc[Me.id] = this.lsn;
      this.lsn ++;
      const packet = {
        vc: lvc,
        m: message,
        t: 'crb',
        o: Me.id
      }
      this.rb.emit('Broadcast', packet);
    });

    this.rb.on('Deliver', (packet) => {
      if (packet.t === 'crb') {
        delete packet.t;
        packet.pute = 'ho oui';
        this.pending.push(packet);
        var cur = null;
        while (cur = _.find(this.pending, this.vcComparator, this)) {
          _.remove(this.pending, cur);
          this.vc[cur.o]++;
          this.emit('Deliver', cur.m);
        }
      }
    });
  }

  vcComparator (packet) {
    return _.all(this.vc, (value, index) => {
      return packet.vc[index] <= value;
    });
  }

  getNodesCount() {
    return this.rb.getNodesCount();
  }

  getLinkMap() {
    return this.rb.getLinkMap();
  }
}

export default CRB;
