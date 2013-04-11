if (typeof(console) === 'undefined') {
    var console = {}
    var noLogger = function() {};
	console.log   = console.error   = console.info   = console.debug   = console.warn     = noLogger
	console.trace = console.dir     = console.dirxml = console.group   = console.groupEnd = noLogger
	console.time  = console.timeEnd = console.assert = console.profile                    = noLogger
}

if (!String.prototype.trim) {
	String.prototype.trim = function() {
		return this.replace(/^\s+/, "").replace(/\s+$/, "");
	}
}

if (!String.prototype.splitWhitespace) {
	String.prototype.splitWhitespace = function() {
		return this.trim().split(/\s+/);
	}
}
if (!String.prototype.splitBlanks) { // @deprecated(use splitWhitespace instead)
	String.prototype.splitBlanks = String.prototype.splitWhitespace;
}

if (!String.prototype.splitLines) {
	String.prototype.splitLines = function() {
		return this.split(/[\r\n|\r|\n]/);
	}
}

if (!String.prototype.replaceEntities) {
	String.prototype.replaceEntities = function() {
		return this.replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}
}

if (!Array.prototype.last) {
	Array.prototype.last = function() {
		return (this.length > 0) ? this[this.length - 1] : null;
	}
}

function dump(x, s) {
	var indent = indent || '';
	var s = '';
	if (x === null) {
	  s = 'NULL';
	} else if (Array.isArray(x)) {
		s = '[';
		for (var i=0; i<x.length; i++) {
			s += dump(x[i], indent)
			if (i < x.length-1) s += ', ';
		}
		s += ']';
	} else switch(typeof x) {
		case 'undefined':
			s = 'UNDEFINED';
			break;
		case 'object':
			s = "{ ";
			var first = true;
			for (var p in x) {
				if (!first) s += indent + '  ';
				s += p + ': ';
				s += dump(x[p], indent + '  ');
				s += "\n"
				first = false;
			}
			s += '}';
			break;
		case 'function':
			s = '<FUNCTION>';
			break;
		case 'boolean':
			s = (x) ? 'TRUE' : 'FALSE';
			break;
		case 'string':
			s = '"' + x + '"';
			break;
		case 'number':
		default:
			s += x;
			break;
	}
	return s;
}

// simple 6-hexdigits unique'ish ID
function uid() {
	return (Math.floor(Math.random()*0x1000000)+1).toString(16);
}

function dateTimeXSD(ts, dateSep, timeSep) {
	var dateSep = dateSep || "-";
	var timeSep = timeSep || ":";
	var props = dateTimePropsText(ts);
	return props.year  + dateSep + props.month + dateSep + props.days + "T" +
	       props.hours + timeSep + props.mins  + timeSep + props.secs + "Z" // TODO proper TimeZone, now just defaults to Zulu/UTC
}

function dateTimeText(ts, dateTimeSep) {
	var dateTimeSep = dateTimeSep || " "
	var d = new Date(ts)
	return d.toLocaleDateString() + dateTimeSep + d.toLocaleTimeString()
}

function dateTimeProps(ts) {
	var d = new Date(ts)
	return {
		  year:  d.getFullYear()
		, month: d.getMonth() + 1
		, days:  d.getDate()
		, hours: d.getHours()
		, mins:  d.getMinutes()
		, secs:  d.getSeconds()
	}
}

function dateTimePropsText(ts) {
	var props = dateTimeProps(ts);
	var formatted = {}
	for (var p in props) {
		var v = new String( props[p] );
		if (v.length == 1)
			v = "0" + v
		formatted[p] = v
	}
	return formatted;
}

var UNITS = {
	order: ["K", "M", "G", "T", "P", "E", "Z"],
	K: 3, // 10^3
	M: 6,
	G: 9,
	T: 12,
	P: 15,
	E: 18,
	Z: 21
}

// [x, xUnit, y, yUnit] => [x', y', SameUnit]
function alignUnits(aNum, aUnit, bNum, bUnit) {
	if (!UNITS[aUnit])
		throw new Error("invalid unit '" + aUnit + "'")
	if (!UNITS[bUnit])
		throw new Error("invalid unit '" + bUnit + "'")

	var diff = UNITS[aUnit] - UNITS[bUnit]
  
	if (diff < 0) {
		var factor = Math.pow(10, diff*-1)
		return [aNum, bNum * factor, aUnit];
	} else if (diff > 0) {
		var factor = Math.pow(10, diff)
		return [aNum * factor, bNum, bUnit];
	} else {
		return [aNum, bNum, aUnit];
	}
}

function convertUnit(num, fromUnit, toUnit) {
	if (!UNITS[fromUnit])
		throw new Error("invalid unit '" + fromUnit + "'");
	if (!UNITS[toUnit])
		throw new Error("invalid unit '" + toUnit + "'");

	var diff = UNITS[fromUnit] - UNITS[toUnit]
	var factor = Math.pow(10, diff)
	return num * factor;
}

function greaterUnit(unit) {
	for (var i=0; i<UNITS.order.length; i++)
		if (UNITS.order[i] == unit)
			return UNITS.order[i+1];
	return unit;
}

// TODO: make me cleaner!
// [x, uUit] => [x', NewUnit]
function convertToGreatestUnit(num, unit) {
	if (!UNITS[unit])
		throw new Error("invalid unit '" + unit + "'");
	while (num > 1000) {
		var greater = greaterUnit(unit)
		if (unit == greater) break
		num = convertUnit(num, unit, greater)
		unit = greater
	}
	return [num, unit];
}