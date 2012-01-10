<?php
class SolarExecException extends Exception {
	var $cmd;
	
	public function __construct($message, $cmd) {
	  parent::__construct($message);
	  $this->cmd = $cmd;
	}
}

function execScript($script, &$rc = NULL) {
	return execRaw(getScriptPath($script), $rc);
}

// RAW, UNCHECKED, UNSAFE
function execRaw($cmd) {
	$lines = array();	
	
	$h = popen("${cmd} 2>&1", 'r');
	
	if (!is_resource($h))
		throw new SolarExecException("Could not open Process", $cmd);
	
	$out = '';
	do {
		$o = fread($h, 2048);
		if ($o === false)
			break;
		else
			$out .= $o;
	} while(!feof($h));
	
	$lines = explode("\n", $out);
	
	pclose($h);
	
	// $desc = array(
		  // 0 => array('pipe', 'r') // STDIN
		// , 1 => array('pipe', 'w') // STDOUT
		// , 2 => array('pipe', 'w') // STDERR
	// );
	// $cwd = NULL; // $_SERVER['DOCUMENT_ROOT'];
	// $env = NULL; //array();
	
	// $p = proc_open($cmd, $desc, $pipes, $cwd, $env);
	
	// if ($p === false || !is_resource($p))
		// throw new SolarExecException("Could not open Process", $cmd);
	
	// var_dump( proc_get_status($p) ); 
	
	// $pIn  = $pipes[0];
	// $pOut = $pipes[1];
	// $pErr = $pipes[2];
	
		
	// $err = stream_get_contents($pErr);
	// $out = stream_get_contents($pOut);
	
	// fclose($pIn);
	// fclose($pOut);
	// fclose($pErr);
	
	// if (strlen($err) > 0)
		// throw new SolarExecException($err, $cmd);
	
	// $lines = explode("\n", trim($out));
	
	//exec($cmd, $lines, $rc);
	//if ($rc != 0)
	//	throw new SolarExecException("Execution failed", -1, $cmd);
	
	return $lines;
}

function getScriptPath($script) {
	if (!preg_match('#^[a-z0-9_]+$#', $script))
		throw new Exception("invalid script '${script}'");

	$path = $_SERVER['SOLAR_CONFIG']['DIR_SCRIPTS'] . '/' . $script . '.sh';
	
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


// expands all variables used in a command and returns an array of
// expanded, raw commands that can be directly passed to execRaw
function expandCommand($cmd) {
	if (isset($_SERVER['SOLAR_CONFIG']['MACROS'])) {
		$macros = $_SERVER['SOLAR_CONFIG']['MACROS'];
	} else {
		$macros = array();
	}
	
	// expand macros
	$cmdVarExp = expandVars($cmd, $macros);

	// expand dev-sets
	$cmdsDevSetExp = expandDevSets( $cmdVarExp );
	
	// check for invalid variables
	/*
	foreach ($cmdsDevSetExp as $cmdDevSetExp) {
		if (preg_match('/(%.+)/', $cmdDevSetExp, $matches))
			throw new Exception("invalid variable '${matches[1]}' used in command '${cmd}'");
	}
	*/
	
	// done
	return $cmdsDevSetExp;
}

function expandDevSets( $cmdIn ) {
	$cmdsWork = array( $cmdIn );
	$cmdsDone = array();
	
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

function file_ext($name) {
  return substr(strrchr($name, '.'), 1);
}

function file_wo_ext($name) {
	return substr($name, 0, strrpos($name, '.'));
}

function dir_listing($path) {
	$fs = array();
	$d = opendir($path);
	while ($f = readdir($d)) {
		$fs[] = $f;
	}
	closedir($d);
	return $fs;
}

function getTransformScripts() {
	$scripts = array();
	$files   = dir_listing('./transform');
	
	foreach ($files as $file) {
		if (file_ext($file) != 'js')
			continue;
		
		$id   = file_wo_ext($file);
		$path = 'transform/' . $file;
		$scripts[$id] = $path;
	}
	return $scripts;
}

function getOverviewScripts() {
	$scripts = array();
	$files   = dir_listing('./overview');
		
	foreach ($files as $file) {
		if (file_ext($file) != 'js')
			continue;
		
		$id   = file_wo_ext($file);
		$path = 'overview/' . $file;
		$scripts[$id] = $path;
	}
	return $scripts;
}

function getOverviewStyles() {
	$scripts = array();
	$files   = dir_listing('./overview');
		
	foreach ($files as $file) {
		if (file_ext($file) != 'css')
			continue;
		
		$id   = file_wo_ext($file);
		$path = 'overview/' . $file;
		$scripts[$id] = $path;
	}
	return $scripts;
}

function displayException(Exception $e) {
	$clazz = get_class($e);
	$msg   = $e->getMessage();
	$trace = $e->getTraceAsString();
	echo "<h1>The Exception ${clazz} was raised</h1>";
	echo "<h3>${msg}</h3>";
	echo "<pre>${trace}</pre>";
}

function jsonError($code, $msg, $details = array()) {
	$err = array(
		  "error"   => true
		, "code"    => $code
		, "msg"     => $msg
		, "details" => $details
	);
	echo json_encode( $err );
	exit;
}