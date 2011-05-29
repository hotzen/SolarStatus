<?php
function isPasswordLogin(&$password) {
	if (!isset($_REQUEST['auth']) || !isset($_REQUEST['p']))
		return false;
	
	if (strlen($_REQUEST['p']) == 0)
		return false;
	
	$password = $_REQUEST['p'];
	return true;
}

function isChallengeResponseLogin(&$challenge, &$response) {
	if (!isset($_REQUEST['auth']) || !isset($_REQUEST['c']) || !isset($_REQUEST['r']))
		return false;
	
	if (strlen($_REQUEST['c']) == 0 || strlen($_REQUEST['r']) == 0)
		return false;
	
	$challenge = $_REQUEST['c'];
	$response  = $_REQUEST['r'];
	
	return true;
}

function loginPWD($password, &$token) {

	if ($password == $_SERVER['CFG']['AUTH']['PASSWORD']) {
		$token = generateToken();
		return true;
	}
	
	$token = '';
	return false;
}

function loginCR($challenge, $response, &$token) {
	
	if ($response == generateExpectedResponse($challenge)) {
		$token = generateToken();	
		return true;
	}
	
	$token = '';
	return false;
}

function isAuthorized(&$token = NULL) {
			
	// auth disabled
	if (!isset($_SERVER['CFG']['AUTH']))
		return true;
	
	// try passed token
	if (isset($token)) {
		return checkToken($token);
	}
		
	// try request
	if (isset($_REQUEST['t'])) {
		$token = $_REQUEST['t'];
		return checkToken($token);
	}
	
	// fail
	$token = '';
	return false;
}

function generateChallenge() {
	return sha1( uniqid($_SERVER['CFG']['AUTH']['SECRET'], true) );
}

function generateExpectedResponse($challenge) {
	return sha1( $challenge . $_SERVER['CFG']['AUTH']['PASSWORD'] );
}

function generateToken() {
	$secret = $_SERVER['CFG']['AUTH']['SECRET'];
	$hours  = round(time() / 7200); // between 1 and 2 hours valid
	$ip     = $_SERVER['REMOTE_ADDR'];
	
	return sha1( $secret . $hours . $ip );
}

function checkToken($t) {

	// auth disabled
	if (!isset($_SERVER['CFG']['AUTH']))
		return true;

	return ($t == generateToken());
}

function reloadTokenized($t) {
	//TODO: relative URLs work but are invalid HTTP
	header("Location: ${_SERVER['PHP_SELF']}?t=${t}");
	exit;
}

function getLoginForm($failed) {
	$self      = $_SERVER['PHP_SELF'];
	$challenge = generateChallenge();
	
	$header = ($failed) ? "Authorization failed" : "Authorization required";
		
	$o = <<<EOC
	<h1>${header}</h1>
	<form id="auth" name="auth" action="${self}" method="POST">
		<input name="c" type="hidden" value="${challenge}" />
		<input name="r" type="hidden" value="" />
		<input name="p" type="password" value="" />
		<input name="auth" type="submit" value="login" />
	</form>
EOC;
	
	return $o;
}