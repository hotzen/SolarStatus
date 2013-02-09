$(document).ready(function() {
	repositionContent()
	$( window ).resize( repositionContent );
	
	$(".hide").hide().removeClass("hide")
	
	registerProbeRefresh()
	registerProbeViews()
	registerProbeFilters()
	registerProbeButtons()
})

function repositionContent() {
	var $panel   = $("#panel")
	var $content = $("#overview, #probes")
	
	panelHeight = $panel.outerHeight(true) // true = including margin
	$content.css({ marginTop: panelHeight + 'px' });
}

function registerProbeFilters() {
	$("#probe-filters li a").click(function() {
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
		$a.parent("li").addClass("selected").
			siblings("li").removeClass("selected")
		
		var filter  = $a.attr("data-filter")
		var $probe  = $a.parents(".probe")
		var $view   = $probe.children( filter )
		
		// show view, hide all others
		$view.show().addClass("selected").
			siblings().not("header").not("footer").hide().removeClass("selected")
		
		// stop event-bubbling
		return false
	})
}
  
function registerProbeRefresh() {
	// bind auto-refresher to checkbox
	$("#probe-refresh-toggle").click(autoRefresher)
	
	// enable and bind refresh button
	$(".probe a.refresh").click(function() {
		var $probe = $(this).parents(".probe")
		refreshProbe($probe)
		
		// stop event-bubbling
		return false
	})
}

function registerProbeButtons() {
	$(".probe a.select").click(function() {
		var $probe = $(this).parents(".probe")
		selectProbeText($probe)
		
		// stop event-bubbling
		return false
	})

	$(".probe a.view-full").click(function() {
		var $probe = $(this).parents(".probe")
		viewFullProbe($probe)
		
		// stop event-bubbling
		return false
	})
}

function selectProbeText($probe) {
	var $elem = $probe.find(".raw.selected pre, .transformed.selected")
	var elem = $elem.get(0)
	
    if (document.body.createTextRange) {
        var range = document.body.createTextRange()
        range.moveToElementText(elem)
        range.select()
    } else if (window.getSelection && document.createRange) {
        var sel = window.getSelection()
        var range = document.createRange()
        range.selectNodeContents(elem)
        sel.removeAllRanges()
        sel.addRange(range)
    }
}

function viewFullProbe($probe) {
	$probe.find(".raw, .transformed").toggleClass("fullview")
}

function autoRefresher() {
	var active = $("#probe-refresh-toggle").get(0).checked
	if (!active) return;
		
	var freq = parseInt( $("#probe-refresh-freq").val() )
	if (freq < 1) return;
				
	// refresh all active, non-confirmable probes
	$(".probe.active").not(".confirm").each(function() {
		refreshProbe( $(this) )
	})
	
	window.setTimeout(autoRefresher, freq * 1000)
}


function refreshProbe($probe) {
	var probeID = $probe.attr("id")
	
	if ($probe.hasClass("loading"))
		return

	if ($probe.hasClass("confirm")) {
		var label = $probe.find("header h1").text()
		var text  = $probe.attr("data-confirm")
		
		if (!confirm("Please confirm to refresh the probe\n  " + label + "\n\n" + text))
			return;
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
					if (typeof(v) == 'object' || typeof(v) == 'function')
						continue;
					detailsArr.push(k + "=" + v)
				}
			}
			var errorCode = data.code
			var error     = data.msg + " (" + detailsArr.join(") (") + ")"
			
			return onError(xhr, errorCode, error)
		}
		
		// store time in <time>
		var ts = parseInt(data["time"])
		var d  = new Date(ts)
		var dateTime    = dateTimeXSD(ts)
		var dateTimeOut = dateTimeHuman(ts)
		
		$probe.find("footer time").attr("data-timestamp", ts).attr("datetime", dateTime).html( dateTimeOut)
		
		// clear container-element for transformed data output
		var $transformElem = $probe.children(".transformed").html( "" )
		
		// clear raw data output
		var $dataElem = $probe.children(".raw").empty()
				
		// process result-array, where each entry is output from an individual command
		var resArr = data["result"]

		for (var i=0; i<resArr.length; ++i) {
			var res = resArr[i]

			var cmd    = res[0]
			var cmdOut = cmd.replace(/\n/g, "&nbsp;&crarr; ") // replace NL with carriage-return-style arrow
			
			var rc  = res[1]
			var out = res[2].replaceEntities()
						
			// create a dedicated <div>.result
			var $resultElem = $( document.createElement("div") ).appendTo( $dataElem ).addClass("result")
			
			// put command into <code>
			$( document.createElement("code") ).addClass("cmd").attr("title", "Executed Command").appendTo( $resultElem ).html( cmdOut )
			
			// put RC into another <code>
			$( document.createElement("code") ).addClass("rc").attr("title", "ReturnCode (RC 0 = Success)").appendTo( $resultElem ).html( rc )
			
			// put output into <pre>
			$( document.createElement("pre")  ).appendTo( $resultElem ).html( out )
			
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
			transformProbeData($probe, probeID, cmd, rc, out, $transformElem)
			
			// generate overview
			generateProbeOverview(probeID, rc, out)
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
		
		if (errorType == "NO_AUTH") {
			// first notice that auth is expired, ask to login again
			if (SOLAR.AUTH && confirm("Authentication is expired.\n\nDo you want to login again?")) {
				window.location.reload()
			}
			
			// register expiration
			SOLAR.AUTH = true
		}
	}
	
	var time = (new Date()).getTime()
	$.ajax({
		url:        "exec.php?p=" + probeID + "&ts=" + time
		, type:	    "GET"
		, dataType: "json"
		, success:	onSuccess
		, error: 	onError
	})
}

function transformProbeData($probe, probe, cmd, rc, out, $container) {

	// abort if probe has no transformation-hook
	var fn = "solar_transform_" + probe
	if (typeof(window[fn]) === 'undefined')
		return
	var transform = window[fn]

	try {
		// pass jquery container-element as pure DOM element
		var container = $container.get(0)
		var ret = transform(container, cmd, rc, out)
		
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
		console.error("transformation failed", probe, msg)
	}
}

function generateProbeOverview(probeID, rc, out) {
	var $overview = $("#overview")
	var $tbody    = $("#overview-" + probeID)
	
	// abort if overview is not displayed
	if ( !$overview.is(":visible") )
		return
		
	// abort if probe has no overview-hook
	var fn = "solar_overview_" + probeID
	if (typeof(window[fn]) === 'undefined')
		return
	var overview = window[fn]
	
	try {
		var lines = out.split("\n")
	
		// process overview-function
		var res = overview(lines)
				
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
				var view  = item[1] || "[FAILED]"
								
				var $tr = $("<tr></tr>").addClass(clazz)
				$tr.append( $("<td></td>").addClass("label").append(label) )
				$tr.append( $("<td></td>").addClass("view").append(view) )
				
				if (i == 0) $tr.addClass("first")
				if (i == res.length-1) $tr.addClass("last")
				
				if (i % 2 == 0) $tr.addClass("odd") // treat 0 as 1
				else            $tr.addClass("even")
				
				$tbody.append( $tr )
			}
		} else {
			console.warn("overview-function produced no result", fn)
		}
	} catch(ex) {
		var msg = (ex.toString) ? ex.toString() : ex
		console.error("overview-function failed", fn, msg)
	}
	
	// remove this probe's loading state
	$tbody.removeClass("overview-loading")
	
	// set overall loading state
	if ( $overview.has("tbody.overview-loading").length == 0 ) {
		$overview.removeClass("loading")
	}
}