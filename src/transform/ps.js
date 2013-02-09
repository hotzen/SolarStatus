function solar_transform_ps(elem, cmd, rc, out) {
	var tbl = new TableTransformer()

	tbl.header("PID", "The decimal value of the process ID")
	tbl.header("USER", "The effective user ID of the process")
	
	tbl.header("S", "The state of the process:\n" +
					"O - Process is running on a processor\n" +
					"S - Sleeping: process is waiting for an event to complete\n" +
					"R - Runnable: process is on run queue\n" +
					"T - Process is stopped, either by a job control signal or because it is being traced\n" +
					"W - Waiting: process is waiting for CPU usage to drop to the CPU-caps enforced limits\n" +
					"Z - Zombie state: process terminated and parent not waiting")

					tbl.header("%CPU", "The ratio of CPU time used recently to CPU time available in the same period, expressed as a percentage")
	tbl.header("%MEM", "The ratio of the process's resident set size to the physical memory on the machine, expressed as a percentage")
	tbl.header("VSZ", "The total size of the process in virtual memory, in kilobytes")
	
	tbl.header("STIME", "The starting time or date of the process, printed with no blanks")
	tbl.header("COMMAND",	"The name of the command being executed")

	tbl.transform(data, elem)
	
	return "Table"
}