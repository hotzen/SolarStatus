$(document).ready(function() {
	repositionContent()
	$( window ).resize( repositionContent );
	
	$(".hide").hide().removeClass("hide")
	
	registerProbeRefresh()
	registerProbeViews()
	registerProbeFilters()
})

function repositionContent() {
	var $panel   = $("#panel")
	var $content = $("#overview, #probes")
	
	panelHeight = $panel.outerHeight(true) // true = including margin
	$content.css({ marginTop: panelHeight + 'px' });
}

function registerProbeFilters() {
	$("#probe-filters a").click(function() {
		var $a = $(this)
	
		// select filter, deselect all others
		$a.parent("li").addClass("selected").siblings("li").removeClass("selected")

		var type   = $a.attr("href")
		var filter = $a.attr("data-filter")
		var $probes = $( filter )
		
		// hide and deactivate all probes
		$(".probe").hide().removeClass("active")
			
		// display
		if (type == "#overview") {
			// display overview if not yet displayed, set initial loading-state
			$("#overview").addClass("loading").not(":visible").fadeIn("slow")
						
			// tag the individual probes' <tbody>-containers as loading
			$("#overview").find("tbody").addClass("overview-loading")
			
			// activate and refresh referenced probes (do not honor .confirm)
			$probes.addClass("active").find(".refresh").click()
			
		} else {
			// hide the overview-panel
			$("#overview").hide()
					
			// activate referenced probes, display them and refresh non-confirm probes
			$probes.addClass("active").slideDown("slow").not(".confirm").find(".refresh").click()
		}
		
		repositionContent()
		
		// stop event-bubbling
		return false
	})
		
	// apply pre-selected filter or auto-select overview
	$selFilter = $("#probe-filters .selected")
	if ($selFilter.length > 0) {
		$selFilter.find("a").click()
	} else {
		$("#probe-filters .overview a").click()
	}
}

function failProbe($probe, failure) {
	$probe.addClass("failed").find(".failure").text(failure).show()
}

function unfailProbe($probe) {
	$probe.removeClass("failed").find(".failure").hide().html("")
}

function registerProbeViews() {
	// bind view-selector links
	$(".probe .view-selector a").click(function() {
		var $a = $(this)
	
		// select view, deselect all others
		$a.parent("li").addClass("selected").siblings("li").removeClass("selected")
		
		var filter  = $a.attr("data-filter")
		var $probe  = $a.parents(".probe")
		var $view   = $probe.children( filter )
		
		// show view, hide all others
		$view.show().
			siblings().not("header").not("footer").hide()
		
		// stop event-bubbling
		return false
	})
}
  
function registerProbeRefresh() {
	// bind auto-refresher to checkbox
	$("#probe-refresh-toggle").click( autoRefresher )
	
	// enable and bind refresh button
	$(".probe .refresh").click(function() {
		refreshProbe( $(this).parents(".probe") )
		
		// stop event-bubbling
		return false
	})
}

function autoRefresher() {
	var active = $("#probe-refresh-toggle").get(0).checked
	if (!active) {
		return
	}
	
	var freq = parseInt( $("#probe-refresh-freq").val() )
	if (freq < 1) {
		return
	}
			
	// refresh all active, non-confirmable probes
	$(".probe.active").not(".confirm").each(function() {
		refreshProbe( $(this) )
	})
	
	window.setTimeout(autoRefresher, freq * 1000)
}


