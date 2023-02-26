<?php
/* Database connection to save data from the online experiment using PDO
Table name is defined here.


CREx-BLRI-AMU project :
https://github.com/chris-zielinski/Online_experiments_jsPsych/tree/master/HowFast/keyseq
*/

//---- Name of the table
// Pilot 1 : kids_pilot_0117
// Pilot 2 (last test of the full version) : kids_pilot_0320
$tname = 'met_data';

//---------------------
// Connection parameters

include_once('xxx/connect.php');



//---------------------
// Database connection

$dsn = 'mysql:host=' . $hname . ';dbname=' . $dname . ';charset=utf8';

$opt = array(
	// any occurring errors will be thrown as PDOException
	PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
	// an SQL command to execute when connecting
	PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'UTF8'"
);

try {
	$dba = new PDO($dsn, $usern, $pword, $opt);
	// Remove this echo for luckydraw
	//echo " Connected to database "; 
} 
catch(PDOException $e)
{
	echo "Connection to database FAILED <br>" . $e->getMessage();  
}
	
?>