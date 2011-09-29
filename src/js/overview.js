function solov_probes() {
	return [
		  "mpstat"
		, "zfs"
		, "nicstat"
		, "svcs_x"
		, "zpool_status"
		, "top"
	]
}


// CPU minf mjf xcal  intr ithr  csw icsw migr smtx  srw syscl  usr sys  wt idl
//   0    1   0    0   315  113  110    0   23    2    0    15    0   0   0 100
//   1    1   0    0   178   59  205    0   23    1    0    11    0   0   0 100
// CPU minf mjf xcal  intr ithr  csw icsw migr smtx  srw syscl  usr sys  wt idl
//   0  899   0   46   311  108  115    3   26    4    0   641    1   2   0  97
//   1  325   0    0   229   57  212    3   30    2    0   980    1   1   0  98
function solov_process_mpstat(rows) {
	var numCores = (rows.length - 2) / 2
	var startIdx = numCores + 2
	
	var res = []
	
	for (c=0; c<numCores; c++) {
		var coreNum  = c + 1
		var coreIdx  = startIdx + c
		var coreData = rows[coreIdx]
		
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


// NAME                     USED  AVAIL  MOUNTPOINT           SHARESMB     SHARENFS    KEYSTATUS
// rpool1                  6.64G  12.9G  /rpool1              off          off              none
// rpool1/ROOT             2.51G  12.9G  legacy               off          off              none
// rpool1/ROOT/solaris     2.51G  12.9G  /                    off          off              none
// rpool1/export           9.03M  12.9G  /export              off          off              none
// rpool1/zones              31K  12.9G  /zones               off          off              none
// tank1                   1.67T  1.89T  /tank1               off          off              none
// tank1/temp               250K   100G  /tank1/temp          name=temp    off              none
function solov_process_zfs(rows) {
	var res = []
	
	for (var i=1; i<rows.length; i++) { // skip first line
		var firstSpace = rows[i].indexOf(" ")
		var firstTab   = rows[i].indexOf("\t")
		
		var firstPos = 0
		if (firstSpace < 0) 
			firstPos = firstTab
		else if (firstTab < 0)
			firstPos = firstSpace
		else if (firstSpace < firstTab)
			firstPos = firstSpace
		else
			firstPos = firstTab
		
		// crap data
		if ( firstPos < 0 )
			continue
		
		// not a pool
		if (rows[i].substring(0, firstPos).indexOf("/") > 0)
			continue
		
		var poolData = rows[i].splitBlanks()
		var poolName = poolData[0]
		
		var used  = poolData[1]
		var avail = poolData[2]
		
		var usedNum  = parseFloat( used.substr(0, used.length-1)   )
		var availNum = parseFloat( avail.substr(0, avail.length-1) )
		
		var usedUnit  = used.substr(used.length-1,1)
		var availUnit = avail.substr(avail.length-1,1)
		
		if (usedUnit != availUnit) {
			if (console && console.warn)
				console.warn(["solov_gen_zfs: different units in used vs. avail, aborting", used, avail])
			continue;
		}
		
		var capacity = (usedNum + availNum).toFixed(2)
		
		var lbl = "ZFS Pool " + poolName
		var $meter = $("<meter></meter").attr("title", "Used "+used+" of "+capacity+usedUnit).attr("min", 0).attr("max", capacity).attr("value", usedNum)
		
		res.push([lbl, $meter])
	}
	
	return res
}

function solov_process_svcs_x(rows) {
	var $span;
	
	if (rows.length == 0) {
		$span = $("<span></span>").text("Everything up and operational")
	} else {
		$span = $("<span></span>").text("Failures, please check!").css("background-color", "red")
	}
	
	return [ ["Services", $span] ]
}

function solov_process_zpool_status(rows) {
	var data = rows.join(" ").toLowerCase()
	var $span;
		
	if (data.indexOf("all pools are healthy") != -1) {
		$span = $("<span></span>").text("All pools are healthy")
	} else {
		$span = $("<span></span>").text("Failures, please check!").css("background-color", "red")
	}
	
	return [ ["ZFS Pool Status", $span] ]
}

function solov_process_top(rows) {
	var res = []	
	
	for (var i=7; i<rows.length; i++) { // skip first 7 lines
		var row = rows[i]
		var cols = row.splitBlanks()
		
		var ps = cols.slice(10).join(" ")
		var cpuTime = cols[8]
		var cpuLoad = cols[9]
		
		$span = $("<span></span>")
		$span.append( $("<span class=\"overview-top-ps\"></span>").css("padding-right", "1em").css("font-family", "monospace").text(ps) )
		$span.append( $("<span class=\"overview-top-cpu-load\"></span>").css("padding-right", "0.5em").text(cpuLoad) )
		$span.append( $("<span>(CPU-Time: </span>"))
		$span.append( $("<span class=\"overview-top-cpu-time\"></span>").text(cpuTime) )
		$span.append( $("<span> mins)</span>"))
		
		res.push( ["Top Process", $span] )
		break;
	}
	
	return res
}

//               capacity     operations    bandwidth
//pool        alloc   free   read  write   read  write
//----------  -----  -----  -----  -----  -----  -----
//rpool1      4.64G  15.2G      0      0    801   1001
//  c8t0d0s0  4.64G  15.2G      0      0    801   1001
//----------  -----  -----  -----  -----  -----  -----
//tank1       2.51T  2.93T      0      0  21.8K  5.51K
//  raidz1    2.51T  2.93T      0      0  21.8K  5.51K
//    c8t1d0      -      -      0      0  7.44K  3.32K
//    c8t2d0      -      -      0      0  6.66K  3.32K
//    c8t3d0      -      -      0      0  7.76K  3.32K
//----------  -----  -----  -----  -----  -----  -----
//
//               capacity     operations    bandwidth
//pool        alloc   free   read  write   read  write
//----------  -----  -----  -----  -----  -----  -----
//rpool1      4.64G  15.2G      0      0      0      0
//  c8t0d0s0  4.64G  15.2G      0      0      0      0
//----------  -----  -----  -----  -----  -----  -----
//tank1       2.51T  2.93T      0      0      0      0
//  raidz1    2.51T  2.93T      0      0      0      0
//    c8t1d0      -      -      0      0      0      0
//    c8t2d0      -      -      0      0      0      0
//    c8t3d0      -      -      0      0      0      0
//----------  -----  -----  -----  -----  -----  -----
// function solov_gen_zpools(data) {
	// var res = []

	// extract separators
	// var seps = []
	// for (var i=0; i<data.length; i++) {
		// var line = data[i]
		// if (line.substr(0,1) == "-")
			// seps.push(i)
	// }
	
	// calculate number of distinct pools
	// var numPools = (seps.length / 2) - 2

	// if (numPools == 0)
		// return []
	
	// for (p=1; p<=numPools; p++) {
		// var poolNum = p
		// var poolIdx = seps[numPools + poolNum] + 1
		// var poolData = data[poolIdx]
		
		// var cols = coreData.splitBlanks()
		
		// var name = cols[0]
		
		// var alloc = cols[1] // TODO G/T unit
		// var free  = cols[2] // TODO G/T unit
		
		// var allocNum = alloc.substring(0, alloc.length-2)
		// var freeNum  = free.substring(0, free.length-2)
		
		// var allocUnit = alloc.substr(alloc.length-2,1)
		// var freeUnit  = free.substr(free.length-2,1)
		
		// if (allocUnit != freeUnit) {
			// if (console && console.warn)
				// console.warn(["solov_gen_zfs: different units in alloc vs. free, aborting", alloc, free])
			// continue;
		// }
		
		// var capacity = allocNum + freeNum;
		
		// var opsRead  = parseInt( cols[3] )
		// var opsWrite = parseInt( cols[4] )
		
		// var bwRead  = parseInt( cols[5] )
		// var bwWrite = parseInt( cols[6] )
		
		// var lbl = "Pool " + name
		// var $html = $("<span></span>")
		// $html.append( $("<meter></meter").attr("title", "Allocated "+alloc+" of "+capacity+allocUnit).attr("min", 0).attr("max", capacity).attr("value", allocNum) )
		
		
		
		// res.push([lbl, $meter])
	// }
	// return res
// }
