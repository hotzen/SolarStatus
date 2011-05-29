<!DOCTYPE HTML>
<?php
require 'conf.php';
require 'lib/auth.php';
require 'lib/lib.php';
?>
<html>
<head>
	<title>SolarStatus v0.3</title>
	<link href="css/style.css" rel="stylesheet" type="text/css"></link>
	<script src="js/lib.js" type="text/javascript"></script>
	<script src="js/jquery.js" type="text/javascript"></script>
	<script src="js/jquery.sha1.js" type="text/javascript"></script>
	<script src="js/auth.js" type="text/javascript"></script>
	<script src="js/solar.js" type="text/javascript"></script>
	<script src="js/TableTransformer.js" type="text/javascript"></script>
	<script src="js/parsers.js" type="text/javascript"></script>
	<script src="js/views.js" type="text/javascript"></script>
</head>
<body>

<?php
$password = $challenge = $response = $token = NULL;

if (isPasswordLogin($password)) {
	if (!loginPWD($password, $token)) {
		echo getLoginForm(true);
		echo "</body></html>";
		exit;
	} else {
		reloadTokenized($token);
	}
}

if (isChallengeResponseLogin($challenge, $response)) {
	if (!loginCR($challenge, $response, $token)) {
		echo getLoginForm(true);
		echo "</body></html>";
		exit;
	} else {
		reloadTokenized($token);
	}
}

if (!isAuthorized($token)) {
	echo getLoginForm(false);
	echo "</body></html>";
	exit;
}
?>

<script type="text/javascript">var T = "<?php echo $token; ?>";</script>

<nav id="main-panel" class="hide">
	<ul id="extract-filters">
		<li class="selected"><a href="#filter" title="Show all data" data-filter=".group-all">All</a></li>
		<li><a href="#filter" title="Only show CPU data" data-filter=".group-cpu">CPU</a></li>
		<li><a href="#filter" title="Only show I/O data" data-filter=".group-io">I/O</a></li>
		<li><a href="#filter" title="Only show ZFS data" data-filter=".group-zfs">ZFS</a></li>
		
		<?php if (isset($_SERVER['CFG']['SMARTMON'])) : ?>
		<li><a href="#filter" title="Only show S.M.A.R.T. data" data-filter=".group-smartmon">S.M.A.R.T.</a></li>
		<?php endif; ?>
		
		<li><a href="#filter" title="Only show Processes" data-filter=".group-ps">Processes</a></li>
		<li><a href="#filter" title="Only show Services" data-filter=".group-svcs">Services</a></li>
		<li><a href="#filter" title="Only show Logs" data-filter=".group-logs">Logs</a></li>
		<li><a href="#filter" title="Only show Hardware data" data-filter=".group-hw">Hardware</a></li>
	</ul>
	
	<div id="extract-refresh">
		<label><input id="extract-refresh-active" type="checkbox" name="extract_refresh_active" value="1" /> Auto refresh</label>
		<label> every <input id="extract-refresh-freq" type="number" name="extract_refresh_freq" min="1" value="3" /> seconds</label>
	</div>
</nav>

<!--
<section id="overview">
	<ul>
		<li><label>CPU #1</label><meter min="0" max="100" value="25" title="Non-Idleness" /></li>
		<li><label>CPU #2</label><meter min="0" max="100" value="50" title="Non-Idleness" /></li>
		<li><label>I/O c7t0d0</label><meter min="0" max="100" value="50" title="Read" /><meter min="0" max="100" value="50" title="Write" /></li>
		<li><label>I/O c8t0d0</label><meter min="0" max="100" value="50" title="Read" /><meter min="0" max="100" value="50" title="Write" /></li>
		<li><label>I/O c8t1d0</label><meter min="0" max="100" value="50" title="Read" /><meter min="0" max="100" value="50" title="Write" /></li>
		<li><label>I/O c8t2d0</label><meter min="0" max="100" value="50" title="Read" /><meter min="0" max="100" value="50" title="Write" /></li>
		<li><label>I/O c8t3d0</label><meter min="0" max="100" value="50" title="Read" /><meter min="0" max="100" value="50" title="Write" /></li>
		<li><label>Network</label><meter min="0" max="100" value="50" title="Non-Idleness" /></li>
	</ul>
</section>
-->

<section id="extracts">
	<?php
	echo createScriptExtract("vmstat", "CPU (vmstat)", "group-cpu");
	echo createScriptExtract("mpstat", "CPU-Cores (mpstat)", "group-cpu");
	echo createScriptExtract("cpu_current_freq", "CPU Current Frequency", "group-cpu");
	
	echo createScriptExtract("iostat", "I/O", "group-io");
	echo createScriptExtract("nicstat", "Network-Interfaces (<a href=\"http://www.brendangregg.com/K9Toolkit/nicstat.c\">nicstat</a>)", "group-io");
	
	echo createScriptExtract("zpool_iostat", "ZFS I/O (zpool iostat)", "group-io group-zfs");
	echo createScriptExtract("zpool_status", "ZFS Status", "group-zfs");
	echo createScriptExtract("zpool", "ZFS Pools", "group-zfs");
	echo createScriptExtract("zfs", "ZFS Filesystems", "group-zfs");
	
	
	echo createScriptExtract("svc_problems", "Service-Problems", "group-svcs");
	echo createScriptExtract("svcs", "Services", "group-svcs");
	
	echo createScriptExtract("prstat", "Top CPU Processes (prstat)", "group-ps");
	echo createScriptExtract("top", "Top CPU Processes (top)", "group-ps");
	echo createScriptExtract("ps", "Processes (ps)", "group-ps");
		
	echo createScriptExtract("dmesg", "Kernel Ring Buffer (dmesg)", "group-logs");
	echo createScriptExtract("adm_msgs", "Messages (/var/adm/messages)", "group-logs");
	
	echo createScriptExtract("prtdiag", "System Configuration & Diagnostic Information (prtdiag)", "group-hw");
	echo createScriptExtract("cpu_supported_freq", "CPU Supported Frequencies", "group-cpu group-hw");
	
	if (isset($_SERVER['CFG']['SMARTMON'])) {
		echo createSmartMonToolsExtracts();
	}
	?>
</section>

</body>
</html>