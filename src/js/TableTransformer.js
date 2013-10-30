function TableTransformer() {
	this.ignoreDefs = []
	this.headerDefs = []
	this.footerDefs = {}
}
TableTransformer.prototype = {
	// trim & lowercase
	pack: function(string) {
		if (string) return string.replace(/^\s+/, "").replace(/\s+$/, "").replace(/\s+/, " ").toLowerCase()
		else return null
	},
	
	ignore: function(pattern) {
		var def = {
			pattern: pattern,
			packed:  this.pack( pattern )
		}
		this.ignoreDefs.push(def)
		return def
	},
	
	
	/**
	 * defines a header-column, detected by <pattern>
	 * <info> is shown as the html title-attribute to display informational text
	 * optional zero-based <index>, data is only detected as a header when the <index> specification matches the data 
	 * optional <label>, that overwrites what is displayed if the column is detected as a header.
	 */
	header: function(pattern, info, index, label) {
		var def = {
			pattern: pattern,
			packed: this.pack( pattern ),
			index: index || -1,
			info: info,
			label: label || null
		}
		this.headerDefs.push(def)
		return def
	},
	footer: function(prefix) {
		this.footerDefs = {
			prefix:	this.pack(prefix)
		}
	},
	superCol: function(x, info, subPatterns) {
		// TODO
	},
	isIgnore: function(data) {
		var packed = this.pack(data)

		for (var i=0; i<this.ignoreDefs.length; ++i) {
			if (data.indexOf(this.ignoreDefs[i].pattern) > -1)
				return true;
			
			if (this.ignoreDefs[i].packed == packed)
				return true;
		}
		return false;
	},
	isHeaderCol: function(data, index) {
		var packed = this.pack(data)
		var longestMatch = null
		
		for (var k=0; k<this.headerDefs.length; ++k) {
			var hdrDef = this.headerDefs[k]
						
			var indexOK = (hdrDef.index < 0) || (hdrDef.index == index)
			var packedMatch = (hdrDef.packed == null) || (packed == hdrDef.packed)
			
			if (indexOK && packedMatch) {
				if (longestMatch) {
					if (longestMatch.packed.length < hdrDef.packed)
						longestMatch = hdrDef
				} else {
					longestMatch = hdrDef
				}
			}
		}
		return longestMatch;
	},
	
	/**
	 * create a Table from <content> which is an Array or string.
	 * optionally put the Table into <container> DOM-Element.
	 *
	 * returns the <table> DOM-Element
	 */
	create: function(content, container) {
		var that = this
		
		var lines = null
		if (content.push) { // Array
			lines = content
		} else if (content.split) { // String
			lines = content.split("\n")
		} else {
			throw "invalid TableTransformer.create(<content>): " + content
		}
		
		var table = document.createElement("table")
		if (container)
			container.appendChild( table )
		
		var overallColCount = -1
		
		var tbody = null
		for (var i=0; i<lines.length; ++i) {
			var line = lines[i]
			
			// empty line
			if (line.trim().length == 0)
				continue;
			
			// ignore line
			if (this.isIgnore(line))
				continue;

			var split = line.splitWhitespace()
			var cols = []
			var colCount = cols.length

			// count headers contained in this line
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
			
			overallColCount = colCount
			
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