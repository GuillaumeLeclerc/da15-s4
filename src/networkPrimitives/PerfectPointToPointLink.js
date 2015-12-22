/* vim: set softtabstop=2 shiftwidth=2 expandtab : */

import _ from 'lodash'
import Chance from 'chance'

const rng = new Chance();
const EventEmitter = require('events');

const pingInertia = 0.1;
const thresholdFactor = 3;
var currentPing = 0;

var  garbageCollectionThreshold;

const updateThreshold = () => {
  garbageCollectionThreshold = thresholdFactor * (1 + currentPing);
}

updateThreshold();

class PL extends EventEmitter{

  constructor(fll) {
    super();
    EventEmitter.call(this);
    this.fll = fll;
    this.pendingMessages = [];
    this.delivered = {};

    this.fll.on('Ready', () => {
      this.emit('Ready');
    });


    this.once('Init', () => {
      this.fll.emit('Init');
    });

    this.on('Send', (message) => {
      const messagePacket = {
        s: 'message',
        m: message,
        t: Date.now(),
        id: rng.guid()
      }
      const messageObject = {
        packet: messagePacket,
        stage: 0,
        time: 2
      }

      this.fll.emit('Send', messagePacket);
      this.pendingMessages.push(messageObject);
    });

    this.fll.on('Deliver', (packet) => {
      this.emit('Deliver-' + packet.s, packet);
    });

    this.on('Deliver-message', ({id:id, m:message, t:then}) => {
      const messagePacket = {
        s: 'ack',
        id
      }
      const now = Date.now();
      const ping = now - then;
      currentPing = pingInertia * ping + (1-pingInertia) * currentPing;
      if (ping < garbageCollectionThreshold)  {
        if (!this.delivered[id]) {
          this.emit('Deliver', message);
          this.delivered[id] = true;
        }
        this.fll.emit('Send', messagePacket);
      }
    });

    this.on('Deliver-ack', ({id:id}) => {
      _.remove(this.pendingMessages, {packet: {id:id}});
    });

    this.on('Deliver-gcRequest', ({m: m}) => {
      const stillSending = _.map(this.pendingMessages, 'packet.id');
      // we don't want to remove the one still sending
      const okToRemove = _.difference(m, stillSending);
      this.fll.emit('Send', {
        s: 'gcAck',
        m: okToRemove
      });
    });

    this.on('Deliver-gcAck', ({m:m}) => {
      // we keep them at least the duration of the invalidation of packet
      setTimeout(() => {
        const b = Object.keys(this.delivered).length;
        _.each(m, (id) => {
          delete this.delivered[id];
        });
        const c = Object.keys(this.delivered).length;
      }, 1.5*garbageCollectionThreshold);
    });

    const resend = () => {
      _.each(this.pendingMessages, (messageObject) => {
        messageObject.time--;
        if (messageObject.time <= 0) {
          messageObject.packet.t = Date.now();
          this.fll.emit('Send', messageObject.packet);
          messageObject.stage++;
          messageObject.time = messageObject.stage;
        }
      });
      setTimeout(resend, 1.5*currentPing);
    }


    const garbageCollect = () => {
      updateThreshold();
      if (Object.keys(this.delivered).length > 0) {
        const message = {
          s: 'gcRequest',
          m: Object.keys(this.delivered),
        }
        this.fll.emit('Send', message);
      }
      setTimeout(garbageCollect, 10*garbageCollectionThreshold);
    }

    resend();
    garbageCollect();
  }

  getNodesCount() {
  }
}

export default PL;

