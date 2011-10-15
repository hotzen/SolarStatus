function solar_transform_prstat(targetElem, data, cmd) {
	var tbl = new TableTransformer()

	tbl.col("PID",			"The process ID of the process")
	tbl.col("USERNAME",		" The real user (login) name or real user ID")
	tbl.col("SIZE",			"asdf")
	tbl.col("RSS",			"The resident set size of the process (RSS), in kilobytes (K), megabytes (M), or gigabytes (G).\n" +
									"The RSS value is an estimate provided by proc(4) that might underestimate the actual resident set size.\n" +
									"Users who want to get more accurate usage information for capacity planning should use the -x option to pmap(1) instead")
	tbl.col("STATE",			"The state of the process:\n" +
									"cpuN - Process is running on CPU N.\n" +
									"sleep - Sleeping: process is waiting for an event to complete.\n" + 
									"wait - Waiting: process is waiting for CPU usage to drop to the CPU-caps enforced limits.\n" +
									"run - Runnable: process in on run queue.\n" +
									"zombie - Zombie state: process terminated and parent not waiting.\n" +
									"stop - Process is stopped.")
	tbl.col("PRI",			"The priority of the process. Larger numbers mean higher priority")
	tbl.col("NICE",			"Nice value used in priority computation. Only processes in certain scheduling classes have a nice value")
	tbl.col("TIME",			"The cumulative execution time for the process")
	tbl.col("CPU",			"The percentage of recent CPU time used by the process.")
	tbl.col("PROCESS/NLWP",	"The name of the process / The number of lwps in the process")
	
	tbl.col("NPROC",			"Number of processes in a specified collection")
	tbl.col("SWAP",			"The total virtual memory size of the process," +
									"including all mapped files and devices, in kilobytes (K), mega- bytes (M), or gigabytes (G).")
	tbl.col("MEMORY",			"Percentage of memory used by a specified collection of processes")
	
	tbl.footer("Total:")
	
	tbl.transform(data, targetElem)
	
	return "Table"
}