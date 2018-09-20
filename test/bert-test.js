const Bert = require('../index.js')

const nilBinary = [131, 100, 0, 3, 110, 105, 108].map(c => String.fromCharCode(c)).join('')

console.log(Bert.decode(nilBinary))
