// http://download.oracle.com/docs/cd/E19963-01/html/821-1462/vmstat-1m.html
function solar_transform_vmstat(targetElem, data, cmd) {
	var tbl = new TableTransformer(data)
		
	tbl.ignore("kthr")
	tbl.ignore("memory")
	tbl.ignore("page")
	tbl.ignore("disk")
	tbl.ignore("faults")
	tbl.ignore("cpu")
		
	// kthr
	tbl.superCol("kthr", 	"number of kernel threads", ["r", "b", "w"])
	
	tbl.col("r",		"the number of kernel threads in run queue")
	tbl.col("b",		"the number of blocked kernel threads that are waiting for resources I/O, paging, and so forth")
	tbl.col("w",		"the number of swapped out lightweight processes (LWPs) that are waiting for processing resources to finish.")
	
	// memory
	tbl.col("swap",	"available swap space (Kbytes)")
	tbl.col("free",	"size of the free list (Kbytes)")
	
	// page
	tbl.col("re",		"page reclaims")
	tbl.col("mf",		"minor faults")
	tbl.col("pi",		"kilobytes paged in")
	tbl.col("po",		"kilobytes paged out")
	tbl.col("fr",		"kilobytes freed")
	tbl.col("de",		"anticipated short-term memory shortfall (Kbytes)")
	tbl.col("sr",		"pages scanned by clock algorithm")
	
	// disk, wildcard-style "s" instead of "s0", "s1", etc
	tbl.col("s",		"number of disk operations per second. There are slots for up to four disks, labeled with a single letter and number. The letter indicates the type of disk (s = SCSI, i = IPI, and so forth); the number is the logical unit number.")
	
	// faults
	tbl.col("in",		"interrupts")
	tbl.col("sy",		"system calls")
	tbl.col("cs",		"CPU context switches")
	
	// cpu
	tbl.col("us",		"user time")
	tbl.col("sy",		"system time")
	tbl.col("id",		"idle time")

	tbl.transform(data, targetElem)
	
	return "Table"
}