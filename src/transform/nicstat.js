function solar_transform_nicstat(targetElem, data, cmd) {
	var tbl = new TableTransformer()
		
	tbl.col("Time",		"Time")
	tbl.col("Int",		"Interface")
	tbl.col("rKb/s",		"read Kbytes/s")
	tbl.col("wKb/s",		"write Kbytes/s")
	tbl.col("rPk/s",		"read Packets/s")
	tbl.col("wPk/s",		"write Packets/s")
	tbl.col("rAvs",		"read Average size, bytes")
	tbl.col("wAvs",		"write Average size, bytes")
	tbl.col("%Util",		"%Utilisation (r+w/ifspeed)")
	tbl.col("Sat",		"Saturation (defer, nocanput, norecvbuf, noxmtbuf)")
	
	tbl.transform(data, targetElem)
	
	return "Table"
}