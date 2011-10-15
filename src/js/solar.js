$(document).ready(function() {
	repositionContent()
	$( window ).resize( repositionContent );

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

		// hide all probes & overview
		$(".probe").add("#overview").hide().removeClass("hide")
		
		var filters = $a.attr("data-filter")
		
		// handle special case: generate the overview
		if (filters == "#overview") {
			requestOverview()
		} else {
			var $probes = $( filters )
			
			// show filtered probes and refresh non-confirm probes
			$probes.not(".sliding").addClass("sliding").slideDown("slow").removeClass("sliding").not(".confirm").find(".refresh").click()
		}
		
		// stop event-bubbling of link-click
		return false
	})
		
	// apply pre-selected filter or auto-select overview
	$selFilters = $("#probe-filters .selected")
	if ($selFilters.length > 0) {
		$selFilters.find("a").click()
	} else {
		$("#probe-filters .overview a").click()
	}
}

function failProbe($probe, failure) {
	$probe.addClass("failed").find(".failure").text(failure).removeClass("hide")
}

function unfailProbe($probe) {
	$probe.removeClass("failed").find(".failure").addClass("hide").html("")
}

function registerProbeViews() {
	// bind view-selector links
	$(".probe .view-selector a").click(function() {
		var $a = $(this)
	
		// select view, deselect all others
		$a.parent("li").addClass("selected").siblings("li").removeClass("selected")
		
		var selFilter = $a.attr("data-filter")
		
		var $probe = $a.parents(".probe")
		var id = $probe.attr("id")
		
		var $view = $probe.children( selFilter )
		
		// show view, hide all others
		$view.removeClass("hide").siblings().not("header").not("footer").addClass("hide")
		
		// stop event-bubbling of link-click
		return false
	})
}
  
