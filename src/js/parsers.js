$(document).ready(function() {
	
	// http://download.oracle.com/docs/cd/E19963-01/html/821-1462/vmstat-1m.html
	$("#vmstat").bind('probe', function(evt, id, cmd, data, targetElem, callbackFn) { try {
		var tbl = new TableTransformer()
		
		tbl.defineNoise("kthr")
		tbl.defineNoise("memory")
		tbl.defineNoise("page")
		tbl.defineNoise("disk")
		tbl.defineNoise("faults")
		tbl.defineNoise("cpu")
			
		// kthr
		tbl.defineSuperCol("kthr", 	"number of kernel threads", ["r", "b", "w"])
		
		tbl.defineCol("r",		"the number of kernel threads in run queue")
		tbl.defineCol("b",		"the number of blocked kernel threads that are waiting for resources I/O, paging, and so forth")
		tbl.defineCol("w",		"the number of swapped out lightweight processes (LWPs) that are waiting for processing resources to finish.")
		
		// memory
		tbl.defineCol("swap",	"available swap space (Kbytes)")
		tbl.defineCol("free",	"size of the free list (Kbytes)")
		
		// page
		tbl.defineCol("re",		"page reclaims")
		tbl.defineCol("mf",		"minor faults")
		tbl.defineCol("pi",		"kilobytes paged in")
		tbl.defineCol("po",		"kilobytes paged out")
		tbl.defineCol("fr",		"kilobytes freed")
		tbl.defineCol("de",		"anticipated short-term memory shortfall (Kbytes)")
		tbl.defineCol("sr",		"pages scanned by clock algorithm")
		
		// disk, wildcard-style "s" instead of "s0", "s1", etc
		tbl.defineCol("s",		"number of disk operations per second. There are slots for up to four disks, labeled with a single letter and number. The letter indicates the type of disk (s = SCSI, i = IPI, and so forth); the number is the logical unit number.")
		
		// faults
		tbl.defineCol("in",		"interrupts")
		tbl.defineCol("sy",		"system calls")
		tbl.defineCol("cs",		"CPU context switches")
		
		// cpu
		tbl.defineCol("us",		"user time")
		tbl.defineCol("sy",		"system time")
		tbl.defineCol("id",		"idle time")

		tbl.transform(data, targetElem)
		callbackFn()
	} catch (e) { }})
	
	// http://download.oracle.com/docs/cd/E19963-01/html/821-1462/mpstat-1m.html
	$("#mpstat").bind('probe', function(evt, id, cmd, data, targetElem, callbackFn) { try {
		var tbl = new TableTransformer()

		tbl.defineCol("CPU",		"processor ID")
		tbl.defineCol("SET",		"processor set ID")
		tbl.defineCol("minf",		"minor faults")
		tbl.defineCol("mjf",		"major faults")
		tbl.defineCol("xcal",		"inter-processor cross-calls")
		tbl.defineCol("intr",		"interrupts")
		tbl.defineCol("ithr",		"interrupts as threads (not counting clock interrupt)")
		tbl.defineCol("csw",		"context switches")
		tbl.defineCol("icsw",		"involuntary context switches")
		tbl.defineCol("migr",		"thread migrations (to another processor)")
		tbl.defineCol("smtx",		"spins on mutexes (lock not acquired on first try)")
		tbl.defineCol("srw",		"spins on readers/writer locks (lock not acquired on first try)")
		tbl.defineCol("syscl",		"system calls")
		tbl.defineCol("usr",		"percent user time")
		tbl.defineCol("sys",		"percent system time")
		tbl.defineCol("wt",			"the I/O wait time is no longer calculated as a percentage of CPU time, and this statistic will always return zero.")
		tbl.defineCol("idl",		"percent idle time")
		tbl.defineCol("sze",		"number of processors in the requested processor set")
		tbl.defineCol("set",		"processor set membership of each CPU")

		tbl.transform(data, targetElem)
		callbackFn()
	} catch (e) { }})
	
	// http://download.oracle.com/docs/cd/E19963-01/html/821-1462/iostat-1m.html
	$("#iostat").bind('probe', function(evt, id, cmd, data, targetElem, callbackFn) { try {
		var tbl = new TableTransformer()

		tbl.defineNoise("extended device statistics")
		
		tbl.defineCol("device",		"name of the disk")
		tbl.defineCol("r/s",		"reads per second")
		tbl.defineCol("w/s",		"writes per second")
		tbl.defineCol("kr/s",		"kilobytes read per second")
		tbl.defineCol("kw/s",		"kilobytes written per second")
		
		tbl.defineCol("wait",		"average number of transactions waiting for service (queue length). This is the number of I/O operations held in the device driver queue waiting for acceptance by the device.")
		tbl.defineCol("actv",		"average number of transactions actively being serviced (removed from the queue but not yet completed). This is the number of I/O operations accepted, but not yet serviced, by the device.")
		
		tbl.defineCol("svc_t",		"average response time of transactions, in milliseconds")
		
		tbl.defineCol("%w",			"percent of time there are transactions waiting for service (queue non-empty)")
		tbl.defineCol("%b",			"percent of time the disk is busy (transactions in progress)")
		
		tbl.defineCol("wsvc_t",		"average service time in wait queue, in milliseconds")
		tbl.defineCol("asvc_t",		"average service time of active transactions, in milliseconds")
		
		tbl.defineCol("wt",			"the I/O wait time is no longer calculated as a percentage of CPU time, and this statistic will always return zero")

		tbl.transform(data, targetElem)
		callbackFn()
	} catch (e) { }})

	$("#nicstat").bind('probe', function(evt, id, cmd, data, targetElem, callbackFn) { try {
		var tbl = new TableTransformer()
		
		tbl.defineCol("Time",		"Time")
		tbl.defineCol("Int",		"Interface")
		tbl.defineCol("rKb/s",		"read Kbytes/s")
		tbl.defineCol("wKb/s",		"write Kbytes/s")
		tbl.defineCol("rPk/s",		"read Packets/s")
		tbl.defineCol("wPk/s",		"write Packets/s")
		tbl.defineCol("rAvs",		"read Average size, bytes")
		tbl.defineCol("wAvs",		"write Average size, bytes")
		tbl.defineCol("%Util",		"%Utilisation (r+w/ifspeed)")
		tbl.defineCol("Sat",		"Saturation (defer, nocanput, norecvbuf, noxmtbuf)")
		
		tbl.transform(data, targetElem)
		callbackFn()
	} catch (e) { }})

	$("#zpool_iostat").bind('probe', function(evt, id, cmd, data, targetElem, callbackFn) { try {
		var tbl = new TableTransformer()
		
		tbl.defineNoise("capacity")
		tbl.defineNoise("operations")
		tbl.defineNoise("bandwidth")
		tbl.defineNoise("-----")

		tbl.defineCol("pool",		"ZFS Pool")
		
		tbl.defineCol("alloc",		"capacity: allocated")
		tbl.defineCol("free",		"capacity: free")
		
		tbl.defineCol("read",		"TODO")
		tbl.defineCol("write",		"TODO")
		
		//TODO: operations: read/write vs. bandwidth: read/write

		tbl.transform(data, targetElem)
		callbackFn()
	} catch (e) { }})
	
	$("#zfs").bind('probe', function(evt, id, cmd, data, targetElem, callbackFn) { try {
		var tbl = new TableTransformer()

		tbl.defineCol("NAME",			"ZFS filesystem")
		tbl.defineCol("USED",			"capacity: used")
		tbl.defineCol("AVAIL",			"capacity: available")
		tbl.defineCol("MOUNTPOINT",		"mount-point of filesystem, if mounted")
		tbl.defineCol("SHARESMB",		"shared through SMB")
		tbl.defineCol("SHARENFS",		"shared through NFS")

		tbl.transform(data, targetElem)
		callbackFn()
	} catch (e) { }})
	
	$("#ps").bind('probe', function(evt, id, cmd, data, targetElem, callbackFn) { try {
		var tbl = new TableTransformer()

		tbl.defineCol("PID",		"The decimal value of the process ID")
		tbl.defineCol("USER",		"The effective user ID of the process")
		
		tbl.defineCol("S",			"The state of the process:\n" +
									"O - Process is running on a processor\n" +
									"S - Sleeping: process is waiting for an event to complete\n" +
									"R - Runnable: process is on run queue\n" +
									"T - Process is stopped, either by a job control signal or because it is being traced\n" +
									"W - Waiting: process is waiting for CPU usage to drop to the CPU-caps enforced limits\n" +
									"Z - Zombie state: process terminated and parent not waiting")

		tbl.defineCol("%CPU",		"The ratio of CPU time used recently to CPU time available in the same period, expressed as a percentage")
		tbl.defineCol("%MEM",		"The ratio of the process's resident set size to the physical memory on the machine, expressed as a percentage")
		tbl.defineCol("VSZ",		"The total size of the process in virtual memory, in kilobytes")
		
		tbl.defineCol("STIME",		"The starting time or date of the process, printed with no blanks")
		tbl.defineCol("COMMAND",	"The name of the command being executed")

		tbl.transform(data, targetElem)
		callbackFn()
	} catch (e) { }})
	
	$("#svcs").bind('probe', function(evt, id, cmd, data, targetElem, callbackFn) { try {
		var tbl = new TableTransformer()

		tbl.defineCol("STATE",			"The state of the service instance")
		tbl.defineCol("STIME",			"If the service instance entered the current state within the last 24 hours," +
										"this column indicates the time that it did so.\n" +
										"Otherwise, this column indicates the date on which it did so")
		tbl.defineCol("FMRI",			"fault management resource identifier")
		
		tbl.transform(data, targetElem)
		callbackFn()
	} catch (e) { }})
	
	$("#prstat").bind('probe', function(evt, id, cmd, data, targetElem, callbackFn) { try {
		var tbl = new TableTransformer()

		tbl.defineCol("PID",			"The process ID of the process")
		tbl.defineCol("USERNAME",		" The real user (login) name or real user ID")
		tbl.defineCol("SIZE",			"asdf")
		tbl.defineCol("RSS",			"The resident set size of the process (RSS), in kilobytes (K), megabytes (M), or gigabytes (G).\n" +
										"The RSS value is an estimate provided by proc(4) that might underestimate the actual resident set size.\n" +
										"Users who want to get more accurate usage information for capacity planning should use the -x option to pmap(1) instead")
		tbl.defineCol("STATE",			"The state of the process:\n" +
										"cpuN - Process is running on CPU N.\n" +
										"sleep - Sleeping: process is waiting for an event to complete.\n" + 
										"wait - Waiting: process is waiting for CPU usage to drop to the CPU-caps enforced limits.\n" +
										"run - Runnable: process in on run queue.\n" +
										"zombie - Zombie state: process terminated and parent not waiting.\n" +
										"stop - Process is stopped.")
		tbl.defineCol("PRI",			"The priority of the process. Larger numbers mean higher priority")
		tbl.defineCol("NICE",			"Nice value used in priority computation. Only processes in certain scheduling classes have a nice value")
		tbl.defineCol("TIME",			"The cumulative execution time for the process")
		tbl.defineCol("CPU",			"The percentage of recent CPU time used by the process.")
		tbl.defineCol("PROCESS/NLWP",	"The name of the process / The number of lwps in the process")
		
		tbl.defineCol("NPROC",			"Number of processes in a specified collection")
		tbl.defineCol("SWAP",			"The total virtual memory size of the process," +
										"including all mapped files and devices, in kilobytes (K), mega- bytes (M), or gigabytes (G).")
		tbl.defineCol("MEMORY",			"Percentage of memory used by a specified collection of processes")
		
		tbl.defineFooter("Total:")
		
		tbl.transform(data, targetElem)
		callbackFn()
	} catch (e) { }})
})