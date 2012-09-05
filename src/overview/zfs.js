// NAME                     USED  AVAIL  MOUNTPOINT           SHARESMB     SHARENFS    KEYSTATUS
// rpool1                  6.64G  12.9G  /rpool1              off          off              none
// rpool1/ROOT             2.51G  12.9G  legacy               off          off              none
// rpool1/ROOT/solaris     2.51G  12.9G  /                    off          off              none
// rpool1/export           9.03M  12.9G  /export              off          off              none
// rpool1/zones              31K  12.9G  /zones               off          off              none
// tank1                   1.67T  1.89T  /tank1               off          off              none
// tank1/temp               250K   100G  /tank1/temp          name=temp    off              none
function solar_overview_zfs(rows) {
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
		
		var usedRaw = poolData[1]
		var usedNum = parseFloat(usedRaw.substr(0, usedRaw.length-1))
		var usedUnit = usedRaw.substr(usedRaw.length-1, 1)
	    
		var availRaw = poolData[2]
		var availNum = parseFloat(availRaw.substr(0, availRaw.length-1))
		var availUnit = availRaw.substr(availRaw.length-1, 1)
		
		var aligned = alignUnits(usedNum, usedUnit, availNum, availUnit)
		var used  = aligned[0]
		var avail = aligned[1]
		var unit  = aligned[2]
		
		var capacity = used + avail //.toFixed(2)
		var capacityAligned = convertToGreatestUnit(capacity, unit)
		var capacityAlignedNum = capacityAligned[0].toFixed(2)
		var capacityAlignedUnit = capacityAligned[1]
		
		var lbl = "ZFS Pool " + poolName
		var $meter = $("<meter></meter").attr("title", "Used "+used+unit+" of "+capacityAlignedNum+capacityAlignedUnit).attr("min", 0).attr("max", capacity).attr("value", used)
		
		res.push([lbl, $meter])
	}
	
	return res
}