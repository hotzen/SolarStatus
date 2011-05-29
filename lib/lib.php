<?php
function exec_script($script, array &$output, &$error, &$ts = NULL) {
	$error = NULl;
	
	if (!preg_match('#^[a-z0-9_]+$#', $script)) {
		$error = 'ERR_INVALID_SCRIPT';
		return $error;
	}
	
	$path = $_SERVER['CFG']['SCRIPT_DIR'] . '/' . $script . '.sh';
	
	if (!file_exists($path)) {
		$error = 'ERR_SCRIPT_DOES_NOT_EXIST';
		return $error;
	}
		
	if (!is_executable($path)) {
		$error = 'ERR_SCRIPT_IS_NOT_EXECUTABLE';
		return $error;
	}
	
	return exec_direct($path, $output, $error, $ts);
}

// UNCHECKED
//	 UNSAFE
//     ONLY SANITIZED VALUES!
function exec_direct($cmd, array &$output, &$error, &$ts = NULL) {
	$error = NULl;

	$ts = time();
	exec($cmd, $output, $rc);
	
	if ($rc != 0) {
		$error = "ERR_RC_$rc";
		return $error;
	}
	
	return $rc;
}

function createSmartMonToolsExtracts() {
	$smartctl = $_SERVER['CFG']['SMARTMON']['SMARTCTL'];
	$extracts = array();
		
	foreach ($_SERVER['CFG']['SMARTMON']['SETS'] as $set) {
		$label = $set['LABEL'];
		
		foreach ($set['DEVICES'] as $dev) {
			$devID = trim(preg_replace('/[^a-z0-9]+/', '_', $dev), '_');
			$count = 0;
			
			foreach ($set['CMDS'] as $cmd => $cmdLabel) {
				$count++;
				$extractID = "smartmon-${devID}-${count}";

				$commonVars = array(
					'%DEV' => $dev
				);
				$cmdVars = array(
					'%SMARTCTL'	=> $smartctl,
				);
				$labelVars = array(
					'%ID'  => $extractID,
					'%CMD' => $cmdLabel
				);
				
				$devCmd = translateVars($cmd, $commonVars, $cmdVars);
				$label  = translateVars($set['LABEL'], $commonVars, $cmdVars, $labelVars);
				
				$extracts[] = createCmdExtract($extractID, $devCmd, $label, "group-smartmon");
			}
		}
	}

	return implode("\n\n", $extracts);
}


function createScriptExtract($id, $label, $groups) {
	$out   = array();
	$error = NULL;
	$ts    = NULL;
	
	$rc     = exec_script($id, $out, $error, $ts);
	$oneOut = implode("\n", $out);
		
	return createExtract($id, $oneOut, $error, $ts, $label, $groups . " script-extract");
}

function createCmdExtract($id, $cmd, $label, $groups) {
	$out   = array();
	$error = NULL;
	$ts    = NULL;
	
	$rc     = exec_direct($cmd, $out, $error, $ts);
	$oneOut = implode("\n", $out);
		
	return createExtract($id, $oneOut, $error, $ts, $label, $groups . " cmd-extract");
}

// UNESCAPED ARGUMENTS!
function createExtract($id, $output, $error, $ts, $label, $groups) {
			
	$tsMillis	 = $ts * 1000;
	$dateTime    = strftime("%Y-%m-%dT%H:%M:%SZ", $ts);
	$dateTimeLbl = strftime("%Y-%m-%d %H:%M:%S",  $ts);

	$hideFailure = ($error) ? "" : "hide";
	
	$out = <<<EOC
<section id="${id}" class="extract group-all ${groups}" data-script="${id}">
	<header>
		<h1>${label}</h1>
		<ul class="view-selector hide">
			<li class="view-raw"><a href="#raw" title="View raw data" data-filter="code"  data-view="">Raw</a></li>
			<li class="view-data hide"><a href="#data" title="View parsed data" data-filter=".data" data-view="">Parsed</a></li>
			<li class="view-history"><a href="#history" title="View historic data" data-filter=".history" data-view="">History</a></li>
		</ul>
		<a href="#refresh" class="refresh hide" title="refresh data"></a>
		<div class="failure ${hideFailure}">${error}</div>
	</header>
	<code>${output}</code>
	<div class="data hide"></div>
	<ol class="history hide"></ol>
	<footer>
		<time datetime="${dateTime}" data-timestamp="{$tsMillis}">${dateTimeLbl}</time>
	</footer>
</section>
EOC;
	return $out;
}


function jsonError($msg) {
	$err = array(
		"error"   => true,
		"message" => $msg
	);
	echo json_encode( $err );
	exit;
}

function translateVars($str, array $vars1, array $vars2 = array(), array $vars3 = array()) {
	$vars = array_merge_recursive($vars1, $vars2, $vars3);
	return str_replace(array_keys($vars), array_values($vars), $str);
}