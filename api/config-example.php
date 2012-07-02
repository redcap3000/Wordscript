<?php
/*

    Wordscript configuration example
    
    Fill out with your database info and set a few options.
    Setting meta/tags will result in more queries per each row
    returned.
    
*/
// lookup meta information; supports image attachments, plus attachments_pro (better support for attachment fields forthcoming)
$config['meta'] = true;
// lookup tags
$config['tags'] = true;
// super simple api for connecting to a wordpress 

// FILL THESE OUT

$config["db_name"] = "database_name";

$config["db_user"] = "database_user";

$config["db_pass"] = "dbpword";

$config["db_host"] = "localhost";


// on most installations this is simply wp_ , trailing underscore required!
// This is the prefix that is appended before all related wordpress tables

$config["wp"]="wp_";

// This is relative to wherever the script is... use http:// this is used
// to generate urls for thumbnails/image attachments
$images_directory = '../wp-content/uploads';
