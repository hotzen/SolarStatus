<!DOCTYPE HTML>
<?php
require 'lib/conf.php';
require 'lib/auth.php';
require 'lib/solar.php';
?>
<html>
<head>
	<title>SolarStatus v0.7</title>
	<link href="css/style.css" rel="stylesheet" type="text/css"></link>
	
	<!-- CORE -->
	<script src="js/lib.js" type="text/javascript"></script>
	<script src="js/jquery.js" type="text/javascript"></script>
	<script src="js/jquery.sha1.js" type="text/javascript"></script>
	<script src="js/auth.js" type="text/javascript"></script>
	<script src="js/solar.js" type="text/javascript"></script>
	<script src="js/TableTransformer.js" type="text/javascript"></script>
	
	<!-- DYNAMIC TRANSFORMATIONS -->
	<?php
	foreach (getTransformScripts() as $id => $path) {
		echo <<<EOC
		<script src="${path}" type="text/javascript"></script>

EOC;
	}
	?>
	
	<!-- DYNAMIC OVERVIEWS -->
	<?php
	$overviewProbes = array();

	foreach (getOverviewStyles() as $id => $path) {
		echo <<<EOC
		<link href="${path}" rel="stylesheet" type="text/css"></link>

EOC;
	}
	
	foreach (getOverviewScripts() as $id => $path) {
		$overviewProbes[] = $id;
		echo <<<EOC
		<script src="${path}" type="text/javascript"></script>

EOC;
	}
	?>
</head>
<body>
<?php
try {
	loadConfig();
} catch (Exception $e) {
	displayException($e);
	exit;
}

$password = $challenge = $response = $token = NULL;

if (isLogin($challenge, $response)) {
	if (!login($challenge, $response, $token)) {
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
<script type="text/javascript">
window.SOLAR = {
	  SELF:         "<?php echo $_SERVER['PHP_SELF']; ?>"
	, AUTH_TOKEN:   "<?php echo $token; ?>"
	, AUTH_EXPIRED: false
}
</script>
<?php unset($password, $challenge, $response, $token); ?>

<nav id="panel">
	<ul id="probe-filters">
		<li class="overview"><a href="#overview" title="Display Overview" data-filter=".overview">Overview</a></li>
		<?php
		try {
			$filters = $_SERVER['SOLAR_CONFIG']['FILTERS'];
			
			foreach ($filters as $filterID => $filter) {
				$label    = $filter['LABEL'];
				$selector = $filter['SELECTOR'];
				$clazzSel = (isset($filter['DEFAULT']) && $filter['DEFAULT']) ? 'selected' : '';

				echo <<<EOC
		<li class="${clazzSel}"><a href="#filter" title="Display ${label}" data-filter="${selector}">${label}</a></li>

EOC;
			}
		} catch (Exception $e) {
			displayException($e);
			exit;
		}
		?>
		<li id="probe-auto-refresh">
			<label><input id="probe-refresh-toggle" type="checkbox" name="probe_refresh_toggle" value="1" /> Auto refresh</label>
			<label> every <input id="probe-refresh-freq" type="number" name="probe_refresh_freq" min="1" value="3" /> seconds</label>
		</li>
	</ul>
</nav>

<section id="overview" class="hide">
	<table>
	<?php
	foreach ($overviewProbes as $probeID) {
		// <thead id="overview-header-${probeID}"></thead>
		echo <<<EOC
		<tbody id="overview-${probeID}"></tbody>
EOC;
	}
	?>
	</table>
</section>

<section id="probes">
	<?php
	$probes  = $_SERVER['SOLAR_CONFIG']['PROBES'];

	foreach ($probes as $probeID => $probeConf) {
		// LABEL
		if (isset($probeConf['LABEL'])) {
			$label = $probeConf['LABEL'];
		} else {
			$label = $probeID;
		}
		
		// CLASS
		if (isset($probeConf['CLASS'])) {
			$probeClazzes = splitTrim($probeConf['CLASS'], ' ');
		} else {
			$probeClazzes = array();
		}
		
		// tag overview-probes
		if (in_array($probeID, $overviewProbes)) {
			$probeClazzes[] = "overview";
		}
		
		if (isset($probeConf['CONFIRM'])) {
			$probeClazzes[] = "confirm";
			$confirmText = trim($probeConf['CONFIRM']);
			$confirmText = expandVars($confirmText, array('\n' => "\n"));
			
			$confirmData = <<<EOC
<div class="result odd first last"><code>explicitly refresh to execute</code><pre>${confirmText}</pre></div>
EOC;
		} else {
			$confirmText = "";
			$confirmData = "";
		}
		
		$probeClazz = implode(' ', $probeClazzes);
				
		// OUTPUT
		echo <<<EOC
	<div id="${probeID}" class="probe ${probeClazz} hide" data-confirm="${confirmText}">
		<header>
			<h1>${label}</h1>
			<ul class="view-selector hide">
				<li class="view-raw"><a href="#data" title="View raw data" data-filter=".raw">Raw</a></li>
				<li class="view-transformed"><a href="#transform" title="View transformed data" data-filter=".transformed">Transformed</a></li>
			</ul>
			<a href="#refresh" class="refresh" title="Refresh"></a>
			<div class="failure hide"></div>
		</header>
		<div class="raw">${confirmData}</div>
		<div class="transformed hide"></div>
		<footer>
			<time datetime="" data-timestamp=""></time>
		</footer>
	</div>

EOC;
	}
	?>
</section>

</body>
</html>