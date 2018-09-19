const Bert = require('./bert')

let data = {
  a: 1,
  b: 2,
  c: 3
}

let encoded = Bert.encodeObject(data)

console.log(Bert.binaryToList(encoded))
