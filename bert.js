// BERT-JS
// Copyright (c) 2009 Rusty Klophaus (@rklophaus)
// Contributions by Ben Browning (@bbrowning)
// See MIT-LICENSE for licensing information.

// BERT-JS is a Javascript implementation of Binary Erlang Term Serialization.
// - http://github.com/rklophaus/BERT-JS
//
// References:
// - http://www.erlang-factory.com/upload/presentations/36/tom_preston_werner_erlectricity.pdf
// - http://www.erlang.org/doc/apps/erts/erl_ext_dist.html#8

class BERT {
  constructor() {
    super()
    this.BERT_START = String.fromCharCode(131);
  	this.SMALL_ATOM = String.fromCharCode(115);
  	this.ATOM = String.fromCharCode(100);
  	this.BINARY = String.fromCharCode(109);
  	this.SMALL_INTEGER = String.fromCharCode(97);
  	this.INTEGER = String.fromCharCode(98);
  	this.SMALL_BIG = String.fromCharCode(110);
  	this.LARGE_BIG = String.fromCharCode(111);
  	this.FLOAT = String.fromCharCode(99);
  	this.STRING = String.fromCharCode(107);
  	this.LIST = String.fromCharCode(108);
  	this.SMALL_TUPLE = String.fromCharCode(104);
  	this.LARGE_TUPLE = String.fromCharCode(105);
  	this.NIL = String.fromCharCode(106);
  	this.ZERO = String.fromCharCode(0);
    this.ZERO_CHAR = String.fromCharCode(48);
  }

  atom(obj) {
    this.type = 'Atom'
    this.value = obj
    this.toString = () => obj
  }

  binary(obj) {
    this.type = 'Binary'
    this.value = obj
    this.toString = () => `<<"${obj}">>`
  }

  tuple(arr) {
    this.type = 'Tuple'
    this.length = arr.length
    this.value = arr

    this.toString = () => `{${arr.join(", ")}}`
  }

  encode(obj) {
    return this.BERT_START + this.encode_inner(obj)
  }

  encode_inner(obj) {
    if (obj === undefined) throw new Error("Cannot encode undefined values.")
  	var func = 'encode_' + typeof(obj)
	  return this[func](obj)
  }

  decode(s) {
    if (S[0] !== this.BERT_START) throw ("Not a valid BERT.")

    const obj = this.decode_inner(s.substring(1))

    if (obj.rest !== "") throw ("Invalid BERT.")

    return obj.value
  }

  encode_string(obj) {
    return this.STRING + this.int_to_bytes(obj.length, 2) + obj
  }

  encode_boolean(obj) {
    if (obj) {
      return this.encode_inner(this.tuple(this.atom("bert"), this.atom("true")))
    } else {
      return this.encode_inner(this.tuple(this.atom("bert"), this.atom("false")))
    }
  }

  encode_number(obj) {
    const isInteger = obj % 1 === 0

    // Float
    if (!isInteger) return this.encode_float(obj)

    // Small int
    if (isInteger && obj >= 0 && obj <= 256) return this.SMALL_INTEGER + this.int_to_bytes(obj, 1)

    // 4 byte int
    if (isInteger && obj >= -134217728 && obj <= 134217727) return this.INTEGER + this.int_to_bytes(obj, 4)

    obj = this.bignum_to_bytes(obj)

    if (obj.length < 256) {
      return this.SMALL_BIG + this.int_to_bytes(obj.length - 1, 1) + obj
    } else {
      return this.LARGE_BIG + this.int_to_bytes(obj.length - 1, 4) + obj
    }
  }

  encode_float(obj) {
    obj = obj.toExponential(20)

    const match = /([^e]+)(e[+-])(\d+)/.exec(obj)
    let exponentialPart = match[3].length == 1 ? "0" + match[3] : match[3]

    s = match[1] + match[2] + exponentialPart

    s += this.ZERO.repeat(31 - s.length)

    return this.FLOAT + s
  }

  encode_object(obj) {
    if (obj === null) return this.encode_inner(this.atom("null"))

  	if (obj.type === "Atom") return this.encode_atom(Obj)

  	if (obj.type === "Binary") return this.encode_binary(Obj)

  	if (Obj.type === "Tuple") return this.encode_tuple(Obj)

  	// Check if it's an array...
  	if (Obj.constructor.toString().indexOf("Array") !== -1) return this.encode_array(Obj)

  	// Treat the object as an associative array...
  	return this.encode_associative_array(Obj);
  }

