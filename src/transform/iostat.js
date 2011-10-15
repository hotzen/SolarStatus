// http://download.oracle.com/docs/cd/E19963-01/html/821-1462/iostat-1m.html
function solar_transform_iostat(targetElem, data, cmd) {
	var tbl = new TableTransformer()

	tbl.ignore("extended device statistics")
	
	tbl.col("device",	"name of the disk")
	tbl.col("r/s",		"reads per second")
	tbl.col("w/s",		"writes per second")
	tbl.col("kr/s",		"kilobytes read per second")
	tbl.col("kw/s",		"kilobytes written per second")
	
	tbl.col("wait",		"average number of transactions waiting for service (queue length). This is the number of I/O operations held in the device driver queue waiting for acceptance by the device.")
	tbl.col("actv",		"average number of transactions actively being serviced (removed from the queue but not yet completed). This is the number of I/O operations accepted, but not yet serviced, by the device.")
	
	tbl.col("svc_t",	"average response time of transactions, in milliseconds")
	
	tbl.col("%w",		"percent of time there are transactions waiting for service (queue non-empty)")
	tbl.col("%b",		"percent of time the disk is busy (transactions in progress)")
	
	tbl.col("wsvc_t",	"average service time in wait queue, in milliseconds")
	tbl.col("asvc_t",	"average service time of active transactions, in milliseconds")
	
	tbl.col("wt",		"the I/O wait time is no longer calculated as a percentage of CPU time, and this statistic will always return zero")

	tbl.transform(data, targetElem)
	
	return "Table"
}