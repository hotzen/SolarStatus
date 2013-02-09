// http://download.oracle.com/docs/cd/E19963-01/html/821-1462/vmstat-1m.html
function solar_transform_vmstat(elem, cmd, rc, out) {
	var tbl = new TableTransformer()
		
	tbl.ignore("kthr")
	tbl.ignore("memory")
	tbl.ignore("page")
	tbl.ignore("disk")
	tbl.ignore("faults")
	tbl.ignore("cpu")
		
	// kthr
	tbl.superCol("kthr", "number of kernel threads", ["r", "b", "w"])
	
	tbl.header("r", "the number of kernel threads in run queue")
	tbl.header("b", "the number of blocked kernel threads that are waiting for resources I/O, paging, and so forth")
	tbl.header("w", "the number of swapped out lightweight processes (LWPs) that are waiting for processing resources to finish.")
	
	// memory
	tbl.header("swap",	"available swap space (Kbytes)")
	tbl.header("free",	"size of the free list (Kbytes)")
	
	// page
	tbl.header("re", "page reclaims")
	tbl.header("mf", "minor faults")
	tbl.header("pi", "kilobytes paged in")
	tbl.header("po", "kilobytes paged out")
	tbl.header("fr", "kilobytes freed")
	tbl.header("de", "anticipated short-term memory shortfall (Kbytes)")
	tbl.header("sr", "pages scanned by clock algorithm")
	
	// disk, wildcard-style "s" instead of "s0", "s1", etc
	tbl.header("s", "number of disk operations per second. There are slots for up to four disks, labeled with a single letter and number. The letter indicates the type of disk (s = SCSI, i = IPI, and so forth); the number is the logical unit number.")
	
	// faults
	tbl.header("in", "interrupts")
	tbl.header("sy", "system calls")
	tbl.header("cs", "CPU context switches")
	
	// cpu
	tbl.header("us", "user time")
	tbl.header("sy", "system time")
	tbl.header("id", "idle time")

	tbl.create(out, elem)
	
	return "Table"
}