function registerProbeRefresh() {
	// bind auto-refresher to checkbox
	$("#probe-refresh-toggle").click( autoRefresher )
	
	// enable and bind refresh button
	$(".probe .refresh").click(function() {
	
		refreshProbe( $(this).parents(".probe") )
		
		// stop event-bubbling of link-click
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
		
	// refresh all visible, non-confirmable probes
	$(".probe:visible").not(".confirm").each(function() {
		refreshProbe( $(this) )
	})
	
	window.setTimeout(autoRefresher, freq * 1000)
}


function refreshProbe($probe) {
	
	var probeID = $probe.attr("id")
	
	if ($probe.hasClass("loading")) {
		console.warn(["already loading, skipping refresh", probeID])
		return
	}
		
	if ($probe.hasClass("confirm") && !$probe.hasClass("force-refresh")) {
		var name = $probe.find("header h1").text()
		var text = $probe.attr("data-confirm")
		
		if (confirm("Please confirm to refresh the probe\n  " + name + "\n\n" + text)) {
			$probe.addClass("confirm-allowed")
		} else {
			$probe.addClass("confirm-denied")
			return
		}
	}
	
	// remove forced refresh for next time
	$probe.removeClass("force-refresh")
		
	// set loading state
	$probe.addClass("loading")

	unfailProbe($probe)
			
	var onSuccess = function(data, textStatus, xhr) {
		// check if error is returned
		if (data.error) {
			return onError(xhr, "SolarStatus", data.message)
		}
		
		// store time in <time>
		var ts = data["time"]
		var d  = new Date(ts)
		var dateTime    = dateTimeXSD(ts)
		var dateTimeOut = dateTimeHuman(ts)
		
		$probe.find("footer > time").attr("data-timestamp", ts).attr("datetime", dateTime).html( dateTimeOut )			
		
		// prepare container-element for transformation
		var $transformElem = $probe.children(".transformed").html( "" )
		
		// reset data
		var $dataElem = $probe.children(".raw").html("")
				
		// update token
		if (data["token"] && data["token"] != SOLAR.AUTH_TOKEN) {
			SOLAR.AUTH_TOKEN = data["token"]
			
			// update url-bar
			if (window.history.replaceState) {
				var newTokenPath = SOLAR.SELF + "?t=" + SOLAR.AUTH_TOKEN
				window.history.replaceState(SOLAR.AUTH_TOKEN, "Token Refreshed", newTokenPath);
			}
		}
		
		// process results
		var resArr = data["result"]
		for (var i=0; i<resArr.length; ++i) {
			var res = resArr[i]

			// replace NL in multiline commands with carriage-return-style arrow			
			var cmd    = res[0]
			var cmdOut = cmd.replace(/\n/g, "&nbsp;&crarr; ")
			
			// join output-lines into string, replace entities
			var linesArr = res[1]
			var lines    = linesArr.join("\n").replaceEntities()
			
			var $resultElem = $( document.createElement("div") ).appendTo( $dataElem ).addClass("result")
			$( document.createElement("code") ).appendTo( $resultElem ).html( cmdOut )
			$( document.createElement("pre")  ).appendTo( $resultElem ).html( lines )
			
			if (i % 2 == 0)
				$resultElem.addClass("even")
			else
				$resultElem.addClass("odd")
			
			if (i == 0) 
				$resultElem.addClass("first")
			if (i == resArr.length-1)
				$resultElem.addClass("last")
			
			// transform
			transformProbeData($probe, probeID, linesArr, cmd, $transformElem)
			
			// generate overview
			generateOverview(probeID, linesArr)
		}
								
		// apply view
		$probe.find(".view-selector li.selected a").click()
		
		// clear loading-state
		$probe.removeClass("loading")
	}
	
	var onError = function(xhr, errorType, error) {
		failProbe($probe, errorType + ": " + error)

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
	try {
		var fn = "solar_transform_" + probe
		if (typeof(window[fn]) === 'undefined') {
			//console.trace(["no solar_transform_<probe> function found", probe, fn])
			return
		}
		
		// activate view-selector
		$probe.find(".view-selector").removeClass("hide")
		
		// process transformation
		console.log([$container.length, $container])
		
		var container = $container.get(0)
		var ret = window[fn](container, lines, cmd)
		
		// use optional return value as view-label
		if (ret && ret.toString) {
			$probe.find(".view-transformed a").text( ret.toString() )
		}
		
		// activate the transformed-view
		$probe.find(".view-transformed a").click()
		
	} catch(ex) {
		var msg = (ex.toString) ? ex.toString() : ex
		console.error(["transformation failed", probe, msg])
	}
}

function requestOverview() {
	var $overview = $( "#overview" )
	var $overviewList = $overview.find("ul")
		
	var cssID = function(name) { return "#" + name }
	var probes = SOLAR.OVERVIEW.map(cssID).join(", ")
		
	if (probes.length == 0) {
		console.debug(["no overview-probes registered"])
		return
	}
	
	var $probes = $( probes )

	// clear overview
	$overviewList.empty()
		
	// refresh probes
	$probes.find(".refresh").click()
	
	// slowly begin to show overview
	$overview.fadeIn( "slow" )
}


function generateOverview(probe, data) {
	var $overviewList = $( "#overview ul" )
	
	try {
		var fn = "solar_overview_" + probe
		if (typeof(window[fn]) === 'undefined') {
			//console.trace(["no solar_overview_<probe> function found", probe, fn])
			return
		}
				
		// process overview-function
		var res = window[fn](data)
		
		if (res && res.length && res.length > 0) {
			
			// add each result-item as a <li>
			for (var i=0; i<res.length; i++) {
				var item  = res[i]
				
				var label = item[0]
				var view  = item[1]
				
				var $li = $("<li></li>")
				$li.append( $("<label></label>").text( label ) )
				$li.append( view )
			
				$overviewList.append( $li )
			}
		} else {
			console.warn(["overview-function produced no result", fn])
		}
	} catch(ex) {
		var msg = (ex.toString) ? ex.toString() : ex
		console.error(["overview-function failed", fn, msg])
	}
}