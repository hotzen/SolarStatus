solstat.overview("zpool_status", function(cmd, rc, lines, addResult, done) {
//function solar_overview_zpool_status(rows) {
	var data = lines.join("\n").toLowerCase()
	var $elem;
	
	if (data.indexOf("all pools are healthy") != -1) {
		$elem = $("<span>All pools are healthy</span>")
	} else {
		$elem = $("<span></span>")
		$("<span>Failures, please check!</span>").addClass("warn").appendTo($elem)
		$("<pre></pre>").text( data ).appendTo($elem)
	}

	addResult("ZFS Pool Status", $elem)
	done()
})