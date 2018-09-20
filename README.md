# BERT

Binary ERlang Term serialization library for Javascript. (An updated version of [this repo](https://github.com/rustyio/BERT-JS) )

## Usage
--------------------------------

### Encoding

#### Maps (Elixir)

```javascript
const Bert = require('bert-elixir')

// To encode a javascript object to an elixir map:
const mapToEncode = { a: 1, b: "hello!", c: [1, 2, 3] }
const encodedMap = Bert.encode(mapToEncode)

// BinaryToList shows individual bytes as a javascript array
console.log(Bert.binaryToList(encodedMap)
// => [ 131, 116, 0, 0, 0, 3, 100, 0, 1, 97, 97, 1, 100, 0, 1, 98, 109, 0, 0, 0, 6, 104, 101, 108, 108, 111, 33, 100, 0, 1, 99, 108, 0, 0, 0, 3, 97, 1, 97, 2, 97, 3, 106 ]
```

- [ ] Todo: Write docs for rest of data types

--------------------------------
### Decoding

Decoding is typically much simpler than encoding. Just pass the given Binary Erlang Term:

```javascript
const Bert = require('bert-elixir')

// We're showing the term as an array of bytes here for clarity.
// You'll more likely have a string
const erlangTerm = [131, 116, 0, 0, 0, 3, 100, 0, 1, 97, 97, 1, 100, 0, 1, 98, 97, 2, 100, 0, 1, 99, 116, 0, 0, 0, 1, 100, 0, 4, 119, 111, 97, 104, 109, 0, 0, 0, 8, 97, 32, 115, 116, 114, 105, 110, 103]
.map(x => String.fromCharCode(x)).join('') // Convert the array to a string

const decoded = Bert.decode(erlangTerm)

console.log(decoded)
// => { a: 1, b: 2, c: { woah: 'a string' } }
```
