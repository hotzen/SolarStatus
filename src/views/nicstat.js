SolarStatus.view("nicstat", function(cmd, rc, out, createView, done) {
	var tbl = new TableTransformer()
		
	tbl.header("Time", "Time")
	tbl.header("Int", "Interface")
	tbl.header("rKb/s", "read Kbytes/s")
	tbl.header("wKb/s", "write Kbytes/s")
	tbl.header("rPk/s", "read Packets/s")
	tbl.header("wPk/s", "write Packets/s")
	tbl.header("rAvs", "read Average size, bytes")
	tbl.header("wAvs", "write Average size, bytes")
	tbl.header("%Util", "%Utilisation (r+w/ifspeed)")
	tbl.header("Sat", "Saturation (defer, nocanput, norecvbuf, noxmtbuf)")
	
	var elem = tbl.create(out)
	createView("Table", elem)
	done()
})