  encode_atom(obj) {
    return this.ATOM + this.int_to_bytes(obj.value.length, 2) + obj.value
  }

  encode_binary(obj) {
    return this.BINARY + this.int_to_bytes(obj.value.length, 4) + obj.value
  }

  encode_tuple(obj) {
    let s

    if (obj.length < 256) {
      s = this.SMALL_TUPLE + this.int_to_bytes(obj.length, 1)
    } else {
      s = this.LARGE_TUPLE + this.int_to_bytes(obj.length, 4)
    }

    return s + obj.reduce((acc, curr) => acc + this.encode_inner(curr), '')
  }

  encode_array(obj) {
    if (obj.length === 0) {
      return this.encode_inner(this.tuple(this.atom('bert'), this.atom('nil')))
    }

    let s = this.LIST + this.int_to_bytes(obj.length, 4)

    return s + obj.reduce((acc, curr) => acc + this.encode_inner(curr), '') + this.NIL
  }

  encode_associative_array(obj) {
    let arr = Object.keys(obj).map(k => this.tuple(this.atom(key), Obj[key]))
    return this.encode_array(arr)
  }

  decode_inner(s) {
    const type = s[0]

    s = s.substring(1)

    switch (type) {
  	case this.SMALL_ATOM:
  		return this.decode_atom(s, 1)
  	case this.ATOM:
  		return this.decode_atom(s, 2)
  	case this.BINARY:
  		return this.decode_binary(s)
  	case this.SMALL_INTEGER:
  		return this.decode_small_integer(s)
  	case this.INTEGER:
  		return this.decode_integer(s, 4)
  	case this.SMALL_BIG:
  		return this.decode_big(s, 1)
  	case this.LARGE_BIG:
  		return this.decode_big(s, 4)
  	case this.FLOAT:
  		return this.decode_float(s)
  	case this.STRING:
  		return this.decode_string(s)
  	case this.LIST:
  		return this.decode_list(s)
  	case this.SMALL_TUPLE:
  		return this.decode_tuple(s, 1)
  	case this.LARGE_TUPLE:
  		return this.decode_large_tuple(s, 4)
  	case this.NIL:
  		return this.decode_nil(s)
  	default:
  		throw ("Unexpected BERT type: " + s.charCodeAt(0))
  	}
  }

  decode_atom(s, count) {
    let size = this.bytes_to_int(s, count)

    s = s.substring(count)
    let value = s.substring(0, size)

    return { value: this.atom(value), rest: s.substring(size) }
  }

  decode_binary(s) {
    let size = this.bytes_to_int(s, 4)
    s = s.substring(4)

    return { value: this.binary(s.substring(0, size)), rest: s.substring(size) }
  }

  decode_small_integer(s) {
    let value = s.charCodeAt(0)

    return { value, rest: s.substring(1) }
  }

  decode_integer(s, count) {
    let value = this.bytes_to_int(s, count)

    return { value, rest: s.substring(count) }
  }

  decode_big(s, count) {
    let size = this.bytes_to_int(s, count)
    s = s.substring(count)

    value = this.bytes_to_bignum(s, size)

    return { value, rest: s.substring(size + 1) }
  }

  decode_float(s) {
    return { value: parseFloat(s.substring(0, 31)), rest: s.substring(31) }
  }

  decode_string(s) {
    let size = this.bytes_to_int(s, 2)

    s = s.substring(2)

    return { value: s.subtring(0, size), rest: s.substring(size) }
  }

  decode_list(s) {

  }
}



// - DECODING


BertClass.prototype.decode_list = function (S) {
	var Size, i, El, LastChar, Arr = [];
	Size = this.bytes_to_int(S, 4);
	S = S.substring(4);
	for (i = 0; i < Size; i++) {
		El = this.decode_inner(S);
		Arr.push(El.value);
		S = El.rest;
	}
	LastChar = S[0];
	if (LastChar !== this.NIL) {
		throw ("List does not end with NIL!");
	}
	S = S.substring(1);
	return {
		value: Arr,
		rest: S
	};
};

