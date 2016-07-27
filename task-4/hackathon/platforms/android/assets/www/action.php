<?php
header('Content-Type: application/json');

// Old DB data
// 
define('DB_PW', 'afg785jy');
define('DB_NAME', 'u462137838_event');
define('DB_USER', 'u462137838_keks');
define('DB_HOST', 'mysql.hostinger.ru');

// define('DB_PW', 'NkmODN8EaM');
// define('DB_NAME', 'u351451554_hack');
// define('DB_USER', 'u351451554_hack');
// define('DB_HOST', 'mysql.hostinger.ru');

$name = '';  
$email = '';
$tel = '';
$edu = '';
$additional = '';


if (isset($_POST["name"])) {
	$name = $_POST["name"];
} else {
	throw new Exception("Missing 'name' value", 1);
}

if (isset($_POST["email"])) {
	$email = $_POST["email"];
} else {
	throw new Exception("Missing 'email' value", 2);	
}

if (isset($_POST["tel"])) {
	$tel = $_POST["tel"];
} else {
	throw new Exception("Missing 'tel' value", 3);
	
}

if (isset($_POST["edu"])) {
	$edu = $_POST["edu"];
}
if (isset($_POST["additional"])) {
	$additional = $_POST["additional"];
}

// DB connect
$db = new mysqli(DB_HOST, DB_USER, DB_PW, DB_NAME);

if ($db->connect_errno) {
	echo "DB connection error: ".$db->connect_error;
	throw new Exception("DB connection error: ".$db->connect_error, $db->connect_errno);
	die();
}

// DB request
// TODO! Change fields!
$result = $db->query("INSERT INTO `hack-may-2016` (`id`, `reg_time`, `name`, `email`, `tel`, `edu`, `additional`) VALUES (NULL, CURRENT_TIMESTAMP, '$name', '$email', '$tel', '$edu', '$additional')");

if (!$result) {
	throw new Exception("DB request error: ".$db->error, $db->errno);
	die();
}

mail("$email", "Регистрация на Хакатон ДГТУ", "Спасибо за регистрацию! Ждём вас 25 мая в 18:00 на Хакатоне #ДГТУ ;)");

echo json_encode(array(
	'name'=>$name,
	'email'=>$email,
	'tel'=>$tel,
	'edu'=>$edu,
	'additiona;'=>$additional
));

// mysql_query ("set character_set_client='utf8'");
// mysql_query ("set character_set_results='utf8'");
// mysql_query ("set collation_connection='utf8_unicode_ci'");

// mysql_select_db ("u462137838_event",$db);
 
 
// $result = mysql_query ("INSERT INTO hack (f_name,name,email,tel,house,spec) VALUES ('$f_name','$name','$email','$tel','$house','$spec')");
 // header("Location: http://fantastic-hackathon.ru/ ");



?>