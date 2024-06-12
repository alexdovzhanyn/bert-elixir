const Bert = require('../index.js')

describe('bert', () => {
  it ('can encode an atom', () => {
    const encodedAtom = Bert.encode(Bert.atom('myAtom'))
    const binaryAtom = Bert.binaryToList(encodedAtom)

    expect(binaryAtom).toEqual([131, 100, 0, 6, 109, 121, 65, 116, 111, 109])
  })

  it ('can decode a tuple', () => {
    // decode this tuple...
    // const tuple = Bert.tuple(
    //   Bert.atom('myAtom'),
    //   1
    // );

    const binaryTuple = [ 131, 104, 2, 100, 0, 6, 109, 121, 65, 116, 111, 109, 97, 1 ];
    const decodedTuple = Bert.decode(binaryTuple.map(x => String.fromCharCode(x)).join(''));
    expect(decodedTuple.type).toEqual('Tuple')
    expect(decodedTuple.length).toEqual(2)
    expect(decodedTuple.value[0].type).toEqual('Atom')
    expect(decodedTuple.value[0].value).toEqual('myAtom')
    expect(decodedTuple.value[1]).toEqual(1)
  })

  it('can encode a charlist', () => {
    const encodedCharlist = Bert.encode(Bert.charlist('this is going to be a charlist'))
    const binaryCharlist = Bert.binaryToList(encodedCharlist)

    expect(binaryCharlist).toEqual([131, 107, 0, 30, 116, 104, 105, 115, 32, 105, 115, 32, 103, 111, 105, 110, 103, 32, 116, 111, 32, 98, 101, 32, 97, 32, 99, 104, 97, 114, 108, 105, 115, 116])
  })

  it('can encode a string', () => {
    const encodedString = Bert.encode('this is going to be a string')
    const binaryString = Bert.binaryToList(encodedString)

    expect(binaryString).toEqual([131, 109, 0, 0, 0, 28, 116, 104, 105, 115, 32, 105, 115, 32, 103, 111, 105, 110, 103, 32, 116, 111, 32, 98, 101, 32, 97, 32, 115, 116, 114, 105, 110, 103])
  })

  it('can encode a boolean', () => {
    const encodedBooleanTrue = Bert.encode(true)
    const encodedBooleanFalse = Bert.encode(false)
    const binaryBooleanTrue = Bert.binaryToList(encodedBooleanTrue)
    const binaryBooleanFalse = Bert.binaryToList(encodedBooleanFalse)

    expect(binaryBooleanTrue).toEqual([131, 100, 0, 4, 116, 114, 117, 101])
    expect(binaryBooleanFalse).toEqual([131, 100, 0, 5, 102, 97, 108, 115, 101])
  })

  it('can encode a small integer', () => {
    const encodedSmallInteger = Bert.encode(4)
    const binarySmallInteger = Bert.binaryToList(encodedSmallInteger)

    expect(binarySmallInteger).toEqual([131, 97, 4])
  })

  it('can encode an integer', () => {
    const encodedInteger = Bert.encode(256)
    const binaryInteger = Bert.binaryToList(encodedInteger)

    expect(binaryInteger).toEqual([131, 98, 0, 0, 1, 0])
  })

  it('can encode a small big', () => {
    const encodedSmallBig = Bert.encode(13421772799)
    const binarySmallBig = Bert.binaryToList(encodedSmallBig)

    expect(binarySmallBig).toEqual([131, 110, 5, 0, 255, 255, 255, 31, 3])
  })

  it('can encode a large big', () => {
    const encodedLargeBig = Bert.encode(1.0715086071862673e+301)
    const binaryLargeBig = Bert.binaryToList(encodedLargeBig)

    //expect(binaryLargeBig).toEqual([])
  })

  it('can encode a float', () => {
    const encodedFloat = Bert.encode(45.2)
    const binaryFloat = Bert.binaryToList(encodedFloat)

    expect(binaryFloat).toEqual([
      131, 99, 52, 46, 53, 50, 48, 48, 48, 48, 48, 48, 48, 48,
      48, 48, 48, 48, 48, 50, 56, 52, 50, 50, 101, 43, 48, 49,
      0, 0, 0, 0, 0, 0
    ])
  })
})
