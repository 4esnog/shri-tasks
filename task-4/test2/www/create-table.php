<?php 
header('Content-Type: text/html; charset=UTF-8');

define('DB_PW', 'afg785jy');
define('DB_NAME', 'u462137838_event');
define('DB_USER', 'u462137838_keks');
define('DB_HOST', 'mysql.hostinger.ru');

// $query = "CREATE TABLE `hack-may-2016` ( `id` INT(5) NOT NULL AUTO_INCREMENT , `reg_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP , `name` VARCHAR(200) NOT NULL , `email` VARCHAR(200) NOT NULL , `tel` VARCHAR(15) NOT NULL , `edu` VARCHAR(255) NOT NULL , `additional` TEXT NOT NULL , PRIMARY KEY (`id`)) ENGINE = MyISAM;";

// $query = "INSERT INTO `hack-may-2016` (`id`, `reg_time`, `name`, `email`, `tel`, `edu`, `additional`) VALUES (NULL, CURRENT_TIMESTAMP, 'Никита Чесноков', 'strell-ok@yandex.ru', '89613203519', 'DSTU', 'Привет!')";

$query = "SELECT * FROM `hack-may-2016`";

$db = new mysqli(DB_HOST, DB_USER, DB_PW, DB_NAME);

if ($db->connect_errno) {
	echo "DB connection error: ".$db->connect_error;
	throw new Exception("DB connection error: ".$db->connect_error, $db->connect_errno);
	die();
}

$result = $db->query($query);
if (!$result) {
	throw new Exception("DB request error: ".$db->error, $db->errno);
	die();
}

?>
<!DOCTYPE html>
<html lang="ru">
<head>
	<meta charset="UTF-8">
	<title>Участники хакатона</title>
	<link rel="stylesheet" href="css/main.css">
</head>
<body>
	<table class="db-table">
		<thead>
			<tr>
				<td colspan="7">
					<h1>Таблица зареганных участников хакатона 2016</h1>
				</td>
			</tr>
		</thead>
		<tbody>
			<?php 

			while($row = $result->fetch_assoc()) {

				$id = $row["id"];

				date_default_timezone_set('Europe/Moscow');
				// $time = date(DATE_W3C, $row["reg_time"]);
				$time = $row['reg_time'];
				$name = $row["name"];
				$email = $row["email"];
				$tel = $row["tel"];
				$edu = $row["edu"];
				$additional = $row["additional"];

echo <<<EOT
			<tr>
				<td>
					$id
				</td>
				<td>
					$time
				</td>
				<td>
					$name
				</td>
				<td>
					$email
				</td>
				<td>
					$tel
				</td>
				<td>
					$edu
				</td>
				<td>
					$additional
				</td>
			</tr>
EOT;
			}

			?>
		</tbody>
	</table>
</body>
</html>