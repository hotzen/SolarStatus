function solar_transform_zpool_iostat(targetElem, data, cmd) {
	var tbl = new TableTransformer()
		
	tbl.ignore("capacity")
	tbl.ignore("operations")
	tbl.ignore("bandwidth")
	tbl.ignore("-----")

	tbl.col("pool",		"ZFS Pool")
	
	tbl.col("alloc",		"capacity: allocated")
	tbl.col("free",		"capacity: free")
	
	tbl.col("read",		"TODO")
	tbl.col("write",		"TODO")
	
	//TODO: operations: read/write vs. bandwidth: read/write

	tbl.transform(data, targetElem)
	
	return "Table"
}