<?php
require 'lib/conf.php';
require 'lib/auth.php';
require 'lib/solar.php';

header('Content-Type: text/javascript');

try {
	loadConfig();
} catch (Exception $e) {
	jsonError( 'NO_CONFIG' );
}

if (!isAuthorized()) {
	jsonError( 'NO_AUTH' );
}

if (!isset($_GET['p'])) {
	jsonError( 'NO_PROBE' );
}

$probeID = strtolower($_GET['p']);

if (!isset($_SERVER['SOLAR_CONFIG']['PROBES'][$probeID])) {
	jsonError( "INVALID_PROBE:${probeID}" );
}

$probeConf = $_SERVER['SOLAR_CONFIG']['PROBES'][$probeID];

try {
	$newToken = generateToken();
	$execTime = time() * 1000;
	
	$res = array(
		'token'  => $newToken,
		'time'	 => $execTime,
		'result' => array()
	);
	
	// SCRIPT
	if (isset($probeConf['SCRIPT'])) {
		$script = $probeConf['SCRIPT'];
		$cmd    = getScriptCmd($script);
		$output = execScript($script);
		
		$res['result'][] = array($cmd, $output);
		
		echo json_encode( $res );
	}
	
	// COMMAND
	elseif (isset($probeConf['CMD'])) {
		$cmds = expandCommand( $probeConf['CMD'] );
		
		foreach ($cmds as $cmd) {
			$output = execRaw($cmd);
			$res['result'][] = array($cmd, $output);
		}
		
		echo json_encode( $res );
	}
	
	// ERROR
	else {
		jsonError( "PROBE_INVALD_CONF:${probeID}" );
	}
		
} catch (Exception $e) {
	$msg = $e->getMessage();
	jsonError( "PROBE_EXEC_FAIL:${probeID}:${msg}" );
}