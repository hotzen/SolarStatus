function solar_transform_zpool_iostat(elem, cmd, rc, out) {
	var tbl = new TableTransformer()
	
	tbl.ignore("capacity")
	tbl.ignore("operations")
	tbl.ignore("bandwidth")
	tbl.ignore("-----")

	// http://docs.oracle.com/cd/E19253-01/819-5461/gammt/index.html
	tbl.header("pool", "ZFS Pool")
	
	// alloc capacity
	tbl.header("alloc", "The amount of data currently stored in the pool or device. This amount differs from the amount of disk space available to actual file systems by a small margin due to internal implementation details.", 1, "alloc cap")
	
	// free capacity
	tbl.header("free", "The amount of disk space available in the pool or device. As with the used statistic, this amount differs from the amount of disk space available to datasets by a small margin.", 2, "free cap")
	
	// read operations
	tbl.header("read", "The number of read I/O operations sent to the pool or device, including metadata requests.", 3, "read ops")
	
	// write operations
	tbl.header("write", "The number of write I/O operations sent to the pool or device.", 4, "write ops")

	//read bandwidth
	tbl.header("read", "The bandwidth of all read operations (including metadata), expressed as units per second.", 5, "read bw")

	//write bandwidth
	tbl.header("write", "The bandwidth of all write operations, expressed as units per second.", 6, "write bw")
	
	tbl.create(out, elem)
	
	return "Table"
}