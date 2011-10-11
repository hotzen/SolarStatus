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
	
	// apply selected filter or auto-select overview
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
	
	var id = $probe.attr("id")
	
	if ($probe.hasClass("loading")) {
		if (console && console.warn)
			console.warn(["already loading, skipping refresh", $probe.attr("id")])
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
			var resOut    = resOutArr.join("\n").replaceEntities()
			
			var $rawRes = $( document.createElement("div") ).appendTo( $raw ).addClass("result")
			$( document.createElement("code") ).appendTo( $rawRes ).html( resCmd )
			$( document.createElement("pre")  ).appendTo( $rawRes ).html( resOut )
			
			if (i % 2 == 0)
				$rawRes.addClass("even")
			else
				$rawRes.addClass("odd")
			
			if (i == 0) 
				$rawRes.addClass("first")
			if (i == resArr.length-1)
				$rawRes.addClass("last")
			
			// generate Solar-Overview for this probe
			generateOverview(id, resOutArr)
						
			// trigger probe-event
			$probe.trigger('probe', [id, resCmd, resOutArr, containerElem, parserCallback])
		}
								
		// apply view
		$probe.find(".view-selector li.selected a").click()
		
		// clear loading-state
		$probe.removeClass("loading")
	}
	
	var onError = function(xhr, errorType, error) {
		failProbe($probe, errorType + ": " + error)

		// clear
		$probe.children("code").add(".data").add(".view").html("")
		
		// clear loading-state
		$probe.removeClass("loading")
		
		if (error == "NO_AUTH") {
			if (confirm("No Authentication\n\nReload and display login-form?")) {
				window.location.reload()
			}
		}
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

function requestOverview() {
	var $overview = $( "#overview" )
	var $overviewList = $overview.find("ul")
	console.log( $overviewList.length )
	
	var cssID = function(name) { return "#" + name }
	var probes = solov_probes().map(cssID).join(", ")
		
	if (probes.length == 0) {
		if (console && console.warn)
			console.warn("solov_probes() did not specify any probes, aborting overview")
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
		var fn = "solov_process_" + probe
		if (typeof(window[fn]) === 'undefined') {
			if (console && console.log)
				console.log(["no solov_process_<probe> defined for probe", probe])
			return
		}
		
		var res = window[fn](data)
		
		if (res && res.length && res.length > 0) {
			// add each result-item as a <li>
			for (var i=0; i<res.length; i++) {
				var item = res[i]
				var $li  = $("<li></li>")
				$li.append( $("<label></label>").text( item[0] ) )
				$li.append( item[1] )
			
				$overviewList.append( $li )
			}
		} else {
			if (console && console.warn)
				console.warn([fn, "no result"])
		}
	} catch(ex) {
		if (console && console.error)
			console.error([fn, "failed", (ex.toString) ? ex.toString() : ex])
	}
}