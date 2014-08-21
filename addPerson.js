var fs = require('fs');
var obj = JSON.parse(fs.readFileSync('tmp.json'));
var list = JSON.parse(fs.readFileSync('res/data/data.json'));

function sortObject(obj, strict) {
  if (obj instanceof Array) {
    var ary;
    if (strict) {
      ary = obj.sort();
    } else {
      ary = obj;
    }
    return ary;
  }
  if (typeof obj === 'object') {
    var tObj = {};
    Object.keys(obj).sort().forEach( function(key) {
      tObj[key] = sortObject(obj[key])
    })
    return tObj;
  }
  return obj;
}

function fixArrays(obj){
  var l = Object.keys(obj);
  var ret = [];
  if (l.length == l.filter(function(e) {
        return e.match(/^\d+$/)
      }).length && l.length > 0) {
    l.forEach(function(k){
      ret.push(obj[k])
    })
    return ret;
  } else {
    return false;
  }
}

['id', 'country', 'city', 'skills', 'name', 'shortbio', 'organisation', 'email', 'website', 'twitter'].forEach(function(field) {
  if (!obj[field]) {
    obj[field] = 'n/a';
  }
});
obj.id = new Date().getTime();

list.children.push(obj);
fs.writeFileSync('res/data/data.json',
    JSON.stringify(sortObject(list, true), undefined, 4));
