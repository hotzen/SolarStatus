SolarStatus.view("svcs", function(cmd, rc, out, createView, done) {
	var tbl = new TableTransformer()

	tbl.header("STATE",	"The state of the service instance")
	tbl.header("STIME",	"If the service instance entered the current state within the last 24 hours," +
						"this column indicates the time that it did so.\n" +
						"Otherwise, this column indicates the date on which it did so")
	tbl.header("FMRI", "fault management resource identifier")
	
	var elem = tbl.create(out)
	createView("Table", elem)
	done()
})