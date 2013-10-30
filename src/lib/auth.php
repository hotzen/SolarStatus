<?php
function initSession() {
	ini_set('session.use_cookies', 1);
	ini_set('session.use_only_cookies', 1);
	ini_set('session.use_trans_sid', 0);
	
	session_cache_limiter('nocache');
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
	return ( isset($_SERVER['SOLAR_CONFIG']['AUTH'])
		  && isset($_SERVER['SOLAR_CONFIG']['AUTH']['PASSWORD'])
		  && strlen($_SERVER['SOLAR_CONFIG']['AUTH']['PASSWORD']) > 0 );
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
	$prefix = '';
	return sha1( uniqid($prefix, true) );
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
	return ($response == $exp);
}

function doLogin() {
	session_regenerate_id();
	$_SESSION['AUTH']   = true;
	$_SESSION['IP']     = $_SERVER['REMOTE_ADDR'];
	$_SESSION['UA']     = $_SERVER['HTTP_USER_AGENT'];
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
<div class="auth">
	<h1>${header}</h1>
	<form name="auth" action="${self}" method="GET">
		<input name="c" type="hidden" value="${challenge}" />
		<input name="r" type="hidden" value="" />
		<input name="p" type="password" value="" autofocus="autofocus" />
		<input name="auth" type="submit" value="Login" />
	</form>
</div>
EOC;
	
	return $o;
}