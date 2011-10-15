function solar_overview_svcs_x(rows) {
	var $span;
	
	if (rows.length == 0) {
		$span = $("<span></span>").text("Everything up and operational")
	} else {
		$span = $("<span></span>").text("Failures, please check!").css("background-color", "red")
	}
	
	return [ ["Services", $span] ]
}
