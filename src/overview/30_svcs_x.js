SolarStatus.overview("svcs_x", function(cmd, rc, lines, createOverview, done) {
//function solar_overview_svcs_x(rows) {
	var out = lines.join("")
	var $span;
	
	if (out.length == 0) {
		$span = $("<span></span>").text("Everything up and operational")
	} else {
		$span = $("<span></span>").text("Failures, please check!").
			css("background-color", "red").
			css("font-weight", "bold").
			css("padding", "2px")
	}
	
	createOverview("Services", $span)
	done()
})