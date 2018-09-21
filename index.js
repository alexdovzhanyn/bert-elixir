const BERT_START = String.fromCharCode(131)
const SMALL_ATOM = String.fromCharCode(115)
const ATOM = String.fromCharCode(100)
const SMALL_INTEGER = String.fromCharCode(97)
const MAP = String.fromCharCode(116)
const INTEGER = String.fromCharCode(98)
const SMALL_BIG = String.fromCharCode(110)
const LARGE_BIG = String.fromCharCode(111)
const FLOAT = String.fromCharCode(99)
const CHARLIST = String.fromCharCode(107)
const STRING = String.fromCharCode(109)
const LIST = String.fromCharCode(108)
const SMALL_TUPLE = String.fromCharCode(104)
const LARGE_TUPLE = String.fromCharCode(105)
const NIL = String.fromCharCode(106)
const ZERO = String.fromCharCode(0)
const ZERO_CHAR = String.fromCharCode(48)

const atom = value => ({ type: 'Atom', value, toString: () => value })

const charlist = value => ({ type: 'Charlist', value, toString: () => value })

const encode = obj => BERT_START + encodeInner(obj)

const encodeCharlist = ({ value }) => CHARLIST + intToBytes(value.length, 2) + value

const encodeString = obj => STRING + intToBytes(obj.length, 4) + obj

const encodeBoolean = obj => encodeInner(atom(obj ? 'true' : 'false'))

const encodeAtom = ({ value }) => ATOM + intToBytes(value.length, 2) + value

const decodeSmallInteger = s => ({ value: s.charCodeAt(0), rest: s.substring(1) })

const decodeInteger = (s, count) => ({ value: bytesToInt(s, count), rest: s.substring(count) })

const encodeAssociativeArray = obj => encodeArray(Object.keys(obj).map(k => tuple(atom(k), obj[k])))

const tuple = (...arr) => {
  let res = { type: 'Tuple', length: arr.length, value: arr, toString: () => `{${arr.join(", ")}}`, items: [] }

  for (var i = 0; i < arr.length; i++) {
		res.items.push(arr[i])
	}

  return res
}

const encodeInner = obj => {
  if (obj === undefined) throw new Error('Cannot encode undefined values.')

  switch(typeof(obj)) {
  case 'string': return encodeString(obj)
  case 'boolean': return encodeBoolean(obj)
  case 'atom': return encodeAtom(obj)
  case 'number': return encodeNumber(obj)
  case 'float': return encodeFloat(obj)
  case 'object': return encodeObject(obj)
  case 'tuple': return encodeTuple(obj)
  case 'array': return encodeArray(obj)
  default: return
  }
}

const decode = s => {
  if (s[0] !== BERT_START) throw ('Not a valid BERT.')

  const obj = decodeInner(s.substring(1))

  if (obj.rest !== '') throw ('Invalid BERT.')

  return obj.value
}

const encodeNumber = obj => {
  const isInteger = obj % 1 === 0

  // Float
  if (!isInteger) return encodeFloat(obj)

  // Small int
  if (isInteger && obj >= 0 && obj < 256) return SMALL_INTEGER + intToBytes(obj, 1)

  // 4 byte int
  if (isInteger && obj >= -134217728 && obj <= 134217727) return INTEGER + intToBytes(obj, 4)

  obj = bignumToBytes(obj)

  if (obj.length < 256) {
    return SMALL_BIG + intToBytes(obj.length - 1, 1) + obj
  } else {
    return LARGE_BIG + intToBytes(obj.length - 1, 4) + obj
  }
}

const encodeFloat = obj => {
  obj = obj.toExponential(20)

  const match = /([^e]+)(e[+-])(\d+)/.exec(obj)
  let exponentialPart = match[3].length == 1 ? "0" + match[3] : match[3]

  let num = match[1] + match[2] + exponentialPart

  return FLOAT + num + ZERO.repeat(32 - num.length)
}

