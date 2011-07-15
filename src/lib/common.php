<?php
function execScript($script, &$rc = NULL) {
	return execRaw(getScriptPath($script), $rc);
}

// UNCHECKED & UNSAFE
function execRaw($cmd, &$rc = NULL) {
	$rc = NULL;
	
	exec($cmd, $lines, $rc);
	// $out = shell_exec($cmd);
	// $rc = 0;
	// $lines = explode("\n", trim($out));
		
	// if ($rc != 0)
	//     throw new Exception("command '${cmd}' failed with code ${rc}");
	
	return $lines;
}

function getScriptPath($script) {
	if (!preg_match('#^[a-z0-9_]+$#', $script))
		throw new Exception("invalid script '${script}'");

	$path = $_SERVER['SOLAR_CONFIG']['SCRIPT_DIR'] . '/' . $script . '.sh';
	
	if (!file_exists($path))
		throw new Exception("script '${path}' does not exist");
	
	if (!is_executable($path))
		throw new Exception("script '${path}' is not executable");
		
	return $path;
}

function getScriptCmd($script, $lineSep = "\n") {
	$path     = getScriptPath($script);
	$rawLines = explode("\n", file_get_contents($path));
	$lines    = array();
	
	foreach ($rawLines as $rawLine) {
		$line = trim($rawLine);
		
		if (strlen($line) == 0)
			continue;
			
		if (substr($line, 0, 1) == "#")
			continue;
		
		$lines[] = $line;
	}
	
	return implode($lineSep, $lines);
}

function getCommand($cmdID) {

	if (!isset($_SERVER['SOLAR_CONFIG']['COMMANDS']))
		throw new Exception("no commands configured");
		
	if (!isset($_SERVER['SOLAR_CONFIG']['COMMANDS'][$cmdID]))
		throw new Exception("command '${cmdID}' is not configured");
	
	return $_SERVER['SOLAR_CONFIG']['COMMANDS'][$cmdID];
}


// expands all variables used in a command and returns an array of
// expanded, raw commands that can be directly passed to execRaw
function expandCommand($cmd) {
	$vars = array();
	
	if (isset($_SERVER['SOLAR_CONFIG']['SMARTCTL'])) {
		$vars['%SMARTCTL'] = $_SERVER['SOLAR_CONFIG']['SMARTCTL'];
	}
	
	if (isset($_SERVER['SOLAR_CONFIG']['NICSTAT'])) {
		$vars['%NICSTAT'] = $_SERVER['SOLAR_CONFIG']['NICSTAT'];
	}
	
	// expand variables
	$cmdVarExp = expandVars($cmd, $vars);

	// expand dev-sets
	$cmdsDevSetExp = expandDevSets( $cmdVarExp );
	
	// check for invalid variables
	foreach ($cmdsDevSetExp as $cmdDevSetExp) {
		if (preg_match('/(%.+)/', $cmdDevSetExp, $matches))
			throw new Exception("invalid variable '${matches[1]}' used in command '${cmd}'");
	}
	
	// done
	return $cmdsDevSetExp;
}

function expandDevSets( $cmdIn ) {
	$cmdsWork = array( $cmdIn );
	$cmdsDone = array();
	
	if (!isset($_SERVER['SOLAR_CONFIG']['DEVSETS']))
		throw new Exception("no Dev-Sets configured");
	$devsets = $_SERVER['SOLAR_CONFIG']['DEVSETS'];
	
	while (($cmd = array_shift($cmdsWork)) !== NULL) {
		if (($devSetID = extractDevSetID($cmd)) !== NULL) {
			if (!isset($devsets[$devSetID]))
				throw new Exception("invalid devset '${devSetID}' used in cmd '${cmdIn}'");
			$devSet = $devsets[$devSetID];
			foreach ($devSet as $dev) {
				$cmdsWork[] = expandDevSetID($cmd, $devSetID, $dev);
			}
		} else {
			$cmdsDone[] = $cmd;
		}
	}
	return $cmdsDone;
}

function extractDevSetID($cmd) {
	if (preg_match('/%DEVSET\-(\d+)/', $cmd, $matches))
		return $matches[1];
	else
		return NULL;
}

function expandDevSetID($cmd, $devSetID, $val) {
	$var = "%DEVSET-${devSetID}";
	return expandVars($cmd, array($var => $val));
}

function jsonError($msg) {
	$err = array(
		"error"   => true,
		"message" => $msg
	);
	echo json_encode( $err );
	exit;
}

function expandVars($str, array $vars1, array $vars2 = array(), array $vars3 = array()) {
	$vars = array_merge($vars1, $vars2, $vars3);
	return str_replace(array_keys($vars), array_values($vars), $str);
}

function splitTrim($str, $sep, $isRegex = false) {
	$arr   = ($isRegex) ? split($sep, $str) : explode($sep, $str);
	$split = array();
	foreach ($arr as $elem) {
		$trim = trim($elem);
		if (strlen($trim) > 0)
			$split[] = $trim;
	}
	return $split;
}

function displayException(Exception $e) {
	$clazz = get_class($e);
	$msg   = $e->getMessage();
	$trace = $e->getTraceAsString();
	echo "<h1>The Exception ${clazz} was raised</h1>";
	echo "<h3>${msg}</h3>";
	echo "<pre>${trace}</pre>";
}
