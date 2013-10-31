<?php
require 'lib/conf.php';
require 'lib/auth.php';
require 'lib/solstat.php';

initSession();
?>
<!DOCTYPE HTML>
<html>
<head>
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
	<!--
	  http://www.chromium.org/developers/how-tos/chrome-frame-getting-started
	  http://stackoverflow.com/questions/6771258/whats-the-difference-if-meta-http-equiv-x-ua-compatible-content-ie-edge-e
	-->
	
	<title>SolarStatus 0.11</title>
	
	<link href="style.css" rel="stylesheet" type="text/css"></link>
	<script src="js/lib.js" type="text/javascript"></script>
	<script src="js/jquery.js" type="text/javascript"></script>
	<script src="js/jquery.sha1.js" type="text/javascript"></script>
	<script src="js/jquery.hoverIntent.js" type="text/javascript"></script>
	<script src="js/auth.js" type="text/javascript"></script>
	<script src="js/solstat.js" type="text/javascript"></script>
	<script src="js/TableTransformer.js" type="text/javascript"></script>
	<?php
	foreach (dirListing('./views') as $file) {
		switch (fileExt($file)) {
			case 'js':
				echo "<script src=\"views/${file}\" type=\"text/javascript\"></script>";
				break;
			case 'css':
				echo "<link href=\"views/${file}\" rel=\"stylesheet\" type=\"text/css\"></link>";
				break;
			default:
				echo "<!-- invalid file '${file}' -->";
		}
	}
	foreach (dirListing('./overview') as $file) {
		switch (fileExt($file)) {
			case 'js':
				echo "<script src=\"overview/${file}\" type=\"text/javascript\"></script>";
				break;
			case 'css':
				echo "<link href=\"overview/${file}\" rel=\"stylesheet\" type=\"text/css\"></link>";
				break;
			default:
				echo "<!-- invalid file '${file}' -->";
		}
	}
	?>
</head>
<body>
<?php
// ##############################################
// config
try {
	loadConfig();
} catch (Exception $e) {
	displayException($e);
	exit;
}

// ##############################################
// login
$password = $challenge = $response = NULL;

if (isLogout()) {
	doLogout();
	
	echo getLoginForm("Logout successful.");
	echo "</body></html>";
	exit;
}

if (isLogin($challenge, $response)) {
	if (checkLogin($challenge, $response)) {
		doLogin();
		
		header("Location: ${_SERVER['PHP_SELF']}");
		exit;
	} else {
		echo getLoginForm("Login failed.");
		echo "</body></html>";
		exit;
	}
}
unset($password, $challenge, $response);

// ##############################################
// auth-check
if (!checkAuth()) {
	echo getLoginForm("Please login");
	echo "</body></html>";
	exit;
}
updateSession();

// ##############################################
// execute menu commands
foreach ($_REQUEST as $key => $val) {
	if (isset($_SERVER['SOLAR_CONFIG']['MENU'][$key]) && $val == 1) {
		$label   = ucfirst(strtolower( $key ));
		$command = $_SERVER['SOLAR_CONFIG']['MENU'][$key];

		echo <<<EOC
		<div class="menu-command">
			<h2>${label}</h2>
			<p>
				<label>executing <code>${command}</code> ...</label>
			</p>
EOC;
		try {
			$rc = NULL;
			$res = execCommand($command, $rc);
			
			if ($rc == 0)
				$label = "command completed successfully:";
			else
				$label = "command failed:";
			
			echo "<p><label>${label}</label></p>";
			echo "<pre>${res}</pre>";
			
		} catch (InvalidCommandException $e) {
			displayException($e);
		}
		echo "</div></body></html>";
		exit;
	}
}
?>
<nav id="panel">
	<ul id="filters">
		<li class="overview hide"><a name="overview" href="#overview" title="Display Overview" data-selector=".overview">Overview</a></li>
		<?php
		try {
			$filters = $_SERVER['SOLAR_CONFIG']['FILTERS'];
			
			foreach ($filters as $filterID => $filter) {
				$label    = $filter['LABEL'];
				$selector = $filter['SELECTOR'];
				$default  = (isset($filter['DEFAULT']) && $filter['DEFAULT']);
				$clazz    = ($default) ? "default" : "";
				$name     = cleanID($label);

				echo <<<EOC
		<li class="${clazz}"><a name="${name}" href="#${name}" title="Display ${label}" data-selector="${selector}">${label}</a></li>
EOC;
			}
		} catch (Exception $e) {
			displayException($e);
			exit;
		}
		?>
		
		<li id="menu">
			<ul>
				<li id="probe-auto-refresh">
					<label><input id="probe-refresh-toggle" type="checkbox" name="probe_refresh_toggle" value="1" /> Auto refresh</label>
					<label> every <input id="probe-refresh-freq" type="number" name="probe_refresh_freq" min="1" value="3" /> seconds</label>
				</li>
				<?php
				$menuEntries = $_SERVER['SOLAR_CONFIG']['MENU'];
				foreach ($menuEntries as $id => $command) {
					$label = ucfirst(strtolower( $id ));
					
					echo <<<EOC
				<li><a href="?${id}=1" title="${label}">${label}</a></li>
EOC;
				}
				?>
				<li id="logout">
					<a href="?logout=1">Logout</a>
				</li>
			</ul>
		</li>
	</ul>
</nav>

<section id="overview" class="hide">
	<table></table>
</section>

<section id="probes">
	<?php
	$probes = $_SERVER['SOLAR_CONFIG']['PROBES'];

	foreach ($probes as $probeID => $probeConf) {
		if (isset($probeConf['LABEL'])) {
			$label = $probeConf['LABEL'];
		} else {
			$label = $probeID;
		}

		if (isset($probeConf['CLASS'])) {
			$probeClazzes = splitTrim($probeConf['CLASS'], ' ');
		} else {
			$probeClazzes = array();
		}

		if (isset($probeConf['CONFIRM'])) {
			$probeClazzes[] = "confirm";
			$confirmText = trim($probeConf['CONFIRM']);
			$confirmText = expandVars($confirmText, array('\n' => "\n"));
			
			$confirmData = <<<EOC
<div class="result odd first last"><code>not automatically executed, please click refresh</code><pre>${confirmText}</pre></div>
EOC;
		} else {
			$confirmText = "";
			$confirmData = "";
		}
		
		$probeClazz = implode(' ', $probeClazzes);

		echo <<<EOC
	<article id="${probeID}" class="probe ${probeClazz} hide" data-confirm="${confirmText}">
		<header>
			<h1>${label}</h1>
			<ul class="view-selector hide">
				<li class="raw" data-selector=".raw"><a href="#data" title="View raw output">Raw</a></li>
			</ul>
			<a href="#refresh" class="refresh" title="Refresh"></a>
			<div class="failure hide"></div>
			<!-- TODO <a href="#minimize" class="minimize" title="Minimize output"></a> -->
			<a href="#fullsize" class="fullsize" title="View fullsize without scrollbars"></a>
			<a href="#select" class="select" title="Select output for copy/paste"></a>
		</header>
		<div class="content">
			<div class="raw selected">${confirmData}</div>
		</div>
		<footer>
			<time datetime="" data-timestamp=""></time>
		</footer>
	</article>
EOC;
	}
	?>
</section>
</body>
</html>