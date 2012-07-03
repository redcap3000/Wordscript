****Wordscript JSON API****

**Ronaldo Barbachano**

**http://doinglines.com**

**** 

This API provides simple interfaces for retreving
Wordpress MySQL data; without needing an installed/ working
version of Wordpress, MySQL, or even PHP (when using node or ruby versions).

****
**New Meta Field Images/Attachments Support**

Wordscript will now support meta fields (PHP version currently, ruby and node versions forthcoming), and also supports the Attachments Pro plugin (it seemed to be popular) including fields. These options can be configured in config.php

**WHY**

Much faster. Uses a fraction of memory. Design your applications
around json structures. Easy to implement in javascript applications. Create your own themes using your own tools. Migrate an existing wordpress installation to use NoSQL technologies.

**HOW**

This API generates queries based on passed get parameters to deliver
json structures.

This can effectively seperate 'development' enviornments from
production, and can still allow usage of the administrative wordpress interface to handle user accounts, post creation etc.

**What this won't do**

You can't use this API to modify anything in the database, and this does not track comments or multi-level category hiearchy. This may change.

**What this should do**

Eventually I would like to create a basic templating construct, allowing users to define html structures to insert the wordpress data into, support RSS feeds (?rss=), configuration options for thumbnail display/image tag generation. Support xml responses with (?xml=). Also I may consider writing API's for Perl and Python.

****
**General API Reference**

***base url***
	
	wp_api.php?json=-directive-/-option-/-option-value/limit/desc-asc

***also***

	wp_api.php?json=-directive-/limit/desc-asc

***Examples:***

	(get 10 latests posts)

	wp_api.php?json=posts/10

	(get 10 latest posts inside  'news' categories)

	wp_api.php?json=posts/category/news/10

	(get categories)

	wp_api.php?json=categories

**Cool _GET options**

Add these after the &json= to enable some simple options like...

***&stats***
 	--will add basic statistics (load,query count, and memory use)

***&embed*** 
	--will add 'var wp_api=[json];' which should make it easier to include as a javascript
***&noTag***
	-- Does not look up tags (saves a crap load of queries)
***&categories***
	-- includes categories (?json=categories)

