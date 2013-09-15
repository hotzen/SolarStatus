<?php
require 'lib/conf.php';
require 'lib/auth.php';
require 'lib/solstat.php';

ignore_user_abort( 0 );
set_time_limit( $_SERVER['SOLAR_CONFIG']['PROBE_TIMEOUT'] );

initSession();
header('Content-Type: text/javascript');

try {
	loadConfig();
} catch (Exception $e) {
	jsonError('NO_CONFIG', 'configuration file conf.ini.php is not readable or contains invalid content');
}

if (!checkAuth()) {
	jsonError('NO_AUTH', 'no authentication');
}

if (!isset($_GET['p'])) {
	jsonError('NO_PROBE', 'no probe specified');
}

$probeID = strtolower($_GET['p']);

if (!isset($_SERVER['SOLAR_CONFIG']['PROBES'][$probeID])) {
	jsonError('INVALID_PROBE', 'invalid probe specified');
}

updateSession();


$DEBUG = isset($_REQUEST['debug']);

$probeConf = $_SERVER['SOLAR_CONFIG']['PROBES'][$probeID];
if ($DEBUG) jsonDebug("PROBE-CONF", $probeConf);

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
		if ($DEBUG) jsonDebug("SCRIPT-COMMAND", $cmd);

		$rc     = -1;
		$output = execScript($script, $rc);
		
		$res['result'][] = array($cmd, $rc, $output);
		$res['duration'] = durationStop($start);
		
		echo json_encode( $res );
	}
	
	// COMMAND
	elseif (isset($probeConf['CMD'])) {
		$cmds = expandCommand( $probeConf['CMD'] );
		if ($DEBUG) jsonDebug("EXPANDED COMMAND", $cmds);

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
		jsonError('CONF', "invalid probe-config", array('probe' => $probeID));
	}
		
} catch (InvalidCommandException $e) {
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
