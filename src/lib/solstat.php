<?php
class SolarExecException extends Exception {
	var $cmd;
	
	public function __construct($message, $cmd) {
	  parent::__construct($message);
	  $this->cmd = $cmd;
	}
}

function execScript($script, &$rc = NULL) {
	return execCommand(getScriptPath($script), $rc);
}

// RAW, UNCHECKED, UNSAFE
function execCommand($cmd, &$rc = NULL) {
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
	
	$rc = pclose($h);
	
	return $out;
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

	$cmdVarExp = expandVars($cmd, $macros);
	$cmdsDevSetExp = expandDevSets( $cmdVarExp );

	return $cmdsDevSetExp;
}

function expandDevSets($cmdIn) {
	$cmdsWork = array($cmdIn);
	$cmdsDone = array();
	
	$devsets = $_SERVER['SOLAR_CONFIG']['DEVSETS'];
	
	if (isset($_SERVER['SOLAR_CONFIG']['DEVSET_SEP']))
		$sep = $_SERVER['SOLAR_CONFIG']['DEVSET_SEP'];
	else
		$sep = " ";

	while (($cmd = array_shift($cmdsWork)) !== NULL) {
		
		if (($devsetID = extractDevSetID($cmd, $complete)) !== NULL) {
			if (!isset($devsets[$devsetID]))
				throw new Exception("invalid devset '${devsetID}' used in cmd '${cmdIn}'");
			
			$devset = $devsets[$devsetID];
			
			if ($complete) {
				$allDevs = implode($sep, $devset);
				$cmdsWork[] = expandDevSetID($cmd, $devsetID, $allDevs, "!");
			} else {
				foreach ($devset as $dev) {
					$cmdsWork[] = expandDevSetID($cmd, $devsetID, $dev);
				}
			}
		} else {
			$cmdsDone[] = $cmd;
		}
	}
	return $cmdsDone;
}

function extractDevSetID($cmd, &$complete = false) {
	if (!preg_match('/%DEVSET\-(\d+)(!?)/', $cmd, $matches))
		return NULL;
	
	$id = $matches[1];
	$complete = isset($matches[2]);
	
	return $id;
}

function expandDevSetID($cmd, $devSetID, $val, $suffix = "") {
	$var = "%DEVSET-${devSetID}${suffix}";
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

function fileExt($name) {
  return substr(strrchr($name, '.'), 1);
}

function fileNoExt($name) {
	return substr($name, 0, strrpos($name, '.'));
}

function dirListing($dirPath, $sortFiles = true) {
	$files = array();
	$d = opendir($dirPath);
	while ($fileName = readdir($d)) {
		if ($fileName == '.' || $fileName == '..')
			continue;
		$files[] = $fileName;
	}
	closedir($d);
	if ($sortFiles)
		usort($files, 'strnatcasecmp');
	return $files;
}

function displayException(Exception $e) {
	$clazz = get_class($e);
	$msg   = $e->getMessage();
	$trace = $e->getTraceAsString();
	echo "<h1>${clazz} was raised</h1>";
	echo "<h3>${msg}</h3>";
	echo "<pre>${trace}</pre>";
}

function jsonError($code, $msg = "", $details = array()) {
	$err = array(
		  "error"   => true
		, "code"    => $code
		, "msg"     => $msg
		, "details" => $details
	);
	ob_end_clean();
	echo json_encode( $err );
	exit;
}

function durationStart() {
	return microtime(true);
}

function durationStop($start) {
	return microtime(true) -  $start;
}

function cleanID($s) {
	$lower = strtolower($s);
	$clean = preg_replace('/[^a-z0-9]+/', '-', $lower);
	$multi = preg_replace('/-+/',  '-', $clean);
	$pre   = preg_replace('/^-+/', '', $multi);
	$post  = preg_replace('/-+$/', '', $pre);
	return $post;
}