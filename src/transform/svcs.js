function solar_transform_svcs(elem, cmd, rc, out) {
	var tbl = new TableTransformer()

	tbl.header("STATE",	"The state of the service instance")
	tbl.header("STIME",	"If the service instance entered the current state within the last 24 hours," +
						"this column indicates the time that it did so.\n" +
						"Otherwise, this column indicates the date on which it did so")
	tbl.header("FMRI", "fault management resource identifier")
	
	tbl.create(out, elem)
	
	return "Table"
}