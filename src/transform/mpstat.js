// http://download.oracle.com/docs/cd/E19963-01/html/821-1462/mpstat-1m.html
function solar_transform_mpstat(targetElem, data, cmd) {
	var tbl = new TableTransformer()

	tbl.col("CPU",		"processor ID")
	tbl.col("SET",		"processor set ID")
	tbl.col("minf",		"minor faults")
	tbl.col("mjf",		"major faults")
	tbl.col("xcal",		"inter-processor cross-calls")
	tbl.col("intr",		"interrupts")
	tbl.col("ithr",		"interrupts as threads (not counting clock interrupt)")
	tbl.col("csw",		"context switches")
	tbl.col("icsw",		"involuntary context switches")
	tbl.col("migr",		"thread migrations (to another processor)")
	tbl.col("smtx",		"spins on mutexes (lock not acquired on first try)")
	tbl.col("srw",		"spins on readers/writer locks (lock not acquired on first try)")
	tbl.col("syscl",		"system calls")
	tbl.col("usr",		"percent user time")
	tbl.col("sys",		"percent system time")
	tbl.col("wt",			"the I/O wait time is no longer calculated as a percentage of CPU time, and this statistic will always return zero.")
	tbl.col("idl",		"percent idle time")
	tbl.col("sze",		"number of processors in the requested processor set")
	tbl.col("set",		"processor set membership of each CPU")

	tbl.transform(data, targetElem)
	
	return "Table"
}