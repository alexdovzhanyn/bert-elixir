# BERT

Binary ERlang Term serialization library for Javascript. (An updated version of [this repo](https://github.com/rustyio/BERT-JS) )

## Usage
--------------------------------

### Example Usage

When needing to consume data in Javascript from an Erlang system, the Erlang
system can simply send encoded binary data:

*Elixir/Erlang:*
```elixir
# This is Elixir code, but function calls will be very similar in Erlang

personData = %{
  name: "Bob",
  age: 32,
  eye_color: "Brown",
  personality_traits: [
    "Funny",
    "Inquisitive"
  ]
}

# Convert to binary
:erlang.term_to_binary(personData)

# .... Code that sends binary data to javascript
```

*Javascript:*
```javascript
// ... Code that receives binary data from erlang/elixir and stores it
// to a variable, personData

const Bert = require('bert-elixir')

const decodedPerson = Bert.decode(personData)
/*
  => { age: 32,
      eye_color: 'Brown',
      name: 'Bob',
      personality_traits: [ 'Funny', 'Inquisitive' ]
    }
*/
```

Modifying this data and sending it back to Erlang/Elixir would be as simple as:

*Javascript:*
```javascript
// ... Assuming we have a decodedPerson object

decodedPerson.age = 38
decodedPerson.name = 'Robert'

const reEncodedPerson = Bert.encode(decodedPerson)

// ... Send the binary
```

*Elixir/Erlang:*
```elixir
# ... After having received binary data and setting it to variable modifiedPersonData:

decodedPerson = :erlang.binary_to_term(modifiedPersonData, [:safe])

# => %{ age: 38, eye_color: "Brown", name: "Robert", personality_traits: ["Funny", "Inquisitive"] }
```

safe option should be always used when decoding an untrusted input, make also sure to have already all required atoms in the atoms table.

### Encoding

#### Maps (Elixir)

Javascript objects map directly to Maps in Erlang

```javascript
const Bert = require('bert-elixir')

// To encode a javascript object to an elixir map:
const mapToEncode = { a: 1, b: "hello!", c: [1, 2, 3] }
const encodedMap = Bert.encode(mapToEncode)

// BinaryToList shows individual bytes as a javascript array
console.log(Bert.binaryToList(encodedMap))
// => [ 131, 116, 0, 0, 0, 3, 100, 0, 1, 97, 97, 1, 100, 0, 1, 98, 109, 0, 0, 0, 6, 104, 101, 108, 108, 111, 33, 100, 0, 1, 99, 108, 0, 0, 0, 3, 97, 1, 97, 2, 97, 3, 106 ]
```

#### Lists

Javascript arrays map to Erlang Lists

```javascript
const Bert = require('bert-elixir')

const arrayToEncode = ['hello', 'world', 32, [{ key: "value" }]]
const encodedArray = Bert.encode(arrayToEncode)

console.log(Bert.binaryToList(encodedArray))
```

Todo:
- [ ] Write docs for rest of data types
- [ ] Return `nil` as `null` instead of `'nil'`
- [ ] Add support for NEW_FLOAT_EXT

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
