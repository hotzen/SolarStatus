#!/usr/bin/php
<?php
function initSession() {
	ini_set('session.save_path', sys_get_temp_dir());

	ini_set('session.use_cookies', 1);
	ini_set('session.use_only_cookies', 1);
	ini_set('session.use_trans_sid', 0);
	
	session_name('SID');
	session_set_cookie_params(0); // invalidate session-cookie on browser-close
	session_start();
}

function updateSession() {
	if (isset($_SERVER['SOLAR_CONFIG']['AUTH']['TIMEOUT'])) {
		$timeout = (int)$_SERVER['SOLAR_CONFIG']['AUTH']['TIMEOUT'];
		if ($timeout > 0) {
			$_SESSION['EXPIRE'] = time() + $timeout;
		}
	}
}

function requiresAuth() {
	return (  isset($_SERVER['SOLAR_CONFIG']['AUTH'])
		&& isset($_SERVER['SOLAR_CONFIG']['AUTH']['PASSWORD'])
		&& strlen($_SERVER['SOLAR_CONFIG']['AUTH']['PASSWORD']) > 0);
}

function checkAuth() {
	if (!requiresAuth())
		return true;
		
	if (!isset($_SESSION['AUTH']) || !$_SESSION['AUTH'])
		return false;
	
	if ($_SESSION['IP'] != $_SERVER['REMOTE_ADDR'])
		return false;
	
	if ($_SESSION['UA'] != $_SERVER['HTTP_USER_AGENT'])
		return false;
	
	if ($_SESSION['EXPIRE'] > 0 && $_SESSION['EXPIRE'] < time())
		return false;
	
	return true;
}

function generateChallenge() {
	return sha1( uniqid('', true) );
}

function generateExpectedResponse($challenge) {
	return sha1( $challenge . $_SERVER['SOLAR_CONFIG']['AUTH']['PASSWORD'] );
}

function isLogin(&$retChallenge, &$retResponse) {
	if (!isset($_REQUEST['auth']) || !isset($_REQUEST['c']) || !isset($_REQUEST['r']))
		return false;
	
	if (strlen($_REQUEST['c']) == 0 || strlen($_REQUEST['r']) == 0)
		return false;
	
	$retChallenge = $_REQUEST['c'];
	$retResponse  = $_REQUEST['r'];
	return true;
}

function checkLogin($challenge, $response) {
	$exp = generateExpectedResponse($challenge);
	
	if ($response != $exp)
		return false;
	
	return true;
}

function doLogin() {
	session_regenerate_id();
	$_SESSION['AUTH'] = true;
	$_SESSION['IP'] = $_SERVER['REMOTE_ADDR'];
	$_SESSION['UA'] = $_SERVER['HTTP_USER_AGENT'];
	$_SESSION['EXPIRE'] = -1; // will be properly set by updateSession()	
}

function isLogout() {
	return isset($_REQUEST['logout']);
}

function doLogout() {
	$_SESSION = array();
	session_destroy();
}

function getLoginForm($header) {
	$self      = $_SERVER['PHP_SELF'];
	$challenge = generateChallenge();
			
	$o = <<<EOC
	<h1>${header}</h1>
	<form id="auth" name="auth" action="${self}" method="GET">
		<input name="c" type="hidden" value="${challenge}" />
		<input name="r" type="hidden" value="" />
		<input name="p" type="password" value="" autofocus="autofocus" />
		<input name="auth" type="submit" value="login" />
	</form>
EOC;
	
	return $o;
}

/*
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
	if (!requiresAuth())
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
	if (!requiresAuth())
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
*/