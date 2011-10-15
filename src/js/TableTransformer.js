
function TableTransformer() {
	this._ignores = []
	this._columns = []
	this._footer  = {}

	// trim & lowercase
	this.patterize = function(s) {
		if (!s)
			return null
		return s.replace(/^\s+/, '').replace(/\s+$/, '').toLowerCase()
	}
		
	this.ignore = function(pattern) {
		var def = {
			pattern: this.patterize( pattern )
		}
		this._ignores.push(def)
		return def
	}

	this.col = function(pattern, info) {
		var def = {
			pattern: this.patterize( pattern ),
			//label:	 label,
			info:    info
		}
		this._columns.push(def)
		return def
	}
	
	this.footer = function(prefix) {
		this._footer = {
			prefix:	this.patterize(prefix)
		}
	}
	
	this.superCol = function(pattern, info, subPatterns) {
		// TODO
	}

	this.isIgnore = function(data) {
		var dataLC = data.toLowerCase()
		for (var i=0; i<this._ignores.length; ++i) {
			if (dataLC.indexOf(this._ignores[i].pattern) != -1)
				return true
		}
		return false
	}
	
	this.checkHeaderCol = function(data) {
		var dataLC = data.toLowerCase()
		var maxPatternLength = -1
		var bestColDef = false
		
		for (var k=0; k<this._columns.length; ++k) {
			var colDef = this._columns[k]
			
			if (dataLC.indexOf(colDef.pattern) != -1 && colDef.pattern.length > maxPatternLength) {
				maxPatternLength = colDef.pattern.length
				bestColDef = colDef
			}
		}
		
		return bestColDef
	}
	
	this.transform = function(dataRows, container) {
		var that = this

		var table = document.createElement("table")
		container.appendChild( table )
		
		var tbody = null
		
		// split into rows
		//var dataRows = data.split("\n")
		
		// for each row ...
		for (var i=0; i<dataRows.length; ++i) {
			var dataRow = dataRows[i]
			
			// console.log(["parsing row", i])
			if (this.isIgnore(dataRow)) {
				continue
			}
			
			// trim, then split by whitespaces
			var dataCols = dataRow.replace(/^\s+/, '').replace(/\s+$/, '').split(/\s+/)
			var cols = []

			// for each column ...
			for (var j=0; j<dataCols.length; ++j) {
				var dataCol = dataCols[j]
				var colDef  = this.checkHeaderCol( dataCol )
				
				if (colDef)
					cols.push({
							isHeader: true,
							data: 	  dataCol,
							def:  	  colDef
						})
				else
					cols.push({
						isHeader: false,
						data:     dataCol
					})
			}
			
			// console.log(["cols of row", i, cols])
			
			var cntHeaders = 0
			var cntData    = 0
			
			cols.forEach(function(col) {
				if (col.isHeader)
					cntHeaders++
				else
					cntData++
			})
			
			var ratio = cntHeaders / (cntHeaders + cntData)
			
			// found header- as well as data-columns: implicitly transform data-columns to headers
			if (cntHeaders > 0 && cntData > 0 && ratio > 0.7) {
				cols = cols.map(function(col) {
					// do not transform headers
					if (col.isHeader)
						return col
					//console.log(["transforming column to header-column", col.data])
					return {
						isHeader: true,
						data:     col.data,
						def:      that.col(col.data, "")
					}
				})
			}
			
			var headers = cols.every(function(col) { return col.isHeader })
									
			if (headers) {
				var thead = document.createElement("thead")
				table.appendChild( thead )
				
				tbody = document.createElement("tbody")
				table.appendChild( tbody )

				var tr = document.createElement("tr")
				thead.appendChild(tr)
				
				cols.forEach(function(col) {
					var th = document.createElement("th")
					tr.appendChild(th)
					th.innerHTML = col.data // col.def.label
					th.setAttribute("title", col.def.info)
				})
			} else {
				if (!tbody)
					throw "no header-columns, no <tbody> defined"
			
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