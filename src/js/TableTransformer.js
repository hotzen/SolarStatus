
function TableTransformer() {
	this.ignoreDefs = []
	this.headerDefs = []
	this.footerDefs  = {}

	// trim & lowercase
	this.pack = function(string) {
		if (string) return string.replace(/^\s+/, "").replace(/\s+$/, "").replace(/\s+/, " ").toLowerCase()
		else return null
	}
			
	this.ignore = function(string) {
		var def = {
			string: string,
			packed: this.pack( string )
		}
		this.ignoreDefs.push(def)
		return def
	}
	
	/**
	 * defines a header-column, detected by <string>
	 * <info> is shown as the html title-attribute to display informational text
	 * optional zero-based <index>, data is only detected as a header when the <index> specification matches the data 
	 * optional <label>, that overwrites what is displayed if the column is detected as a header.
	*/
	this.header = function(string, info, index, label) {
		var def = {
			string: string,
			packed: this.pack( string ),
			index: index || -1,
			info: info,
			label: label || null
		}
		this.headerDefs.push(def)
		return def
	}
		
	this.footer = function(prefix) {
		this.footerDefs = {
			prefix:	this.pack(prefix)
		}
	}
	
	this.superCol = function(x, info, subPatterns) {
		// TODO
	}

	this.isIgnore = function(data) {
		var	packed = this.pack(data)

		for (var i=0; i<this.ignoreDefs.length; ++i) {
			if (data.indexOf(this.ignoreDefs[i].string) > -1)
				return true
			
			if (this.ignoreDefs[i].packed == packed)
				return true
		}
		return false
	}
	
	this.isHeaderCol = function(data, index) {
		var packed = this.pack(data)
		var bestMatchingDef = null
		
		for (var k=0; k<this.headerDefs.length; ++k) {
			var hdrDef = this.headerDefs[k]
						
			var indexOK = (hdrDef.index < 0) || (hdrDef.index == index)
			var packedMatch = (hdrDef.packed == null) || (packed == hdrDef.packed)
			
			if (indexOK && packedMatch) {
				if (bestMatchingDef) {
					if (bestMatchingDef.packed.length < hdrDef.packed)
						bestMatchingDef = hdrDef
				} else
					bestMatchingDef = hdrDef
			}
		}
		
		return bestMatchingDef
	}
	
	this.create = function(out, container) {
		var that = this
		var lines = out.split("\n")
		
		var table = document.createElement("table")
		container.appendChild( table )
		
		var tbody = null
				
		for (var i=0; i<lines.length; ++i) {
			var line = lines[i]
			
			if (this.isIgnore(line)) {
				continue
			}
			
			// trim, then split by whitespaces
			var split = line.replace(/^\s+/, '').replace(/\s+$/, '').split(/\s+/)
			var cols = []

			var cntHeaders = 0
			
			for (var j=0; j<split.length; ++j) {
				var data = split[j]
				var hdrDef = this.isHeaderCol(data, j)

				if (hdrDef) {
					cntHeaders++
					cols.push({
						header: true,
						def:	hdrDef,
						data: 	data
					})
				} else {
					cols.push({
						header: false,
						def:    null,
						data: 	data,
					})
				}
			}
			
			var ratioHeaders = (cntHeaders / cols.length)
			
			var isHeaderLine = (cntHeaders >= 3 || ratioHeaders > 0.5) ? true : false
			
			if (isHeaderLine) {
				var thead = document.createElement("thead")
				table.appendChild( thead )
				
				tbody = document.createElement("tbody")
				table.appendChild( tbody )

				var tr = document.createElement("tr")
				thead.appendChild(tr)
				
				for (var j=0; j<cols.length; ++j) {
					var col = cols[j]
					
					var th = document.createElement("th")
					tr.appendChild(th)
					
					if (col.def && col.def.label)
						th.innerHTML = col.def.label
					else
						th.innerHTML = col.data
					
					if (col.def && col.def.info)
						th.setAttribute("title", col.def.info)
				}
			} else {
				if (!tbody) {
					//XXX really? 
					tbody = document.createElement("tbody")
					table.appendChild( tbody )
				}

				var tr = document.createElement("tr")
				tbody.appendChild(tr)
			
				cols.forEach(function(col) {
					var td = document.createElement("td")
					tr.appendChild(td)
					td.innerHTML = col.data
				})
			}
		}
		
		return table
	}
}