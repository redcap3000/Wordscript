#! /usr/bin/env rubyo
## Wordscript JSON API Ruby
## Simple script for connecting to wordpress db; local or remote
## Sends generated queries and returns results as JSON. 
## Uses Gems - mysql2, json, php-serialize
## Ronaldo Barbachano July 2012

#mysql settings
mysql_host = 'localhost'
mysql_username = 'yourusername'
mysql_password = 'yourpassword'
mysql_database = 'yourdb'
#wordpress table prefix
wp_pre = 'wp_'

## These are what most queries will return add remove-rename at will just no comma at the end - post_name must be present for tags to render properly
default_fields = 'id,post_title,post_name,post_author,post_date,post_content,post_type,post_status'

## use &limit=<number> to override
default_limit = "10"