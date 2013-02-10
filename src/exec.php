#!/usr/bin/php
<?php
require 'lib/conf.php';
require 'lib/auth.php';
require 'lib/solar.php';

initSession();
header('Content-Type: text/javascript');

try {
	loadConfig();
} catch (Exception $e) {
	jsonError( 'NO_CONFIG' );
}

if (!checkAuth()) {
	jsonError( 'NO_AUTH' );
}

if (!isset($_GET['p'])) {
	jsonError( 'NO_PROBE' );
}

$probeID = strtolower($_GET['p']);

if (!isset($_SERVER['SOLAR_CONFIG']['PROBES'][$probeID])) {
	jsonError( "INVALID_PROBE:${probeID}" );
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
		$res['duration'] = duration($start);
		
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
		$res['duration'] = duration($start);
		
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