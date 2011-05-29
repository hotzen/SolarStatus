// http://stackoverflow.com/questions/221294/how-do-you-get-a-timestamp-in-javascript
// function timestamp() {
	// return Math.round(
		// ( (new Date()).getTime() - Date.UTC(1970,0,1) ) / 1000
	// );
// }

function xsd_datetime(ts) {
	var d = new Date(ts)
	
	var year  = new String( d.getFullYear()  )
	var month = new String( d.getMonth() + 1 )
	var days  = new String( d.getDate()      )
	
	if (month.length == 1)
		month = "0" + month
	
	if (days.length == 1)
		days = "0" + days
	
	var hours = new String( d.getHours()   )
	var mins  = new String( d.getMinutes() )
	var secs  = new String( d.getSeconds() )
	
	if (hours.length == 1)
		hours = "0" + hours
	
	if (mins.length == 1)
		mins = "0" + mins
		
	if (secs.length == 1)
		secs = "0" + secs
		
	var date = year  + "-" + month + "-" + days
	var time = hours + ":" + mins  + ":" + secs
	
	return date + "T" + time + "Z" // TODO: proper timezone/utc handling
}

function datetime(ts) {
	var d = new Date(ts)
	
	var date = d.getFullYear() + "." + (d.getMonth() + 1) + "." + d.getDate()
	var time = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds()
	
	return date + " " + time
}