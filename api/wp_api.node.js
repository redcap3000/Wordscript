// WP API Using mysql node module
// Ronaldo Barbachano
// May 2012
// doinglines.com 
/*
	Add support for post lookup by tag, single page/post listings via title.

	Cleaned up flow, removed repetitive sql statements, moved variables around. SQL connections
	no longer created per each client, sql statements no longer execute when server requests the favicon.ico


*/ 



function append_table_alias(alias,fields){return fields.replace(/,/g,',' + alias + '.');}

// Your  node js server information ...

my_port = 1337;
my_server = 'your_domain.com';

// Name of your wordpress database and prefix

wp_db_name = 'your_db';
wp_prefix = 'wp_';

Client = require('mysql').Client;
client = new Client(); 

// Your server host, localhost should work for local installations
client.host ='mysql.mydb.com';
client.user = 'mysqlUser';
client.password = 'mysqlPass';

default_fields='id,post_title,post_name,post_author,post_date,post_content,post_type,post_status';


client.query('use ' + wp_db_name);
url = require('url');
http = require('http');
tags = [];

http.createServer(function (req, res) {
	console.log( req.method +	req.url );
	if (req.url == '/favicon.ico'){
		// do something here.. or return a file that is the ico...
	}	
	else{
		r_query = false;
		console.log(r_query);
		console.log("\n\n!creating server");
	 	var r_set = [], wp_query = '';
	  	res.writeHead(200, {'Content-Type': 'text/plain'});
		// get the url (this seems to run a few times..)
	  	var url_parts = url.parse(req.url,true);

	  if(req.method=='GET' && r_query == false) {
		// process a passed get method	
		wp_query =  'select ' + default_fields + ' from ' + wp_prefix + 'posts where post_status ="publish"';
			if(typeof(url_parts.query.category) != 'undefined'){
				wp_query = "SELECT "+append_table_alias('posts',default_fields)+", term.name as category FROM "+wp_prefix+"posts posts join "+wp_prefix+"term_relationships rel on posts.id = rel.object_id join "+wp_prefix+"term_taxonomy tax on tax.term_taxonomy_id = rel.term_taxonomy_id join "+wp_prefix+"terms term on term.term_id = tax.term_id where posts.post_status = 'publish' and posts.post_type = 'post' and slug = '"+url_parts.query.category+"' order by posts.post_date desc LIMIT 10;";
				// switch query to whatever the category is equal to
			}else if(typeof(url_parts.query.tag) != 'undefined'){
				// test this ... 
				wp_query = "SELECT " + default_fields + ",posts.id FROM "+ wp_prefix +"posts posts join "+ wp_prefix +"term_relationships rel on posts.id = rel.object_id join "+ wp_prefix +"term_taxonomy tax on tax.term_taxonomy_id = rel.term_taxonomy_id join "+ wp_prefix +"terms term on term.term_id = tax.term_id WHERE posts.post_status = 'publish' and posts.post_type = 'post' and taxonomy = 'post_tag' and slug='" + url_parts.query.tag + "' GROUP BY posts.id ;";
				// get a tag ..
			}else if(typeof(url_parts.query.post) != 'undefined'){
				// get one post, probably do some kind of sanitization
				wp_query += ' and post_type="post" and post_name= "' + url_parts.query.post + '" LIMIT 1;';
			}else if(typeof(url_parts.query.page) != 'undefined'){
				// get one page
				wp_query += ' and post_type="page" and post_name= "' + url_parts.query.page + '" LIMIT 1;';
			}else if(typeof(url_parts.query.categories) != 'undefined'){
				// get category listings
			}else{
				wp_query += ' and post_type="post" order by post_date desc LIMIT 10';
			
			}
		
		}else{
			//console.log('no get method');
			wp_query += 'post_type="post" order by post_date desc LIMIT 10';
		}
	
	    if(wp_query != '' && r_query == false){
	 
		client.query(
	        wp_query,
	        function selectCb(err, results, fields) {
	            if (err) {
	                console.log("ERROR: " + err.message);
	                throw err;
	            }else if (r_query == false){
	            console.log("Got "+results.length+" Rows:"   + '\n' + wp_query);
	
	            for(var i in results){
				// TAG lookup
					client.query("select name as tag from "+ wp_prefix+"posts posts join "+ wp_prefix+"term_relationships rel on posts.id = rel.object_id join "+ wp_prefix+"term_taxonomy tax on tax.term_taxonomy_id = rel.term_taxonomy_id join "+ wp_prefix+"terms term on term.term_id = tax.term_id where posts.post_status = 'publish' and posts.post_type = 'post'  and post_name='"+ results[i].post_name+"' and taxonomy = 'post_tag'",
					function procInnerResult(err,results2,fields){
						var temp_tags = [];
						for(x=0;x<results2.length;x++){
							temp_tags.push(results2[x].tag);
						}
						tags.push(temp_tags);
					});
		     	}
				for(z=0;z< results.length;z++){
					results[z].tags = tags[z];
				}
			
				res.write(JSON.stringify(results));
				res.end();
			
				r_query = true;
				//console.log(r_query);
	        }});
		}
	}
}

).listen(my_port, my_server);
console.log('Server running at ' + my_server+ ':' + my_port);