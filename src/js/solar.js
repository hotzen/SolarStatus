$(document).ready(function() {
	registerProbeRefresh()
	registerProbeViews()
	registerProbeFilters()
})
 

function registerProbeFilters() {
	$("#probe-filters a").click(function() {
		var $a = $(this)
	
		// select filter, deselect all others
		$a.parent("li").addClass("selected").siblings("li").removeClass("selected")

		// hide all probes & overview
		$(".probe").add("#overview").hide().removeClass("hide")
		
		// split the filter, then add() its parts
		var filters = $a.attr("data-filter").split(";")
		var $probes = $( filters[0] )
			
		for (var i=1; i<filters.length; ++i) {
			$probes = $probes.add(filters[i])
		}
		
		// show filtered probes and refresh
		$probes.slideDown("slow").find(".refresh").click()
				
		// stop event-bubbling of link-click
		return false
	})
	
	// apply filter selected filter or auto-select overview
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
	$("#probe-refresh-active").click( autoRefresher )
	
	// enable and bind refresh button
	$(".probe .refresh").click(function() {
	
		refreshProbe( $(this).parents(".probe") )
		
		// stop event-bubbling of link-click
		return false
	})
}

function autoRefresher() {
	var active = $("#probe-refresh-active").get(0).checked
	if (!active) {
		return
	}
	
	var freq = parseInt( $("#probe-refresh-freq").val() )
	if (freq < 1) {
		return
	}
		
	// refresh all visible probes
	$(".probe:visible").each(function() {
		refreshProbe( $(this) )
	})
	
	window.setTimeout(autoRefresher, freq * 1000)
}


function refreshProbe($probe) {
	
	var id = $probe.attr("id")
	
	if ($probe.hasClass("loading")) {
		if (console && console.warn)
			console.warn(["already loading, skipping refresh", $probe.attr("id")])
		return
	}
	
	// set loading state
	$probe.addClass("loading")

	unfailProbe($probe)
	
	var parserCallback = function() {
		// enable data-selector
		$probe.find(".view-selector .view-data").removeClass("hide")
		
		// if nothing is selected, select parsed data
		if ($probe.find(".view-selector li.selected").length == 0) {
			$probe.find(".view-selector li.view-data a").click()
		}
	}
	
	
	var onSuccess = function(data, textStatus, xhr) {
		// check if error is returned
		if (data.error) {
			return onError(xhr, "apperror", data.message)
		}
		
		// store time in <time>
		var ts = data["time"]
		var d  = new Date(ts)
		var dateTime    = dateTimeXSD(ts)
		var dateTimeLbl = dateTimeHuman(ts)
		
		$probe.find("footer > time").attr("data-timestamp", ts).attr("datetime", dateTime).html( dateTimeLbl )			
		
		// prepare container-element for reactors to the probe-event
		var $container    = $probe.children(".data").html( "" )
		var containerElem = $container.get(0)
		
		// reset raw-output and process
		var $raw = $probe.children(".raw").html("")
		var resArr  = data["result"]
		
		// update token
		if (data["token"] && data["token"] != SOLAR.TOKEN) {
			SOLAR.TOKEN = data["token"]
			
			// update url-bar
			if (window.history.replaceState) {
				var newTokenPath = SOLAR.SELF + "?t=" + SOLAR.TOKEN
				window.history.replaceState(SOLAR.TOKEN, "Token Refreshed", newTokenPath);
			}
		}
		
		for (var i=0; i<resArr.length; ++i) {
			var res = resArr[i]
			
			var resCmd    = res[0].replace(/\n/g, "&nbsp;&crarr; ") // replace NL in multiline commands with carriage-return-style arrow
			var resOutArr = res[1]
			var resOut    = resOutArr.join("\n")
			
			var $rawRes = $( document.createElement("div") ).appendTo( $raw ).addClass("result")
			$( document.createElement("code") ).appendTo( $rawRes ).html( resCmd )
			$( document.createElement("pre")  ).appendTo( $rawRes ).html( resOut )
			
			// trigger probe-event
			$probe.trigger('probe', [id, resCmd, resOutArr, containerElem, parserCallback])
			
			if (i == 0)
				$rawRes.addClass("first")
			if (i == resArr.length-1)
				$rawRes.addClass("last")
		}
								
		// apply view
		$probe.find(".view-selector li.selected a").click()
		
		// clear loading-state
		$probe.removeClass("loading")
	}
	
	var onError = function(xhr, textStatus, errorThrown) {
		failProbe($probe, textStatus + " / " + errorThrown)

		// clear
		$probe.children("code").add(".data").add(".view").html("")
		
		// clear loading-state
		$probe.removeClass("loading")
	}
	
	var script = $probe.attr("data-script")
	var cmd    = $probe.attr("data-cmd")
	var time   = (new Date()).getTime()
	
	var url = "./exec.php?t=" + SOLAR.TOKEN + "&ts=" + time
	
	if (script.length > 0)
		url += "&s=" + script
	else if (cmd.length > 0)
		url += "&c=" + cmd
	else
		throw "probe " + id + " does neither define a script nor a command"
	
	$.ajax({
		url:        url
		, type:	    "GET"
		, dataType: "json"
		
		, success:	onSuccess
		, error: 	onError
	})
}


/*
function runProbeParsers() {
	$(".probe").each(function() {
		runProbeParser( $(this) )
	})
}

function runProbeParser($probe) {
	var id = $probe.attr("id")
	
	var $time = $probe.find("footer > time")
	var $raw  = $probe.children("code")
	var $data = $probe.children(".data")
	
	var parserFun = window["solar_parsers"][id]
	
	// use parser
	if (parserFun) {
		
		// enable view-selector
		$probe.find(".view-selector .view-data").removeClass("hide")
		
		if ($probe.hasClass("parsing")) {
			if (console && console.warn)
				console.warn(["already parsing, skipping parser-run", id])
			return
		}
		
		// set parsing-state
		$probe.addClass("parsing").removeClass("parsed")
		
		try {
			// parse ...
			parserFun($raw.html(), $data)
			
			// fire event
			$probe.trigger('data', [id, $data])
			
			// if nothing is selected, show parsed data as default
			if ($probe.find(".view-selector li.selected").length == 0) {
				$probe.find(".view-selector li.view-data a").click()
			}
			
		} catch (e) {
			if (console && console.error)
				console.error(["parser failed", id, e])
			failProbe($probe, "parser failed")
		}
		
		// set parsed-state
		$probe.removeClass("parsing").addClass("parsed")
			
	// no parser registered
	} else {
		// if nothing is selected, select raw data
		if ($probe.find(".view-selector li.selected").length == 0) {
			$probe.find(".view-selector li.view-raw a").click()
		}
	}
}
*/