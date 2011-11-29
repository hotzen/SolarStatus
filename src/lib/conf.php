<?php
function loadConfig() {
	$file = './conf.ini.php';
	$conf = parseIniFile( $file );
		
	$_SERVER['SOLAR_CONFIG'] = $conf;
}

function parseIniFile($file) {
	if (!is_readable($file))
		throw new Exception("conf.ini.php not readable");

	$ini = parse_ini_file($file, true);
	if (!$ini)
		throw new Exception("could not parse conf.ini.php");
	
	$iniUC = uppercaseConfKeys($ini);
	$conf = array(
		  'MACROS'   => array()
		, 'DEVSETS'  => array()
		, 'COMMANDS' => array()
		, 'FILTERS'  => array()
		, 'PROBES'   => array()
	);
		
	$probesAutoOrder = 1000;
	
	foreach ($iniUC as $section => $sectionConf) {
		
		// macros
		if ($section == 'MACROS') {
			foreach ($sectionConf as $name => $value) {
				$macro = '%' . strtoupper($name);
				$conf['MACROS'][$macro] = $value;
			}
		}
		
		// devsets
		else if (preg_match("/DEVSET-(.+)/", $section, $matches)) {
			$match = $matches[1];
			if (!ctype_digit($match))
				throw new Exception("Invalid Non-Numeric ${section}");
				
			$devSetID = (int)$match;
			
			if (!isset($sectionConf['DEV']))
				throw new Exception("DevSet '${section}' without DEV[] directive");
			
			$conf['DEVSETS'][$devSetID] = $sectionConf['DEV'];
		}
				
		// filters
		else if (preg_match("/FILTER-(.+)/", $section, $matches)) {
			$match = $matches[1];
			if (!ctype_digit($match))
				throw new Exception("Invalid Non-Numeric ${section}");
			
			$filterID = (int)$match;

			if (!isset($sectionConf['LABEL']))
				throw new Exception("Filter '${section}' without LABEL directive");
			
			if (!isset($sectionConf['SELECTOR']))
				throw new Exception("Filter '${section}' without SELECTOR directive");
			
			$conf['FILTERS'][$filterID] = $sectionConf;
		}
		
		// probes
		else if (preg_match("/PROBE-(.+)/", $section, $matches)) {
			$match = $matches[1];
			if (preg_match("/[^a-z0-9_]/i", $match))
				throw new Exception("Invalid Special-Chars ${section}");
			
			$probeID = strtolower($match);

			if (!isset($sectionConf['SCRIPT']) && !isset($sectionConf['CMD']))
				throw new Exception("Probe '${section}' without neither SCRIPT nor CMD directive");
			
			if (isset($sectionConf['SCRIPT']) && isset($sectionConf['CMD']))
				throw new Exception("Probe '${section}' with both SCRIPT and CMD directive");
			
			if (!isset($sectionConf['LABEL']))
				throw new Exception("Probe '${section}' without LABEL directive");
			
			if (isset($sectionConf['ORDER'])) {
				$sectionConf['ORDER'] = (int)$sectionConf['ORDER'];
			} else {
				$sectionConf['ORDER'] = ++$probesAutoOrder;
			}
			
			$conf['PROBES'][$probeID] = $sectionConf;
		}
		
		// anything else
		else {
			$conf[$section] = $sectionConf;
		}
	}
	
	// sort
	ksort($conf['FILTERS']);
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