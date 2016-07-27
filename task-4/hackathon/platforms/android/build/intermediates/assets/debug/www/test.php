<?php
header('Content-Type: application/json');

echo json_encode(array(
	'name'=>$_POST["name"],
	'email'=>$_POST["email"],
	'tel'=>$_POST["tel"],
	'edu'=>$_POST["edu"],
	'additional'=>$_POST["additional"]
));

?>