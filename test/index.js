const Bert = require('../index')

let data = {
  a: 1,
  b: 2,
  c: {
    woah: "a string"
  }
}

let data2 = [131, 107, 0, 8, 97, 32, 115, 116, 114, 105, 110, 103].map(x => String.fromCharCode(x)).join('')
console.log(data2)

let encoded = Bert.encode(data)
let decoded1 = Bert.decode(encoded)
let decoded = Bert.decode(data2)

console.log(Bert.binaryToList(encoded))
console.log(decoded1)
console.log(decoded)
