<?php
ini_set('display_errors', 1);
require_once('TwitterAPIExchange.php');
require_once('twitter_config.php');

/** Get parameter */
$screen_name = $_GET['screen_name'];

/** Before doing any request to the twitter API, look for cached url */
$filename = "cached/".$screen_name;

/** If user's profile img was already chached, return it inmediatelly */
if (file_exists($filename)){

	echo file_get_contents($filename);
	
}else{
	
	/** URL for REST request, see: https://dev.twitter.com/docs/api/1.1/ **/
	$url = 'https://api.twitter.com/1.1/users/show.json';
	$getfield = '?screen_name='.$screen_name;
	$requestMethod = 'GET';
	
	/** Perform a POST request and echo the response **/
	$twitter = new TwitterAPIExchange($settings);
	$response = $twitter->setGetfield($getfield)
				 ->buildOauth($url, $requestMethod)
	             ->performRequest();
	             
	/** Decode JSON Object and extract/return parameter */
	$json = json_decode($response, true);
	
	/** Store downloaded profile url in cached */
	$cached[$screen_name] = $json["profile_image_url"];
	
	/** Dump contents of the array in the cached file again */
	file_put_contents($filename,$json["profile_image_url"]);

	echo $json["profile_image_url"];

}


?>

