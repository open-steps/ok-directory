<?php
ini_set('display_errors', 1);
require_once('TwitterAPIExchange.php');

/** Get parameter */

$screen_name = $_GET['screen_name'];

/** Set access tokens here - see: https://dev.twitter.com/apps/ **/
$settings = array(
    'oauth_access_token' => "1616076026-XnMIdCgf0habHjdTTbKTVz0MfcBQwWMOCgNWtfG",
    'oauth_access_token_secret' => "TRPioapfPlClxGjXERDHtNP91Qvj9wRc8oCg5udxmDNbV",
    'consumer_key' => "s47dFPYt7kf6znvAVBRK6N9lj",
    'consumer_secret' => "Sxpd9T9Ax44X1naFwfuMHt3OzPuVBV76O3SIixlAdAYhq3MNEe"
);

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

echo $json["profile_image_url"];

?>

