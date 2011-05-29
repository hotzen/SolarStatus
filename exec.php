<?php
require 'conf.php';
require 'auth.php';
require 'lib.php';

header("Content-Type: text/javascript");

if (!isAuthorized()) {
	jsonError("NO_AUTH");
}

if (!isset($_GET["s"])) {
	jsonError("NO_SCRIPT");
}

$script = $_GET["s"];

$result = array();
$error  = null;

$rc = exec_script($script, $result, $error, $ts);

if ($rc != 0 || isset($error)) {
	jsonError( $error );
}

$res = array(
	"script"  => $script,
	"time"	  => ($ts * 1000),
	"result"  => $result
);
echo json_encode( $res );
exit; // no session_write_close()