(function() {
var
	auth = true,
	viewHandlers = {},
	overviewHandlers = {},
	overviewOrder = [];

$(document).ready( init )
$(window).resize( repositionContent )

function API() { }
API.prototype = {
	// register view-handler
	view: function(probeID, fn) {
		if (viewHandlers[probeID]) {
			viewHandlers[probeID].push( fn )
		} else {
			viewHandlers[probeID] = [ fn ]
		}
	},
	
	// register overview-handler
	overview: function(probeID, fn) {
		if (overviewHandlers[probeID]) {
			overviewHandlers[probeID].push( fn )
		} else {
			overviewHandlers[probeID] = [ fn ]
			overviewOrder.push( probeID )
		}
	}
}
window.SolarStatus = new API();

function init() {
	$(".hide").hide().removeClass("hide")
	
	initOverview()
	
	registerSettings()
	registerProbeRefresh()
	registerProbeViews()
	registerProbeButtons()
	
	registerFilters()
	selectFilter()
	
	repositionContent()
}

function repositionContent() {
	var panelHeight = $("#panel").outerHeight(true) // including margin
	$("#overview, #probes").css({ marginTop: panelHeight + 'px' })
}

function registerSettings() {
	$ul = $("#settings").children("ul")
	
	$("#settings").hoverIntent({
		over:    over,
		out:     out,
		timeout: 200
	})
	
	function over() {
		$ul.animate({ width: 'show' }, 100, "swing", over2)
	}
	function over2() {
		$ul.animate({ height: 'show' }, 300)
	}
	
	function out() {
		$ul.animate({ width: 'hide' }, 100, "swing", out2)
	}
	function out2() {
		$ul.animate({ height: 'hide' }, 300)
	}

	$("#settings").click(function(evt) {
		evt.stopPropagation()
	})
}

function registerFilters() {
	$("#filters").on("click", "li", function(evt) {
		var $li = $(this)
		var $a = $li.children("a")
		
		// hide and deactivate all probes
		$(".probe").hide().removeClass("active")
		
		// check if the same filter is selected again
		var $alreadySelected = $("#filters .selected")
		var sameFilter = $li.is($alreadySelected)
		
		// mark filter as selected, unmark others
		$li.addClass("selected").siblings().removeClass("selected")
		
		if ($li.is(".overview")) {
		
			showOverview()

		} else {
			var sel = $a.data("selector")
			var $probes = $( sel )
			
			hideOverview()

			// activate and display referenced probes
			$probes.addClass("active").slideDown("slow")

			// refresh non-confirm probes
			$probes.not(".confirm").each(function() {
				refreshProbe( $(this) )
			})
		}
		
		// update browser history
		// https://developer.mozilla.org/en-US/docs/DOM/Manipulating_the_browser_history
		if (!sameFilter && window.history.pushState) {
			var label = $a.text()
			var href  = $a.attr("href")
			var state = {
				filter: true,
				hash:   href
			}
			window.history.pushState(state, "Filter " + label, href);
		}
		
		repositionContent()
		
		evt.preventDefault()
		evt.stopPropagation()
	})

	// https://developer.mozilla.org/en-US/docs/DOM/Manipulating_the_browser_history
	// A popstate event is dispatched to the window every time the active history entry changes
	window.onpopstate = function(evt) {
		if (evt.state && evt.state.filter)
			filterByHash( evt.state.hash )
	}
}

function selectFilter() {

	// select by url-hash (# + <fragment>)
	if (window.location.hash && filterByHash( window.location.hash )) {
		return; // successfully applied, exit
	}
		

	// select default
	var $defaultFilter = $("#filters .default a")
	if ($defaultFilter.length > 0) {
		$defaultFilter.click()
		return; // successfully applied, exit
	}
		
	// select overview
	var $overviewFilter = $("#filters .overview a")
	if ($overviewFilter.length > 0) {
		$overviewFilter.click()
		return; // successfully applied, exit
	}
	
	// default: select first
	var $firstFilter = $("#filters li:not(.overview):first a")
	$firstFilter.click()
}

function filterByHash(hash) {
	return (hash.length > 1) ? filterByFragment( hash.substring(1) )
	                         : false;
}

function filterByFragment(frag) {
	var $a = $("#filters li").find("a[name=" + frag + "]").click()
	return ($a.length > 0);
}

function failProbe($probe, failure) {
	$probe.addClass("failed").find(".failure").text(failure).show()
}

function unfailProbe($probe) {
	$probe.removeClass("failed").find(".failure").hide().empty()
}

function registerProbeViews() {
	$(".probe .view-selector").on("click", "li", function(evt) {
		var $li = $(this)
		var $probe = $li.closest(".probe")
		var $content = $probe.children(".content")
		var sel = $li.data("selector")
		
		// mark selector as selected
		$li.addClass("selected")
			.siblings().removeClass("selected");
		
		// display view and mark as selected
		$content.children( sel ).addClass("selected").show()
			.siblings().removeClass("selected").hide();
		
		evt.preventDefault()
		evt.stopPropagation()
	})
}
  
function registerProbeRefresh() {
	// bind auto-refresher to checkbox
	$("#probe-refresh-toggle").click( autoRefresher )
	
	// enable and bind refresh button
	$(".probe a.refresh").click(function(evt) {
		var $probe = $(this).closest(".probe")
		refreshProbe($probe)
		
		evt.preventDefault()
		evt.stopPropagation()
	})
}

function registerProbeButtons() {
	$(".probe a.select").click(function(evt) {
		var $probe = $(this).closest(".probe")
		selectProbeText($probe)
		
		evt.preventDefault()
		evt.stopPropagation()
	})

	$(".probe a.fullsize").click(function(evt) {
		var $probe = $(this).closest(".probe")
		viewFullProbe($probe)
		
		evt.preventDefault()
		evt.stopPropagation()
	})
}

function selectProbeText($probe) {
	var $selectedContent = $probe.find(".content .selected")
	
	var $elem = $selectedContent.is(".original") ? $selectedContent.find("pre")
												 : $selectedContent;
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
	$probe.find(".content").toggleClass("fullview")
}

function autoRefresher() {
	var active = $("#probe-refresh-toggle").get(0).checked
	if (!active)
		return;
	
	var freq = parseInt( $("#probe-refresh-freq").val() )
	if (freq < 1)
		return;
	
	// refresh all active, non-confirmable probes
	$(".probe.active").not(".confirm").each(function() {
		refreshProbe( $(this) )
	})
	
	window.setTimeout(autoRefresher, freq * 1000)
}

function refreshProbe($probe, force) {
	if (!$probe || !$probe.is(".probe")) {
		console.error("invalid $probe", $probe)
		return;
	}

	var probeID = $probe.attr("id")
	var force = (force === true)
		
	// already/still loading
	if ($probe.is(".loading")) {
		console.info("probe already loading, skipping refresh", probeID)
		return;
	}

	// confirm?
	if ($probe.is(".confirm") && !force) {
		var label  = $probe.find("header h1").text()
		var text   = $probe.data("confirm")
		var prompt = "Please confirm to refresh the probe\n  " + label + "\n\n" + text
		
		if (!confirm(prompt))
			return;
	}
	
	// initialize
	$probe.addClass("loading")
	$probe.find(".content .selected").removeClass(".selected")
	
	unfailProbe($probe)
	
	var dfd = $.Deferred()
	
	// GET JSON
	var ts = (new Date()).getTime()
	$.ajax({
		  url:      "probe.php?p=" + probeID + "&ts=" + ts
		, type:     "GET"
		, dataType: "json"
		, timeout:  60*1000 // 1 minute
		, success:  onSuccess
		, error:    onError
	})
	
	function onSuccess(data, textStatus, xhr) {
		// error is returned
		if (data.error) {
			var detailsArr = []
			var errorCode = data.code
			var errorMsg  = data.msg
			
			if (data.details)
				errorMsg += ' (' + dump(data.details) + ')';
			
			// pass control to error-handler
			return onError(xhr, errorCode, errorMsg)
		}
		
		// clear original output
		var $original = $probe.find(".content .original").empty()
		
		// store time in <time>
		var ts = parseInt(data["time"])
		$probe.find("footer time")
			.data("timestamp", ts)
			.attr("datetime", dateTimeXSD(ts))
			.text( dateTimeText(ts) );
		
		// process result-array (one entry per executed command)
		var resArr = data["result"]
		for (var i=0; i<resArr.length; ++i) {
			var res = resArr[i]
			var cmd = res[0]
			var rc  = res[1]
			var out = res[2]
			var lines = out.splitLines()
			
			// replace NL with carriage-return-style arrow
			var cmdText = cmd.replace(/\n/g, "&nbsp;&crarr;") 
			
			// insert NL after "&&" if command is too long
			if (cmdText.length > 150) { 
				cmdText = cmdText.replace(/\&\&/g, "&&\n&nbsp;")
			}
			
			var outText = out.replaceEntities()
			
			// create a dedicated <div>.result
			var $result = $( document.createElement("div") )
				.addClass("result")
				.appendTo( $original );
			
			// put command into <code>
			$( document.createElement("code") )
				.addClass("cmd")
				.attr("title", "Executed Command")
				.appendTo( $result )
				.html( cmdText );
			
			// put RC into another <code>
			$( document.createElement("code") )
				.addClass("rc")
				.attr("title", "Return Code (0 = OK)")
				.appendTo( $result )
				.html( rc );
			
			// put output into <pre>
			$( document.createElement("pre")  )
				.appendTo( $result )
				.html( outText );
			
			$result.addClass( (i % 2 == 0) ? "odd" : "even" ) // treat 0 as 1

			if (i == 0)
				$result.addClass("first")
			if (i == resArr.length-1)
				$result.addClass("last")

			// let views process the output
			callViewHandlers(probeID, $probe, cmd, rc, lines)
		}

		// clear loading-state
		$probe.removeClass("loading")
		
		// OK
		dfd.resolve(probeID, cmd, rc, lines)
	}
	
	function onError(xhr, errorType, error) {
	
		// display failure
		failProbe($probe, "[" + errorType + "] " + error)

		// clear output
		$probe.find(".content .original").empty()
		
		// clear loading-state
		$probe.removeClass("loading")
		
		if (errorType == "NO_AUTH") {
			// first notice that auth is expired, ask to login again
			if (auth && confirm("Authentication is expired.\n\nDo you want to login?")) {
				window.location.reload()
			}
			
			// register expiration
			auth = false
		}
		
		// fail
		dfd.reject(probeID, xhr, errorType, error )
	}
	
	return dfd.promise();
}

function callViewHandlers(probeID, $probe, cmd, rc, lines) {
	if (!viewHandlers[probeID])
		return; // no handlers registered, exit

	var $selector = $probe.find("header .view-selector")
	var $content = $probe.find(".content")
	
	// reset
	$selector.hide().children().not(".original").remove()
	$content.children().not(".original").remove()
	
	var handlers = viewHandlers[probeID]
	var promises = []
	
	for (var i=0; i<handlers.length; i++) {
		var promise = callViewHandler(handlers[i], probeID, $probe, cmd, rc, lines)
		promises.push( promise )
	}
	
	$.when.apply($, promises).always(function() {
		// show selector and select first view
		$selector.show().find("li").not(".original").filter(":first").find("a").click()
	})
}

function callViewHandler(handler, probeID, $probe, cmd, rc, lines) {
	var $selector = $probe.find("header .view-selector")
	var $content = $probe.find(".content")
	
	var dfd = $.Deferred()
		
	function resultCallback(label, view) {
		var viewID = "view-" + uid()
		var $sel = $("<li data-selector=\"." + viewID + "\"></li>").appendTo( $selector )
		$("<a href=\"#view\" title=\"Select View\"></a>").appendTo( $sel ).append( label );
		$("<div class=\"view " + viewID + "\"></div>").appendTo($content).append( view );
	}
	
	function doneCallback() {
		dfd.resolve( )
	}
	
	try {
		handler(cmd, rc, lines, resultCallback, doneCallback)
	} catch(ex) {
		var msg = (ex.toString) ? ex.toString() : ex
		console.error("view-handler failed", probeID, msg)
		
		dfd.reject( ex )
	}
	
	return dfd.promise();
}

function initOverview() {

	// show/remove overview-filter
	if (overviewOrder.length > 0) {
		$("#filters .overview").show()
	} else {
		$("#filters .overview").remove()
	}
}

function showOverview() {
	var $overview = $("#overview")
	
	// hide all probes
	$(".probe").hide()
	
	// reset table-container
	var $table = $overview.find("table")
	$table.children().remove()
	
	// show overview
	$overview.addClass("loading").not(":visible").show()
	
	// process in correct order
	// XXX for each probeID the *first* overview-registration determines the order of all overviews of this probeID
	var promises = []
	for (var i=0; i<overviewOrder.length; i++) {
		var probeID = overviewOrder[i]
		var $probe = $("#" + probeID)
		
		if ($probe.length > 0) {
			var $tbody = $("<tbody></tbody>").appendTo( $table )
			var handlers = overviewHandlers[probeID]
			var promise = createOverview(probeID, handlers, $probe, $tbody)
			promises.push( promise )
		}
	}
	
	$.when.apply($, promises).always(function() {
		$overview.removeClass("loading")
	})
}

function hideOverview() {
	var $overview = $("#overview")
	$overview.removeClass("loading").hide()
}

function createOverview(probeID, handlers, $probe, $tbody) {
	var dfd = $.Deferred()
	
	refreshProbe($probe, true /* FORCE */).then(onRefresh, onError);
	
	function onRefresh(probeID, cmd, rc, lines) {
		var overviewsCalled = []
		for (var i=0; i<handlers.length; i++) {
			var promise = callOverviewHandler(handlers[i], probeID, $probe, $tbody, cmd, rc, lines)
			overviewsCalled.push( promise )
		}
		$.when( overviewsCalled ).then(function() {
			dfd.resolve()
		})
	}
	
	function onError(probeID, xhr, errorType, error) {
		console.error("could not refresh overview-probe", probeID, xhr, errorType, error)
		dfd.resolve()
	}
	
	return dfd.promise()
}

function callOverviewHandler(handler, probeID, $probe, $tbody, cmd, rc, lines) {
	var dfd = $.Deferred()
	
	function resultCallback(label, view) {
		var $tr = $( document.createElement("tr") ).appendTo( $tbody );
		
		$( document.createElement("th") ).addClass("label")
			.appendTo( $tr )
			.append( label );
		
		$( document.createElement("td") ).addClass("view")
			.appendTo( $tr )
			.append( view );
	}

	function doneCallback() {
		dfd.resolve()
	}

	try {
		handler(cmd, rc, lines, resultCallback, doneCallback)
	} catch(ex) {
		console.error("overview-handler failed", probeID, ex)
		dfd.resolve()
	}
	
	return dfd.promise();
}

return new API();
})();