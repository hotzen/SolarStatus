<?php
$_SERVER['CFG'] = array(
	  'SCRIPT_DIR' => './scripts'
	  
	, 'AUTH' => array(
		'ENABLE'     => true     // enforces authorization
		, 'PASSWORD' => 'f00bar' // password required to access SolarStatus
		, 'SECRET'   => '9d9c8a3fb07ccb2c7a56d2f89b2dee6f' // secret seed to create random tokens
	)
	
	/* Support for smartmontools <http://smartmontools.sourceforge.net>
		Manuals:
			http://smartmontools.sourceforge.net/man/smartctl.8.html
			http://sourceforge.net/apps/trac/smartmontools/wiki/Powermode
		
		comment out to disable completely */
	, 'SMARTMON' => array(
	
		// smartctl requires root-privileges to read the device-information
		// you need to setuid the smartctl binary: "sudo chmod u+s smartctl"
		'SMARTCTL' => '/opt/smartmon/sbin/smartctl',
		
		// each set contains devices and commands,
		// where each command is run on each device and produces its own extract
		'SETS' => array(
			// SET #1
			array(
				// The Extract's label
				// placeholders:
				//	%DEV	device
				//	%CMD	command's label
				//	%ID		extract's id (HTML/CSS #id)
				'LABEL' => 'S.M.A.R.T %DEV %CMD'

				, 'DEVICES' => array (
					  '/dev/dsk/c8t1d0'
					, '/dev/dsk/c8t2d0'
					, '/dev/dsk/c8t3d0'
				)
				, 'CMDS' => array(
					//'echo SMARTCTL=%SMARTCTL DEV=%DEV' => 'Config-Echo'
					// '%SMARTCTL --all -d sat %DEV'  => 'SMART Info'
					'%SMARTCTL --info -d sat %DEV' => 'Device Info'
				)
			)
			/*
			// SET #2
			, array(
				'LABEL' => 'S.M.A.R.T SSD %DEV %CMD'
			
				'DEVICES' => array(
					'/dev/dsk/ssd1'
					, '/dev/dsk/ssd2'
					, '/dev/dsk/ssd3'
				)
				, 'CMDS' => array(
					'echo SMARTCTL=%SMARTCTL DEV=%DEV' => 'Config-Echo'
				)
			) */
		)
	)
);

