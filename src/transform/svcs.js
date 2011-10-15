function solar_transform_svcs(targetElem, data, cmd) {
	var tbl = new TableTransformer()

	tbl.col("STATE",			"The state of the service instance")
	tbl.col("STIME",			"If the service instance entered the current state within the last 24 hours," +
									"this column indicates the time that it did so.\n" +
									"Otherwise, this column indicates the date on which it did so")
	tbl.col("FMRI",			"fault management resource identifier")
	
	tbl.transform(data, targetElem)
	
	return "Table"
}