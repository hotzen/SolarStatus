$(document).ready(function() {
	
	$("#main-panel").removeClass("hide")
	
	registerExtractFilters()
	registerExtractViews()
	registerExtractRefresh()
	
	runExtractParsers()
})
 

function registerExtractFilters() {
	$("#extract-filters a").click(function() {
		var $a = $(this)
	
		// select filter, deselect all others
		$a.parent("li").addClass("selected").
			siblings("li").removeClass("selected")

		// hide all extracts, then slide-show the relevant
		var filter = $a.attr("data-filter")
		$(".extract").hide().filter( filter ).slideDown("slow")
		
		// stop event-bubbling of link-click
		return false
	})
}

function failExtract($extract, failure) {
	$extract.addClass("failed").find(".failure").text(failure).removeClass("hide")
}

function unfailExtract($extract) {
	$extract.removeClass("failed").find(".failure").addClass("hide").html("")
}

function runExtractParsers() {
	$(".extract").each(function() {
		runExtractParser( $(this) )
	})
}

function runExtractParser($extract) {
	var id = $extract.attr("id")
	
	var $time = $extract.find("footer > time")
	var $raw  = $extract.children("code")
	var $data = $extract.children(".data")
	
	var $history = $extract.children(".history")
	
	var parserFun = window["solar_parsers"][id]
	
	// use parser
	if (parserFun) {
		
		// enable data-selector
		$extract.find(".view-selector .view-data").removeClass("hide")
		
		if ($extract.hasClass("parsing")) {
			if (console && console.warn)
				console.warn(["already parsing, skipping parser-run", id])
			return
		}
		
		// set parsing-state
		$extract.addClass("parsing").removeClass("parsed")
		
		try {
			// parse ...
			parserFun($raw.html(), $data)
			
			// store data in history
			$("<li></li>").appendTo( $history ).append( $time.clone() ).append( $data.clone().removeClass("hide") )
			
			// if nothing is selected, show parsed data as default
			if ($extract.find(".view-selector li.selected").length == 0) {
				$extract.find(".view-selector li.view-data a").click()
			}
			
		} catch (e) {
			if (console && console.error)
				console.error(["parser failed", id, e])
			failExtract($extract, "parser failed")
		}
		
		// set parsed-state
		$extract.removeClass("parsing").addClass("parsed")
	
	// no parser registered
	} else {
		// store raw data in history
		$("<li></li>").appendTo( $history ).append( $time.clone() ).append( $raw.clone().removeClass("hide") )
	
		// if nothing is selected, select raw data
		if ($extract.find(".view-selector li.selected").length == 0) {
			$extract.find(".view-selector li.view-raw a").click()
		}
	}
}

function registerExtractViews() {
	
	// enable view-selector
	$(".extract .view-selector").removeClass("hide")

	// register views for each extract
	$(".extract").each(function() {
		var $extract = $(this)
		var id = $extract.attr("id")
		
		var views = window["solar_views"][id]
		
		if (views) {
			for (var view in views) {
				// TODO: create <li> for selector and <div> container-elements
			}
		}
	})

	// bind view-selector links
	$(".extract .view-selector a").click(function() {
		var $a = $(this)
	
		// select view, deselect all others
		$a.parent("li").addClass("selected").siblings("li").removeClass("selected")
		
		var selView   = $a.attr("data-view")
		var selFilter = $a.attr("data-filter")
		
		var $extract = $a.parents(".extract")
		var id = $extract.attr("id")
		
		var $view = $extract.children( selFilter )
		
		if (window["solar_views"][id]) {
			var views = window["solar_views"][id]
			if (views[selView]) {
				var viewFun = views[selView]
				try {
					//TODO which data to pass? raw vs. data
					//viewFun(raw, $view)
				} catch (e) {
					if (console && console.error)
						console.error(["view failed", id, selView, e])
					failExtract($extract, "view failed")
				}
			}
		}

		// show view, hide all others
		$view.removeClass("hide").siblings().not("header").not("footer").addClass("hide")
		
		// stop event-bubbling of link-click
		return false
	})
}
  
function registerExtractRefresh() {
	// bind auto-refresher to checkbox
	$("#extract-refresh-active").click( autoRefresher )
	
	// enable and bind refresh button
	$(".script-extract .refresh").removeClass("hide").click(function() {
	
		refreshExtract( $(this).parents(".extract") )
		
		// stop event-bubbling of link-click
		return false
	})
}

function autoRefresher() {
	var active = $("#extract-refresh-active").get(0).checked
	if (!active) {
		return
	}
	
	var freq = parseInt( $("#extract-refresh-freq").val() )
	if (freq < 1) {
		return
	}
		
	// refresh all visible extracts
	$(".extract:visible").each(function() {
		refreshExtract( $(this) )
	})
	
	window.setTimeout(autoRefresher, freq * 1000)
}


function refreshExtract($extract) {

	if ($extract.hasClass("loading")) {
		if (console && console.warn)
			console.warn(["already loading, skipping refresh", $extract.attr("id")])
		return
	}
	
	// set loading state
	$extract.addClass("loading")

	unfailExtract($extract)
		
	var script = $extract.attr("data-script")
	var time   = (new Date()).getTime()
	
	var onSuccess = function(data, textStatus, xhr) {
		console.log(["this =?= XHR", this])
	
		// check if error is returned
		if (data.error) {
			return onError(xhr, "apperror", data.message)
		}
		
		// store time in <time>
		var ts = data["time"]
		var d  = new Date(ts)
		var dateTime    = xsd_datetime(ts)
		var dateTimeLbl = datetime(ts)
		
		$extract.find("footer > time").attr("data-timestamp", ts).attr("datetime", dateTime).html( dateTimeLbl )			
		
		// store result in <code>
		var res = data["result"]
		$extract.children("code").html( res.join("\n") )
		
		// run parser
		runExtractParser($extract)
		
		// apply view
		$extract.find(".view-selector li.selected a").click()
		
		// clear loading-state
		$extract.removeClass("loading")
	}
	
	var onError = function(xhr, textStatus, errorThrown) {
		failExtract($extract, textStatus + " / " + errorThrown)

		// clear
		$extract.children("code").add(".data").add(".view").html("")
		
		// clear loading-state
		$extract.removeClass("loading")
	}
	
	$.ajax({
		url:         "./exec.php?s=" + script + "&t=" + T + "&ts=" + time
		, type:	    "GET"
		, dataType: "json"
		
		, success:	onSuccess
		, error: 	onError
	})
}