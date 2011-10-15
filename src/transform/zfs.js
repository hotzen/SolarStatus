function solar_transform_zfs(targetElem, data, cmd) {
	var tbl = new TableTransformer()
	
	tbl.col("NAME",			"ZFS filesystem")
	tbl.col("USED",			"capacity: used")
	tbl.col("AVAIL",		"capacity: available")
	tbl.col("MOUNTPOINT",	"mount-point of filesystem, if mounted")
	tbl.col("SHARESMB",		"shared through SMB")
	tbl.col("SHARENFS",		"shared through NFS")

	tbl.transform(data, targetElem)
	
	return "Table"
}