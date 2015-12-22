/* vim: set softtabstop=2 shiftwidth=2 expandtab : */
import _ from 'lodash'

import FLL from './networkPrimitives/FairLossLink.js'
import P2TPL from './networkPrimitives/PerfectPointToPointLink.js'
import BEB from './networkPrimitives/BestEffortBroadcast.js'
import RB from './networkPrimitives/ReliableBroadcast.js'
import CRB from './networkPrimitives/CausalReliableBroadcast.js'
import Node from './abstractions/node.js'
import Me from './abstractions/me.js'
import Executor from './abstractions/executor.js'

try {

  process.argv.shift();
  process.argv.shift();

  const nodes = [];

  for (var i in _.range(3)) {
    const addr = process.argv.shift();
    const port = parseInt(process.argv.shift());
    const node = new Node(addr, port);
    nodes.push(node);
  }

  const meId = parseInt(process.argv.shift());
  console.log(`Process ${meId} starting`);
  const inputFile = process.argv.shift();
  const outputFile = inputFile.replace('.input', '.output');
  console.log(outputFile);
  Me.id = meId;
  const me = nodes[meId];

  const links = [];

  const beb = new BEB();

  for (var i in _.range(3)) {
    const peer = nodes[i];
    const link = new P2TPL(new FLL(
      me.ip,
      me.port,
      peer.ip,
      peer.port
    ));
    beb.addLink(link, i);
  }
  const broadcast = new CRB(new RB(beb));
  const executor = new Executor(inputFile, outputFile, broadcast);

  process.on('SIGINT', function() {
    console.log('received sigint');
    executor.start();
  });
} catch(e) {
  console.log('ERRor');
  console.log(e.stack);
}
