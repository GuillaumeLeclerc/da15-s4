/* vim: set softtabstop=2 shiftwidth=2 expandtab : */

import _ from 'lodash'
import fs from 'fs'

const inputFiles = [
  '0.input',
  '1.input',
  '2.input'
];

const outputFiles = [
  '0.output',
  '1.output',
  '2.output'
];

const values = {};
const ops = {};


_.each(_.range(3), (id) => {
  const results = _.filter(fs.readFileSync(id + '.output', {encoding: 'utf-8'}).split('\n'), (r) => {return r != ''});
  const operations = fs.readFileSync(id + '.input',{encoding: 'utf-8'}).split('\n');
  var getOp = 0;
  _.each(operations, (operation, opId) => {
    const parts = operation.split(',');
    if (parts.length === 3) {
      values[parts[2]] = [id, opId];
      ops[id + ',' + opId] = {
        type: 'write',
        key: parts[1],
        value: parts[2]
      };
    } else {

      getOp++;
      
      ops[id + ',' + opId] = {
        type: 'read',
        key: parts[1],
        value: results.shift()
      };
    }
  });
});

var en = false;

const findWrite = (id, pos, key, value, path) => {
  const correspondingOperation = ops[id + ',' + pos];
  path = _.clone(path);
  path.push([id,pos]);


  // we found the correct node
  if (correspondingOperation.type === 'write' && correspondingOperation.key === key && correspondingOperation.value === value) {
    return [path];
  }


  var rule2 = [];


  if (correspondingOperation.type === 'read' && correspondingOperation.value !== 'null') {
    const [nextId, nextPos] = values[correspondingOperation.value];
    rule2 = findWrite(nextId, nextPos, key, value, path);
  }

  if (pos == 0) {
    if (value === 'null') {
      return [path].concat(rule2);
    } else {
      return [];
    }
  }

  return rule2.concat(findWrite(id, pos-1, key, value, path));
}


var i = 0;
_.each(ops, (op, kk) => {
  console.log(i++);
  var [id, pos] = kk.split(',');
  if (op.type === 'read') {
    const key = op.key;
    const value = op.value;
    const paths = findWrite(id, pos, key, value, []);
    const res = _.any(paths, (path) => {
      const firstIndex  = _.findIndex(path, ([i, p]) => {
        const op = ops[i + ',' + p];
        return op.type === 'write' && op.key == key && op.value !== value;
      });
      return firstIndex != -1;
    });
    console.log(res);
    if (res === true) {
      console.log('Sooooo bad');
    }
  }

})
