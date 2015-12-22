/* vim: set softtabstop=2 shiftwidth=2 expandtab : */

import Chance from 'chance'
import _ from 'lodash'

import Me from '../abstractions/me.js'

const EventEmitter = require('events');
const rng = new Chance();

class NNAR extends EventEmitter{
  
  constructor (broadcast, links) {
    super();
    EventEmitter.call(this);
    this.broadcast = broadcast;
    this.linkMap = links;
    const N = Object.keys(this.linkMap).length;

    this.ctx = {};

    const getCtx = (key) => {
      if (this.ctx[key] === undefined) {
        this.ctx[key] = {
          ts: 0,
          wr: 0,
          val: null,
          acks: 0,
          writeval: 0,
          rid: 0,
          readlist: {},
          readval: null,
          reading: false
        }
      }

      return this.ctx[key];
    }

    this.on('Read', (key) => {
      console.log('NEW Instruction');
      const ctx = getCtx(key);
      ctx.rid += 1;
      ctx.acks = 0;
      ctx.readlist = {}
      ctx.reading = true;
      const packet = {
        k: key,
        s: 'read',
        o: Me.id,
        c: [ctx.rid]
      }
      this.broadcast.emit('Broadcast', packet);
    })

    this.broadcast.on('Deliver', (packet) => {
      if (packet.s === 'read') {
        const key = packet.k
        const ctx = getCtx(key);
        const dest = packet.o;

        const out = {
          k : key,
          s: 'value',
          o: Me.id,
          c: [packet.c[0], ctx.ts, ctx.wr, ctx.val],
        }
        this.linkMap[dest].emit('Send', out);
      }
    });

    _.each(this.linkMap, (pl, q) => {
      pl.on('Deliver', (packet) => {
        if (packet.s === 'value') {
          const key = packet.k;
          const ctx = getCtx(key);
          var [r, tsp, wrp, vp] = packet.c;
          if (r === ctx.rid) {
            ctx.readlist[q] = [tsp, wrp, vp];
            if (_.size(ctx.readlist) > N/2) {
              var cdata = _.max(ctx.readlist, (v) => {return v[0]});
              var maxts = cdata[0];
              var rr = cdata[1];
              ctx.readval = cdata[2];
              ctx.readlist = {}
              const out = {
                k: key,
                s: 'write',
                o: Me.id,
              }
              if (ctx.reading) {
                out.c = [ctx.rid, maxts, rr, ctx.readval];

              } else {
                out.c = [ctx.rid, maxts + 1, Me.id, ctx.writeval];
              }
              this.broadcast.emit('Broadcast', out);
            }
          }
        }
      });

      pl.on('Deliver', (packet) => {
        if (packet.s === 'ack') {
          const key = packet.k;
          const ctx = getCtx(key);
          var r = packet.c[0];
          if (r === ctx.rid) {
            ctx.acks++;
            if (ctx.acks > N/2) {
              ctx.acks = 0;
              console.log('Operation Done');
              if (ctx.reading) {
                ctx.reading = false;
                this.emit('ReadReturn', ctx.readval);
              } else {
                this.emit('WriteReturn');
              }
            }
          }
        }
      });
    });

    this.on('Write', (key, v) => {
      console.log('NEW Instruction');
      const ctx = getCtx(key);
      ctx.rid++;
      ctx.writeval = v;
      ctx.acks = 0;
      ctx.readlist = {};
      const packet = {
        k: key,
        s: 'read',
        o: Me.id,
        c: [ctx.rid]
      }
      this.broadcast.emit('Broadcast', packet);
    });

    this.broadcast.on('Deliver', (packet) => {
      if (packet.s === 'write') {
        const key = packet.k;
        const ctx = getCtx(key);
        var p = packet.o;
        var [r, tsp, wrp, vp] = packet.c;
        if (tsp > ctx.ts || (tsp === ctx.ts && wrp > ctx.wr)) { //lexicographic order
          [ctx.ts, ctx.wr, ctx.val] = [tsp, wrp, vp];
        }
        const out = {
          k: key,
          s: 'ack',
          o: Me.id,
          c: [r]
        }
        this.linkMap[p].emit('Send', out);
      }
    });
  }
}

class StorageEngine extends EventEmitter{

  constructor (broadcast) {
    super();
    EventEmitter.call(this);
    this.broadcast = broadcast;
    this.links = this.broadcast.getLinkMap();
    this.register = new NNAR(this.broadcast, this.links);

    this.once('Init', () => {
      this.broadcast.emit('Init');

      this.on('get', (key) => {
        this.register.once('ReadReturn', (value) => {
          this.emit('get-end', value);
        });

        this.register.emit('Read', key);
      });

      this.on('put', (key, value) => {
        this.register.once('WriteReturn', () => {
          this.emit('put-end');
        });

        this.register.emit('Write', key, value);
      });
    });

    this.broadcast.once('Ready', () => {
      this.emit('Ready');
    });

  }
}

export default StorageEngine
