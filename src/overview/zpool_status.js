function solar_overview_zpool_status(rows) {
	var data = rows.join(" ").toLowerCase()
	var $span;
		
	if (data.indexOf("all pools are healthy") != -1) {
		$span = $("<span></span>").text("All pools are healthy")
	} else {
		$span = $("<span></span>").text("Failures, please check!").css("background-color", "red")
	}
	
	return [ ["ZFS Pool Status", $span] ]
}