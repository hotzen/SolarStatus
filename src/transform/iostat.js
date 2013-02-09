// http://download.oracle.com/docs/cd/E19963-01/html/821-1462/iostat-1m.html
function solar_transform_iostat(elem, cmd, rc, out) {
	var tbl = new TableTransformer()

	tbl.ignore("extended device statistics")
	
	tbl.header("device", "name of the disk")
	tbl.header("r/s", "reads per second")
	tbl.header("w/s", "writes per second")
	tbl.header("kr/s", "kilobytes read per second")
	tbl.header("kw/s", "kilobytes written per second")
	
	tbl.header("wait", "average number of transactions waiting for service (queue length). This is the number of I/O operations held in the device driver queue waiting for acceptance by the device.")
	tbl.header("actv", "average number of transactions actively being serviced (removed from the queue but not yet completed). This is the number of I/O operations accepted, but not yet serviced, by the device.")
	
	tbl.header("svc_t", "average response time of transactions, in milliseconds")
	
	tbl.header("%w", "percent of time there are transactions waiting for service (queue non-empty)")
	tbl.header("%b", "percent of time the disk is busy (transactions in progress)")
	
	tbl.header("wsvc_t", "average service time in wait queue, in milliseconds")
	tbl.header("asvc_t", "average service time of active transactions, in milliseconds")
	
	tbl.header("wt", "the I/O wait time is no longer calculated as a percentage of CPU time, and this statistic will always return zero")

	tbl.create(out, elem)
	
	return "Table"
}