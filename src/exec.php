<?php
require 'lib/conf.php';
require 'lib/auth.php';
require 'lib/common.php';

header("Content-Type: text/javascript");

try {
	loadConfig();
} catch (Exception $e) {
	jsonError("NO_CONFIG");
}

if (!isAuthorized()) {
	jsonError("NO_AUTH");
}

// SCRIPT
if (isset($_GET["s"]) ) {
	try {
		$script = $_GET["s"];
		
		$output    = execScript($script);
		$scriptCmd = getScriptCmd($script);
				
		$res = array(
			"token"  => generateToken(),
			"script" => $script,
			"time"	 => (time() * 1000),
			"result" => array()
		);
		$res['result'][] = array($scriptCmd, $output);
		
		echo json_encode( $res );
	} catch (Exception $e) {
		jsonError( $e->getMessage() );
	}
}

// COMMAND
else if (isset($_GET["c"]) ) {
	try {
		$cmdID = $_GET["c"];
		
		$res = array(
			"token"  => generateToken(),
			"cmd"    => $cmdID,
			"time"	 => (time() * 1000),
			"result" => array()
		);
	
		$cmdIn = getCommand($cmdID);
		$cmds  = expandCommand($cmdIn);
		
		foreach ($cmds as $cmd) {
			$res['result'][] = array($cmd, execRaw($cmd));
		}
		
		echo json_encode( $res );
		
	} catch (Exception $e) {
		jsonError( $e->getMessage() );
	}
}

else {
	jsonError( "NO_INPUT" );
}