// CPU minf mjf xcal  intr ithr  csw icsw migr smtx  srw syscl  usr sys  wt idl
//   0    1   0    0   315  113  110    0   23    2    0    15    0   0   0 100
//   1    1   0    0   178   59  205    0   23    1    0    11    0   0   0 100
// CPU minf mjf xcal  intr ithr  csw icsw migr smtx  srw syscl  usr sys  wt idl
//   0  899   0   46   311  108  115    3   26    4    0   641    1   2   0  97
//   1  325   0    0   229   57  212    3   30    2    0   980    1   1   0  98
// <EMPTY>
function solar_overview_mpstat(rows) {
	var numCores = (rows.length - 3) / 2
	var startIdx = numCores + 2
	
	console.log(["solar_overview_mpstat", rows])
	
	var res = []
	
	for (c=0; c<numCores; c++) {
		var coreNum  = c + 1
		var coreIdx  = startIdx + c
		var coreData = rows[coreIdx]
		
		console.log(["coreNum", coreNum, "coreIdx", coreIdx, "coreData", coreData])
		
		var cols = coreData.splitBlanks()
		
		var idle = parseInt( cols.last() )
		var load = 100 - idle
		
		var lbl  = "Core #"+coreNum
		var desc = "Load of Core #"+coreNum+": "+load+"%"
		
		var $meter = $("<meter></meter>").attr("min", 0).attr("max", 100).attr("value", load)
		$meter.attr("title", desc).text(desc)
		$meter.css("background-color", "#00A67C").css("color", "#FF5F00")

		res.push([lbl, $meter])
	}
	return res
}