<?php
require 'lib/conf.php';
require 'lib/auth.php';
require 'lib/solstat.php';

set_time_limit(60);

initSession();
header('Content-Type: text/javascript');

try {
	loadConfig();
} catch (Exception $e) {
	jsonError('NO_CONFIG', 'configuration file conf.ini.php is not readable or contains invalid content');
}

if (!checkAuth()) {
	jsonError('NO_AUTH', 'You are not authenticated');
}

if (!isset($_GET['p'])) {
	jsonError('NO_PROBE', 'No probe was specified');
}

$probeID = strtolower($_GET['p']);

if (!isset($_SERVER['SOLAR_CONFIG']['PROBES'][$probeID])) {
	jsonError('INVALID_PROBE', 'The specified probe is invalid');
}

updateSession();

$probeConf = $_SERVER['SOLAR_CONFIG']['PROBES'][$probeID];

try {
	$start = durationStart();
	$execTime = time() * 1000;
	
	$res = array(
		  'probe'    => $probeID
		, 'time'     => $execTime
		, 'duration' => -1
		, 'result'   => array()
	);
	
	// SCRIPT
	if (isset($probeConf['SCRIPT'])) {
		$script = $probeConf['SCRIPT'];
		$cmd    = getScriptCmd($script);
		$rc     = -1;
		$output = execScript($script, $rc);
		
		$res['result'][] = array($cmd, $rc, $output);
		$res['duration'] = durationStop($start);
		
		echo json_encode( $res );
	}
	
	// COMMAND
	elseif (isset($probeConf['CMD'])) {
		$cmds = expandCommand( $probeConf['CMD'] );
		
		foreach ($cmds as $cmd) {
			$rc = -1;
			$output = execCommand($cmd, $rc);
			$res['result'][] = array($cmd, $rc, $output);
		}
		$res['duration'] = durationStop($start);
		
		echo json_encode( $res );
	}
	
	// ERROR
	else {
		jsonError('CONF', "Invalid Probe-Config", array('probe' => $probeID));
	}
		
} catch (SolarExecException $e) {
	$details = array(
		  'probe' => $probeID
		, 'cmd'   => $e->cmd
	);
	jsonError('EXEC', $e->getMessage(), $details);

} catch (Exception $e) {
	$details = array(
		  'probe' => $probeID
	);
	jsonError('EXEC', $e->getMessage(), $details);
}