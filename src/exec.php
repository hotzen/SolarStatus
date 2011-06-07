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
	$script = $_GET["s"];
	
	try {
		$output = execScript($script);

		$scriptCmdLinesRaw = explode("\n", file_get_contents(getScriptPath($script)));
		$scriptCmdLines    = array();
		
		foreach ($scriptCmdLinesRaw as $lineRaw) {
			$line = trim($lineRaw);
			if (strlen($line) > 0 && substr($line, 0, 1) != "#") {
				$scriptCmdLines[] = $line;
			}
		}
		$scriptCmd = implode("\n", $scriptCmdLines);
		
		$res = array(
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
	$cmdID = $_GET["c"];
	
	try {
		$res = array(
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
	echo jsonError( "NO_INPUT" );
}