function solar_overview_top(rows) {
	var res = []	
	
	for (var i=7; i<rows.length; i++) { // skip first 7 lines
		var row = rows[i]
		var cols = row.splitBlanks()
		
		var ps = cols.slice(10).join(" ")
		var cpuTime = cols[8]
		var cpuLoad = cols[9]
		
		$span = $("<span></span>")
		$span.append( $("<span class=\"overview-top-ps\"></span>").css("padding-right", "1em").css("font-family", "monospace").text(ps) )
		$span.append( $("<span class=\"overview-top-cpu-load\"></span>").css("padding-right", "0.5em").text(cpuLoad) )
		$span.append( $("<span>(CPU-Time: </span>"))
		$span.append( $("<span class=\"overview-top-cpu-time\"></span>").text(cpuTime) )
		$span.append( $("<span> mins)</span>"))
		
		res.push( ["Top Process", $span] )
		break;
	}
	
	return res
}