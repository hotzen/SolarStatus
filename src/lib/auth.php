<?php
function isLogin(&$challenge, &$response) {
	if (!isset($_REQUEST['auth']) || !isset($_REQUEST['c']) || !isset($_REQUEST['r']))
		return false;
	
	if (strlen($_REQUEST['c']) == 0 || strlen($_REQUEST['r']) == 0)
		return false;
	
	$challenge = $_REQUEST['c'];
	$response  = $_REQUEST['r'];
	
	return true;
}

function login($challenge, $response, &$token) {
	$exp = generateExpectedResponse($challenge);
	
	if ($response != $exp) {
		$token = '';
		return false;
	}
	
	$token = generateToken();	
	return true;
}

function isAuthorized(&$token = NULL) {
			
	// auth disabled
	if (!isset($_SERVER['SOLAR_CONFIG']['AUTH']))
		return true;
	
	// not passed, fetch from request
	if (!isset($token) && isset($_REQUEST['t'])) {
		$token = $_REQUEST['t'];
	}
	
	// try passed token
	if (isset($token)) {
		$auth = checkToken($token);
		
		// generate new token
		if ($auth) {
			$token = generateToken();
		}
		
		return $auth;
	}
	
	// fail
	$token = '';
	return false;
}

function generateChallenge() {
	return sha1( uniqid($_SERVER['SOLAR_CONFIG']['AUTH']['SECRET'], true) );
}

function generateExpectedResponse($challenge) {
	return sha1( $challenge . $_SERVER['SOLAR_CONFIG']['AUTH']['PASSWORD'] );
}

// function generateToken() {
	// $secret = $_SERVER['SOLAR_CONFIG']['AUTH']['SECRET'];
	// $hours  = round(time() / (3 * 3600));
	// $ip     = $_SERVER['REMOTE_ADDR'];
	// $ua     = $_SERVER['HTTP_USER_AGENT'];
	
	// return sha1( $secret . $hours . $ip . $ua );
// }

function generateToken($time = NULL) {
	if ($time === NULL)
		$time = time();

	$secret = $_SERVER['SOLAR_CONFIG']['AUTH']['SECRET'];
	$time   = dechex( $time );
	$ip     = $_SERVER['REMOTE_ADDR'];
	$ua     = $_SERVER['HTTP_USER_AGENT'];
	
	return $time . '$' . sha1( $time . $ip . $ua . $secret );
}

function checkToken($t) {

	// auth disabled
	if (!isset($_SERVER['SOLAR_CONFIG']['AUTH']))
		return true;
	
	$ps = explode('$', $t);
	if (count($ps) != 2)
		return false;
	
	// check expiration
	$time   = hexdec($ps[0]);
	$dur    = time() - $time;
	$expire = (int)$_SERVER['SOLAR_CONFIG']['AUTH']['EXPIRE'];

	if ($dur > $expire)
		return false;
		
	return ($t == generateToken($time));
}

function reloadTokenized($t) {
	//TODO: relative URLs work but are invalid HTTP
	header("Location: ${_SERVER['PHP_SELF']}?t=${t}");
	exit;
}

function getLoginForm($failed) {
	$self      = $_SERVER['PHP_SELF'];
	$challenge = generateChallenge();
	
	$header = ($failed) ? "Login failed" : "Please login";
		
	$o = <<<EOC
	<h1>${header}</h1>
	<form id="auth" name="auth" action="${self}" method="POST">
		<input name="c" type="hidden" value="${challenge}" />
		<input name="r" type="hidden" value="" />
		<input name="p" type="password" value="" autofocus="autofocus" />
		<input name="auth" type="submit" value="login" />
	</form>
EOC;
	
	return $o;
}