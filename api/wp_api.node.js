// WP API Using mysql node module
// Ronaldo Barbachano
// April 2012
// doinglines.com 
// wrote this quickly in a night so it is missing a lot of stuff
// that I will add in soon ... Currently only supports ?category= and the latest 10 posts (no url params)
// https://github.com/felixge/node-mysql

// WEIRD BUG - Tags won't begin to appear until one query has been run...
// nodejs seems to always make at least two createServers per each connection.. not sure whats going on here... 
// and seems to execute 2-3 extra queries as a result..



function append_table_alias(alias,fields){return fields.replace(/,/g,',' + alias + '.');}
var my_port = 1337;
var my_server = 'localhost';

http = require('http');
var tags = [];

http.createServer(function (req, res) {
	console.log('creating server');

	var url = require('url');
	// ADD WORDPRESS DB NAME HERE
	var wp_db_name = 'your_database_name';
	// WP PREFIX
	var wp_prefix = 'wp_';
	// default fields to include .. rename a field 
	// post_content as content,
	var default_fields='id,post_title,post_name,post_author,post_date,post_content,post_type,post_status';
 	var r_set = [];
	var wp_query = '';
	var Client = require('mysql').Client;

	client = new Client(); 

	var wp_query = '';

	// YOUR MYSQL HOST
	client.host ='mysql.remotehost.com';
	client.user = 'mysql_user';
	client.password = 'mysql_pass';
	// not sure what kinda memory implications are here not 'closing' or destroying a client
	// but with listen this seems to avoid reconnecting to the db, should assume once the script is 
	// quit the connection is released... otherwise move the client stuff inside of the createServer function
	// and issue a client.end();
	//console.log("connecting...");
	client.query('use ' + wp_db_name);


  	res.writeHead(200, {'Content-Type': 'text/plain'});
// get the url (this seems to run a few times..)
  	url_parts = url.parse(req.url,true);

  if(req.method=='GET') {
// process a passed get method	
		if(typeof(url_parts.query.category) != 'undefined'){
			wp_query = "SELECT "+append_table_alias('posts',default_fields)+", term.name as category FROM "+wp_prefix+"posts posts join "+wp_prefix+"term_relationships rel on posts.id = rel.object_id join "+wp_prefix+"term_taxonomy tax on tax.term_taxonomy_id = rel.term_taxonomy_id join "+wp_prefix+"terms term on term.term_id = tax.term_id where posts.post_status = 'publish' and posts.post_type = 'post' and slug = '"+url_parts.query.category+"' order by posts.post_date desc";
			// switch query to whatever the category is equal to
		}else if(typeof(url_parts.query.tag) != 'undefined'){
			// get a tag ..
		}else if(typeof(url_parts.query.post) != 'undefined'){
			// get one post
		}else if(typeof(url_parts.query.page) != 'undefined'){
			// get one page
		}else if(typeof(url_parts.query.categories) != 'undefined'){
			// get category listings
		}else if (wp_query == ''){
			wp_query = 'select ' +  default_fields + ' from ' + wp_prefix + 'posts where post_status ="publish" and post_type="post" order by post_date desc LIMIT 10';
			
		}
		
	}else{
			wp_query = 'select ' +  default_fields + ' from ' + wp_prefix + 'posts where post_status ="publish" and post_type="post" order by post_date desc LIMIT 10';
			
		}
	
    if(wp_query != ''){
	
	client.query(
        wp_query,
        function selectCb(err, results, fields) {
            if (err) {
                console.log("ERROR: " + err.message);
                throw err;
            }
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
        });
	}
}

).listen(my_port, my_server);
console.log('Server running at' + my_server);
