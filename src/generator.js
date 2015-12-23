/* vim: set softtabstop=2 shiftwidth=2 expandtab : */
import _ from 'lodash'
import Chance from 'chance'
import fs from 'fs'

const rng = new Chance();
const args = process.argv;

const filenames = [
  '0.input',
  '1.input',
  '2.input'
]

args.shift();
args.shift();

const numVars = parseInt(args.shift());
const numOperations = parseInt(args.shift());

console.log(numVars);
const variableNames = rng.unique(rng.word, numVars); 

console.log(variableNames);

const guids = rng.unique(rng.guid, 3 * numOperations);

console.log(guids);


_.each(filenames, (filename) => {
  const writeStream = fs.createWriteStream(filename, {
    flags: 'w'
  });

  const operations = _.map(_.range(numOperations), () => {
    const dice = rng.d6() % 2;
    const variable = variableNames[rng.integer({min: 0, max: numVars-1})];
    if (dice === 1) {
      return 'get,' + variable;
    } else {
      return 'put,' + variable + ',' + guids.shift();
    }
  }).join('\n');
  writeStream.write(operations);
});
