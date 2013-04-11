SolarStatus.view("prstat", function(cmd, rc, out, createView, done) {
	var tbl = new TableTransformer()

	tbl.header("PID", "The process ID of the process")
	tbl.header("USERNAME", " The real user (login) name or real user ID")
	tbl.header("SIZE", "asdf")
	tbl.header("RSS", "The resident set size of the process (RSS), in kilobytes (K), megabytes (M), or gigabytes (G).\n" +
						"The RSS value is an estimate provided by proc(4) that might underestimate the actual resident set size.\n" +
						"Users who want to get more accurate usage information for capacity planning should use the -x option to pmap(1) instead")
	tbl.header("STATE", "The state of the process:\n" +
						"cpuN - Process is running on CPU N.\n" +
						"sleep - Sleeping: process is waiting for an event to complete.\n" + 
						"wait - Waiting: process is waiting for CPU usage to drop to the CPU-caps enforced limits.\n" +
						"run - Runnable: process in on run queue.\n" +
						"zombie - Zombie state: process terminated and parent not waiting.\n" +
						"stop - Process is stopped.")
	tbl.header("PRI", "The priority of the process. Larger numbers mean higher priority")
	tbl.header("NICE", "Nice value used in priority computation. Only processes in certain scheduling classes have a nice value")
	tbl.header("TIME", "The cumulative execution time for the process")
	tbl.header("CPU", "The percentage of recent CPU time used by the process.")
	tbl.header("PROCESS/NLWP",	"The name of the process / The number of lwps in the process")
	
	tbl.header("NPROC", "Number of processes in a specified collection")
	tbl.header("SWAP", "The total virtual memory size of the process," +
						"including all mapped files and devices, in kilobytes (K), mega- bytes (M), or gigabytes (G).")
	tbl.header("MEMORY", "Percentage of memory used by a specified collection of processes")
	
	tbl.footer("Total:")
	
	var elem = tbl.create(out)
	createView("Table", elem)
	done()
})