const encodeObject = obj => {
  if (obj === null) return encodeInner(atom('null'))

  if (obj.type === 'Atom') return encodeAtom(obj)

  if (obj.type === 'Tuple') return encodeTuple(obj)

  if (obj.type === 'Charlist') return encodeCharlist(obj)

  // Check if it's an array...
  if (obj.constructor.toString().includes('Array')) return encodeArray(obj)

  // Treat the object as a map
  return encodeMap(obj)
}

const encodeTuple = obj => {
  let s

  if (obj.length < 256) {
    s = SMALL_TUPLE + intToBytes(obj.length, 1)
  } else {
    s = LARGE_TUPLE + intToBytes(obj.length, 4)
  }

  return s + obj.items.reduce((acc, curr) => acc + encodeInner(curr), '')
}

const encodeMap = obj => {
  const { map } = obj
  const arity = Object.keys(obj).length

  return MAP + intToBytes(arity, 4) + Object.keys(obj).map(key => encodeInner(atom(key)) + encodeInner(obj[key])).join('')
}

const encodeArray = obj => {
  if (obj.length === 0) return encodeInner(tuple(atom('bert'), atom('nil')))

  return LIST + intToBytes(obj.length, 4) + obj.reduce((acc, curr) => acc + encodeInner(curr), '') + NIL
}

const decodeInner = s => {
  const type = s[0]

  s = s.substring(1)

  switch(type) {
    case SMALL_ATOM: return decodeAtom(s, 1)
    case ATOM: return decodeAtom(s, 2)
    case SMALL_INTEGER: return decodeSmallInteger(s)
    case INTEGER: return decodeInteger(s, 4)
    case SMALL_BIG: return decodeBig(s, 1)
    case LARGE_BIG: return decodeBig(s, 4)
    case MAP: return decodeMap(s)
    case FLOAT: return decodeFloat(s)
    case STRING: return decodeString(s)
    case CHARLIST: return decodeCharlist(s)
    case LIST: return decodeList(s)
    case SMALL_TUPLE: return decodeTuple(s, 1)
    case LARGE_TUPLE: return decodeLargeTuple(s, 4)
    case NIL: return decodeNil(s)
    default: throw(`Unexpected BERT type: ${s.charCodeAt(0)}`)
  }
}

const decodeAtom = (s, count) => {
  let size = bytesToInt(s, count)

  s = s.substring(count)
  let value = s.substring(0, size)

  return { value: atom(value), rest: s.substring(size) }
}

const decodeBig = (s, count) => {
  let size = bytesToInt(s, count)
  s = s.substring(count)

  return { value: bytesToBignum(s, size), rest: s.substring(size + 1) }
}

const decodeFloat = s => ({ value: parseFloat(s.substring(0, 31)), rest: s.substring(31) })

const decodeString = s => {
  let size = bytesToInt(s, 4)
  s = s.substring(4)

  return { value: s.substring(0, size), rest: s.substring(size) }
}

const decodeCharlist = s => {
  let size = bytesToInt(s, 2)
  s = s.substring(2)

  return { value: charlist(s.substring(0, size)), rest: s.substring(size) }
}

const decodeList = s => {
  let size = bytesToInt(s, 4)
  let arr = []
  s = s.substring(4)

  for (let i = 0; i < size; i++) {
    let { value, rest } = decodeInner(s)
    arr.push(value)
    s = rest
  }

  if (s[0] !== NIL) throw('List does not end with NIL!')

  s = s.substring(1)

  return { value: arr, rest: s }
}

const decodeMap = s => {
  let size = bytesToInt(s, 4)
  let obj = {}
  s = s.substring(4)

  for (let i = 0; i < size; i++) {
    let { value: atom, rest: r } = decodeInner(s)
    s = r

    let { value, rest } = decodeInner(s)

    obj[atom] = value

    s = rest
  }

  return { value: obj, rest: s }
}