BertClass.prototype.decode_tuple = function (S, Count) {
	var Size, i, El, Arr = [];
	Size = this.bytes_to_int(S, Count);
	S = S.substring(Count);
	for (i = 0; i < Size; i++) {
		El = this.decode_inner(S);
		Arr.push(El.value);
		S = El.rest;
	}
	if (Size >= 2) {
		var Head = Arr[0];
		if (typeof Head === 'object' && Head.type === 'Atom'
		    && Head.value === "bert") {
			var Kind = Arr[1];
			if (typeof Kind !== 'object' || Kind.type !== 'Atom') {
				throw ("Invalid {bert, _} tuple!");
			}
			switch (Kind.value) {
			case "true":
				return {value: true, rest: S};
			case "false":
				return {value: false, rest: S};
			case "nil":
				return {value: [], rest: S};
			case "time":
			case "dict":
			case "regex":
				throw ("TODO: decode " + Kind.Value);
			default:
				throw ("Invalid {bert, " +
				    Kind.Value.toString() + "} tuple!");
			}
		}
	}
	return {
		value: this.tuple.apply(this,Arr),
		rest: S
	};
};

BertClass.prototype.decode_nil = function (S) {
	// nil is an empty list
	return {
		value: [],
		rest: S
	};
};



// - UTILITY FUNCTIONS -

// Encode an integer to a big-endian byte-string of length Length.
// Throw an exception if the integer is too large
// to fit into the specified number of bytes.
BertClass.prototype.int_to_bytes = function (Int, Length) {
	var isNegative, OriginalInt, i, Rem, s = "";
	isNegative = (Int < 0);
	if (isNegative) {
		Int = - Int - 1;
	}
	OriginalInt = Int;
	for (i = 0; i < Length; i++) {
		Rem = Int % 256;
		if (isNegative) {
			Rem = 255 - Rem;
		}
		s = String.fromCharCode(Rem) + s;
		Int = Math.floor(Int / 256);
	}
	if (Int > 0) {
		throw ("Argument out of range: " + OriginalInt);
	}
	return s;
};

// Read a big-endian encoded integer from the first Length bytes
// of the supplied string.
BertClass.prototype.bytes_to_int = function (S, Length) {
	var isNegative, i, n, Num = 0;
	isNegative = (S.charCodeAt(0) > 128);
	for (i = 0; i < Length; i++) {
		n = S.charCodeAt(i);
		if (isNegative) {
			n = 255 - n;
		}
		if (Num === 0) {
			Num = n;
		}
		else {
			Num = Num * 256 + n;
		}
	}
	if (isNegative) {
		Num = -Num - 1;
	}
	return Num;
};

// Encode an integer into an Erlang bignum,
// which is a byte of 1 or 0 representing
// whether the number is negative or positive,
// followed by little-endian bytes.
BertClass.prototype.bignum_to_bytes = function (Int) {
	var isNegative, Rem, s = "";
	isNegative = Int < 0;
	if (isNegative) {
		Int *= -1;
		s += String.fromCharCode(1);
	} else {
		s += String.fromCharCode(0);
	}

	while (Int !== 0) {
		Rem = Int % 256;
		s += String.fromCharCode(Rem);
		Int = Math.floor(Int / 256);
	}

	return s;
};

// Encode a list of bytes into an Erlang bignum.
BertClass.prototype.bytes_to_bignum = function (S, Count) {
	var isNegative, i, n, Num = 0;
	isNegative = (S.charCodeAt(0) === 1);
	S = S.substring(1);
	for (i = Count - 1; i >= 0; i--) {
		n = S.charCodeAt(i);
		if (Num === 0) {
			Num = n;
		}
		else {
			Num = Num * 256 + n;
		}
	}
	if (isNegative) {
		return Num * -1;
	}
	return Num;
};

// Convert an array of bytes into a string.
BertClass.prototype.bytes_to_string = function (Arr) {
	var i, s = "";
	for (i = 0; i < Arr.length; i++) {
		s += String.fromCharCode(Arr[i]);
	}
	return s;
};

// - TESTING -

// Pretty Print a byte-string in Erlang binary form.
BertClass.prototype.pp_bytes = function (Bin) {
	var i, s = "";
	for (i = 0; i < Bin.length; i++) {
		if (s !== "") {
			s += ",";
		}
		s += "" + Bin.charCodeAt(i);
	}
	return "<<" + s + ">>";
};

// Pretty Print a JS object in Erlang term form.
BertClass.prototype.pp_term = function (Obj) {
	return Obj.toString();
};

BertClass.prototype.binary_to_list = function (Str){
    var ret = [];
    for (var i = 0; i < Str.length; i++)
        ret.push(Str.charCodeAt(i));
    return ret;
};

module.exports = new BertClass();
