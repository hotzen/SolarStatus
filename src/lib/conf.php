<?php
function loadConfig() {
	$file = './conf.ini.php';
	$conf = parseIniFile( $file );
	
	$_SERVER['SOLAR_CONFIG'] = $conf;
}

function parseIniFile($file) {
	if (!is_readable($file))
		die("Config-File not readable");

	$ini = parse_ini_file($file, true);
	if (!$ini)
		throw new Exception("Could not load configuration-file");
	
	$iniUC = uppercaseConfKeys($ini);
	$conf = array(
		  'DEVSETS'  => array()
		, 'COMMANDS' => array()
		, 'FILTERS'  => array()
		, 'PROBES'   => array()
	);
	
	foreach ($iniUC as $section => $sectionConf) {
		
		// devsets
		if (preg_match("/DEVSET-([0-9]+)/i", $section, $matches)) {
			$devSetID = (int)$matches[1];

			if (!isset($sectionConf['DEV']))
				throw new Exception("DevSet '${section}' does not have DEV[] directive");
			
			$conf['DEVSETS'][$devSetID] = $sectionConf['DEV'];
		}
				
		// filters
		else if (preg_match("/FILTER-([0-9]+)/i", $section, $matches)) {
			$filterID = (int)$matches[1];

			if (!isset($sectionConf['LABEL']))
				throw new Exception("Filter '${filterID}' without LABEL directive");
			
			if (!isset($sectionConf['SELECTOR']))
				throw new Exception("Filter '${filterID}' without SELECTOR directive");
			
			$conf['FILTERS'][$filterID] = $sectionConf;
		}
		
		// probes
		else if (preg_match("/PROBE-([a-z0-9_]+)/i", $section, $matches)) {
			$probeID = strtolower($matches[1]);

			if (!isset($sectionConf['SCRIPT']) && !isset($sectionConf['CMD']))
				throw new Exception("Probe '${probeID}' without neither SCRIPT nor CMD directive");
				
			if (isset($sectionConf['SCRIPT']) && isset($sectionConf['CMD']))
				throw new Exception("Probe '${probeID}' with both SCRIPT and CMD directive");
						
			$conf['PROBES'][$probeID] = $sectionConf;
		}
		
		// commands
		else if ($section == 'COMMANDS') {
			foreach ($sectionConf as $cmdID => $cmd) {
				$cmdID_LC = strtolower($cmdID);
				$conf['COMMANDS'][$cmdID_LC] = $cmd;
			}
		}
		
		// anything else
		else {
			$conf[$section] = $sectionConf;
		}
	}
	
	// sort filters
	ksort($conf['FILTERS']);
	
	// sort probes
	$probesAutoOrder = 1000;
	foreach ($conf['PROBES'] as $probeID => $probeConf) {
		if (!isset($probeConf['ORDER'])) {
			$probeConf['ORDER'] = ++$probesAutoOrder;
		} else {
			$probeConf['ORDER'] = (int)$probeConf['ORDER'];
		}
		$conf[$probeID] = $probeConf;
	}
	uasort($conf['PROBES'], 'probeComparator');
	
	return $conf;
}


function uppercaseConfKeys($conf) {
	$uc = array();
	
	foreach ($conf as $key => $val) {
		$keyUC = strtoupper($key);
		if (is_array($val))
			$uc[$keyUC] = uppercaseConfKeys($val);
		else
			$uc[$keyUC] = $val;
	}
	return $uc;
}

function probeComparator($p1, $p2) {
	$o1 = $p1['ORDER'];
	$o2 = $p2['ORDER'];
	
	if ($o1 == $o2)
		return 0;
	return ($o1 < $o2) ? -1 : +1;
}