const decodeTuple = (s, count) => {
  let size = bytesToInt(s, count)
  let arr = []
  s = s.substring(count)

  for (let i = 0; i < size; i++) {
    let { value, rest } = decodeInner(s)
    arr.push(value)
    s = rest
  }

  if (size >= 2) {
    let head = arr[0]

    if (typeof head === 'object' && head.type === 'Atom' && head.value === 'bert') {
      let kind = arr[1]

      if (typeof kind !== 'object' || kind.type !== 'Atom') throw('Invalid {bert, _} tuple!')

      switch(kind.value) {
        case 'true': return { value: true, rest: s }
        case 'false': return { value: false, rest: s }
        case 'nil': return { value: null, rest: s }
        case 'time':
        case 'dict':
        case 'regex': throw(`TODO: decode ${kind.value}`)
        default: throw(`Invalid {bert, ${kind.value.toString()}} tuple!`)
      }
    }
  }

  return { value: tuple(value), rest: s }
}

const decodeNil = s => ({ value: [], rest: s })

// Encode an integer to a big-endian byte-string of length Length.
// Throw an exception if the integer is too large
// to fit into the specified number of bytes.
const intToBytes = (int, length) => {
  let isNegative = int < 0
  let s = ''

  if (isNegative) {
    int = -int - 1
  }

  let originalInt = int

  for (let i = 0; i < length; i++) {
    rem = isNegative ? 255 - (int % 256) : int % 256

    s = String.fromCharCode(rem) + s
    int = Math.floor(int / 256)
  }

  if (int > 0) throw(`Argument out of range: ${originalInt}`)

  return s
}

// Read a big-endian encoded integer from the first Length bytes
// of the supplied string.
const bytesToInt = (s, length) => {
  let isNegative = s.charCodeAt(0) > 128
  let num = 0

  for (let i = 0; i < length; i++) {
    let n = isNegative ? 255 - s.charCodeAt(i) : s.charCodeAt(i)

    num = num === 0 ? n : num * 256 + n
  }

  if (isNegative) num = -num - 1

  return num
}

// Encode an integer into an Erlang bignum,
// which is a byte of 1 or 0 representing
// whether the number is negative or positive,
// followed by little-endian bytes.
const bignumToBytes = int => {
  let s = ''
  let isNegative = int < 0

  if (isNegative) {
    int *= -1
    s += String.fromCharCode(1)
  } else {
    s += String.fromCharCode(0)
  }

  while (int !== 0) {
    let rem = int % 256
    s += String.fromCharCode(rem)
    int = Math.floor(int / 256)
  }

  return s
}

// Encode a list of bytes into an Erlang bignum.
const bytesToBignum = (s, count) => {
  let num = 0
  s = s.substring(1)

  for (i = count - 1; i >= 0; i--) {
    let n = s.charCodeAt(i)

    num = num === 0 ? n : num * 256 + n
  }

  if (s.charCodeAt(0) === 1) return num * -1

  return num
}

// Convert an array of bytes into a string.
const bytesToString = arr => arr.reduce((acc, curr) => acc + String.fromCharCode(curr), '')

// Pretty Print a byte-string in Erlang binary form.
const ppBytes = bin => bin.split('').map(c => c.charCodeAt(0)).join(', ')

const ppTerm = obj => obj.toString()

// Convert string of byes to an array
const binaryToList = str => {
  let ret = []

  for (let i = 0; i < str.length; i++) ret.push(str.charCodeAt(i))

  return ret
}

module.exports = {
  atom,
  tuple,
  charlist,
  encode,
  encodeString,
  encodeBoolean,
  encodeAtom,
  decodeSmallInteger,
  decodeInteger,
  encodeAssociativeArray,
  decode,
  encodeNumber,
  encodeFloat,
  encodeObject,
  encodeTuple,
  encodeArray,
  decodeAtom,
  decodeBig,
  decodeFloat,
  decodeString,
  decodeList,
  decodeTuple,
  decodeNil,
  binaryToList,
  ppBytes,
  ppTerm
}
