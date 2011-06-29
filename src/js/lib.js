// http://stackoverflow.com/questions/221294/how-do-you-get-a-timestamp-in-javascript
// function timestamp() {
	// return Math.round(
		// ( (new Date()).getTime() - Date.UTC(1970,0,1) ) / 1000
	// );
// }

String.prototype.replaceEntities = function() {
	return this.replace(/</g, "&lt;").replace(/>/g, "&gt;") // .replace(/"/g, "&quot;")
}

function dateTimeXSD(ts) {
	var DATE_SEP = "-";
	var TIME_SEP = ":";
	
	var comps = dateTimeStringComps(ts);

	return comps.year  + DATE_SEP + comps.month + DATE_SEP + comps.days + "T" +
	       comps.hours + TIME_SEP + comps.mins  + TIME_SEP + comps.secs + "Z" // TODO proper TimeZone
}

function dateTimeHuman(ts) {
	var DATE_SEP = ".";
	var TIME_SEP = ":";
	
	var comps = dateTimeStringComps(ts);

	return comps.year  + DATE_SEP + comps.month + DATE_SEP + comps.days + " " +
	       comps.hours + TIME_SEP + comps.mins  + TIME_SEP + comps.secs
}

function dateTimeComps(ts) {
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

function dateTimeStringComps(ts) {
	var comps    = dateTimeComps(ts);
	var strComps = {}
	
	for (var comp in comps) {
		var v = new String( comps[comp]  );
		if (v.length == 1)
			v = "0" + v
		strComps[comp] = v
	}
	return strComps
}