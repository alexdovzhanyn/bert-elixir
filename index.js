const Bert = require('./bert')

let data = {
  a: 1,
  b: 2,
  c: 3
}

let encoded = Bert.encode_object(data)

console.log(Bert.binary_to_list(encoded))