function refreshProbe($probe) {
	var probeID = $probe.attr("id")
	
	if ($probe.hasClass("loading")) {
		console.debug(["already loading, skipping refresh", probeID])
		return
	}

	if ($probe.hasClass("confirm")) {
		var label = $probe.find("header h1").text()
		var text  = $probe.attr("data-confirm")
		
		if (!confirm("Please confirm to refresh the probe\n  " + label + "\n\n" + text)) {
			return
		}
	}
	
	// set loading state
	$probe.addClass("loading")

	unfailProbe($probe)
	
	var onSuccess = function(data, textStatus, xhr) {
		// check if error is returned
		if (data.error) {
			var detailsArr = []
			if (data.details) {
				for (var k in data.details) {
					var v = data.details[k]
					detailsArr.push(k + "=" + v)
				}
			}
			var errorCode = data.code
			var error     = data.msg + " (" + detailsArr.join(") (") + ")"
			
			return onError(xhr, errorCode, error)
		}
		
		// store time in <time>
		var ts = data["time"]
		var d  = new Date(ts)
		var dateTime    = dateTimeXSD(ts)
		var dateTimeOut = dateTimeHuman(ts)
		
		$probe.find("footer time").attr("data-timestamp", ts).attr("datetime", dateTime).html( dateTimeOut )			
		
		// clear container-element for transformed data output
		var $transformElem = $probe.children(".transformed").html( "" )
		
		// clear raw data output
		var $dataElem = $probe.children(".raw").empty()
				
		// update token
		if (data["token"] && data["token"] != SOLAR.AUTH_TOKEN) {
			SOLAR.AUTH_TOKEN = data["token"]
			
			// update location-bar
			if (window.history.replaceState) {
				var newTokenPath = SOLAR.SELF + "?t=" + SOLAR.AUTH_TOKEN
				window.history.replaceState(SOLAR.AUTH_TOKEN, "Auth-Token Issued", newTokenPath);
			}
		}
		
		// process result-array, where each entry is output from an individual command
		var resArr = data["result"]

		for (var i=0; i<resArr.length; ++i) {
			var res = resArr[i]

			var cmd    = res[0]
			var cmdOut = cmd.replace(/\n/g, "&nbsp;&crarr; ") // replace NL with carriage-return-style arrow
			
			var linesArr = res[1]
			var lines    = linesArr.join("\n").replaceEntities() // make string, replace entities
			
			// create a dedicated <div>.result
			var $resultElem = $( document.createElement("div") ).appendTo( $dataElem ).addClass("result")
			
			// put command into <code>
			$( document.createElement("code") ).appendTo( $resultElem ).html( cmdOut )
			
			// put output into <pre>
			$( document.createElement("pre")  ).appendTo( $resultElem ).html( lines )
			
			// odd/even
			if (i % 2 == 0)
				$resultElem.addClass("even")
			else
				$resultElem.addClass("odd")
			
			// first/last
			if (i == 0) 
				$resultElem.addClass("first")
			if (i == resArr.length-1)
				$resultElem.addClass("last")
			
			// run transformation on data
			transformProbeData($probe, probeID, linesArr, cmd, $transformElem)
			
			// generate overview
			generateProbeOverview(probeID, linesArr)
		}

		// clear loading-state
		$probe.removeClass("loading")
	}
	
	var onError = function(xhr, errorType, error) {
	
		// display failure
		failProbe($probe, "[" + errorType + "] " + error)

		// clear output
		$probe.children("code").add(".transformed").html("")
		
		// clear loading-state
		$probe.removeClass("loading")
		
		if (error == "NO_AUTH") {
			// first notice that auth is expired, ask to login again
			if (!SOLAR.AUTH_EXPIRED && confirm("Authentication is expired.\n\nDo you want to login again?")) {
				window.location.reload()
			}
			
			// register expiration
			SOLAR.AUTH_EXPIRED = true
		}
	}
	
	var time = (new Date()).getTime()
	$.ajax({
		url:        "exec.php?t=" + SOLAR.AUTH_TOKEN + "&p=" + probeID + "&ts=" + time
		, type:	    "GET"
		, dataType: "json"
		, success:	onSuccess
		, error: 	onError
	})
}

function transformProbeData($probe, probe, lines, cmd, $container) {

	// abort if probe has no transformation-hook
	var fn = "solar_transform_" + probe
	if (typeof(window[fn]) === 'undefined') {
		//console.debug(["no solar_transform_<probe> function found", probe, fn])
		return
	}
	
	try {
		// pass jquery container-element as pure DOM element
		var container = $container.get(0)
		var ret = window[fn](container, lines, cmd)
		
		// use optional return value as view-label
		if (ret && ret.toString) {
			$probe.find(".view-transformed a").text( ret.toString() )
		}
		
		// activate view-selector
		$probe.find(".view-selector").show()
		
		// activate the transformed-view
		$probe.find(".view-transformed a").click()
		
	} catch(ex) {
		var msg = (ex.toString) ? ex.toString() : ex
		console.error(["transformation failed", probe, msg])
	}
}

function generateProbeOverview(probeID, data) {
	var $overview = $("#overview")
	var $tbody    = $("#overview-" + probeID)
	
	// abort if overview is not displayed
	if ( !$overview.is(":visible") ) {
		return
	}
	
	// abort if probe has no overview-hook
	var fn = "solar_overview_" + probeID
	if (typeof(window[fn]) === 'undefined') {
		//console.debug(["no solar_overview_<probe> function found", probeID, fn])
		return
	}
			
	try {
		// process overview-function
		var res = window[fn](data)
				
		var clazz    = "overview-" + probeID
		var clazzSel = "." + clazz
		
		// result must be a multi-dim array:
		// [   [<label>, <view>, <TODO historic data/graph>]
		//   , [<label>, <view>]
		//   ...
		// ]
		if (res && res.length && res.length > 0) {
			
			// reset output
			$tbody.empty()
			
			// add each array-entry as a <li>
			for (var i=0; i<res.length; i++) {
				var item  = res[i]
				
				var label = item[0] || probeID
				var view  = item[1] || "view-failure"
								
				var $tr = $("<tr></tr>").addClass(clazz)
				$tr.append( $("<td></td>").addClass("label").text(label) )
				$tr.append( $("<td></td>").addClass("view").append(view) )
				
				$tbody.append( $tr )
			}
		} else {
			console.warn(["overview-function produced no result", fn])
		}
	} catch(ex) {
		var msg = (ex.toString) ? ex.toString() : ex
		console.error(["overview-function failed", fn, msg])
	}
	
	// remove this probe's loading state
	$tbody.removeClass("overview-loading")
	
	// set overall loading state
	if ( $overview.has("tbody.overview-loading").length == 0 ) {
		$overview.removeClass("loading")
	}
}