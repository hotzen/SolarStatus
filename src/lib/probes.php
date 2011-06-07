<?php
// function createScriptProbeSkeleton($id, $label, $groups) {
	// $script = $id;
	// $out = <<<EOC
// <div id="${id}" class="probe group-all ${groups}" data-script="${script}">
	// <header>
		// <h1>${label}</h1>
		// <ul class="view-selector">
			// <li class="view-raw"><a href="#raw" title="View raw data" data-filter="code">Raw</a></li>
			// <li class="view-data hide"><a href="#data" title="View parsed data" data-filter=".data">Parsed</a></li>
		// </ul>
		// <a href="#refresh" class="refresh" title="refresh data"></a>
		// <div class="failure hide"></div>
	// </header>
	// <code></code>
	// <div class="data"></div>
	// <footer>
		// <time datetime="" data-timestamp=""></time>
	// </footer>
// </div>

// EOC;
	// return $out;
// }

// function createScriptProbeSkeleton($id, $label, $groups) {
	// $ts  = time();
	// $out = execScript($id, $error);
	
	// if ($out) {
		// $oneOut = implode("\n", $out);
	// } else {
		// $oneOut = array();
	// }
		
	// return createProbe($id, $oneOut, $error, $ts, $label, $groups . " script-probe");
// }


// function displayProbeGroup($group) {
	// if (!isset($_REQUEST['pg'])
		// return false;
	
	// $pg = $_REQUEST['pg'];
	// return ($pg == 'all' || $pg == $group);	
// }

// function createProbeGroupURL($groups) {
	// $self  = $_SERVER['PHP_SELF'];
	// $token = generateToken();
	
	// if (!is_array($groups))
		// $groups = array($groups);
	
	// $groupParams = "";
	// foreach ($groups as $group) {
		// $groupParams .= "&pg[]=${group}";
	// }
	
	// $url = "${self}?t=${token}${groupParams}";
	// return $url;
// }

// function createProbe($id, $output, $error, $ts, $label, $groups) {

	// $tsMillis	 = $ts * 1000;
	// $dateTime    = strftime("%Y-%m-%dT%H:%M:%SZ", $ts);
	// $dateTimeLbl = strftime("%Y-%m-%d %H:%M:%S",  $ts);

	// $hideFailure = ($error) ? "" : "hide";
	
	// $out = <<<EOC
// <div id="${id}" class="probe group-all ${groups}" data-script="${id}">
	// <header>
		// <h1>${label}</h1>
		// <ul class="view-selector hide">
			// <li class="view-raw"><a href="#raw" title="View raw data" data-filter="code"  data-view="">Raw</a></li>
			// <li class="view-data hide"><a href="#data" title="View parsed data" data-filter=".data" data-view="">Parsed</a></li>
			// <li class="view-history"><a href="#history" title="View historic data" data-filter=".history" data-view="">History</a></li>
		// </ul>
		// <a href="#refresh" class="refresh hide" title="refresh data"></a>
		// <div class="failure ${hideFailure}">${error}</div>
	// </header>
	// <code>${output}</code>
	// <div class="data hide"></div>
	// <ol class="history hide"></ol>
	// <footer>
		// <time datetime="${dateTime}" data-timestamp="{$tsMillis}">${dateTimeLbl}</time>
	// </footer>
// </div>
// EOC;
	// return $out;
// }


// function createScriptProbe($id, $label, $groups) {
	// $out = $error = NULL;
	
	// $ts  = time();
	// $out = execScript($id, $error);
	
	// if ($out) {
		// $oneOut = implode("\n", $out);
	// } else {
		// $oneOut = array();
	// }
		
	// return createProbe($id, $oneOut, $error, $ts, $label, $groups . " script-probe");
// }

// function createCmdProbe($id, $cmd, $label, $groups) {
	// $out = $error = NULL;
	
	// $ts  = time();
	// $out = exec_direct($cmd, $error);
	
	// if ($out) {
		// $oneOut = implode("\n", $out);
	// } else {
		// $oneOut = array();
	// }
		
	// return createProbe($id, $oneOut, $error, $ts, $label, $groups . " cmd-probe");
// }


// function createSmartMonToolsProbes() {
	// $smartctl = $_SERVER['SOLAR_CONFIG']['SMARTCTL'];
	// $probes = array();
		
	// foreach ($_SERVER['SOLAR_CONFIG']['SMARTMON']['SETS'] as $set) {
		// $label = $set['LABEL'];
		
		// foreach ($set['DEVICES'] as $dev) {
			// $devID = trim(preg_replace('/[^a-z0-9]+/', '_', $dev), '_');
			// $count = 0;
			
			// foreach ($set['CMDS'] as $cmd => $cmdLabel) {
				// $count++;
				// $probeID = "smartmon-${devID}-${count}";

				// $commonVars = array(
					// '%DEV' => $dev
				// );
				// $cmdVars = array(
					// '%SMARTCTL'	=> $smartctl,
				// );
				// $labelVars = array(
					// '%ID'  => $probeID,
					// '%CMD' => $cmdLabel
				// );
				
				// $devCmd = translateVars($cmd, $commonVars, $cmdVars);
				// $label  = translateVars($set['LABEL'], $commonVars, $cmdVars, $labelVars);
				
				// $probes[] = createCmdProbe($probeID, $devCmd, $label, "group-smartmon");
			// }
		// }
	// }

	// return implode("\n\n", $probes);
// }

