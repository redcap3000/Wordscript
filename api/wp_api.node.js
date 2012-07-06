// WP API Using mysql node module
// Ronaldo Barbachano
// July 2012
// doinglines.com 

function append_table_alias(alias,fields){return fields.replace(/,/g,',' + alias + '.');}

Client = require('mysql').Client;
client = new Client(); 

require('./config.node.js')


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
console.log(url_parts.query)
	  if(req.method=='GET' && r_query == false && url_parts.query.json != undefined) {
	  		directive = url_parts.query.json.split('/')
	  		console.log(url_parts.query)
		// process a passed get method	
		
			if(directive[1] != undefined){
				wp_query =  'SELECT ' + default_fields + ' FROM ' + wp_prefix + 'posts WHERE post_status ="publish"';
				
			
		
				if(directive[0] != 'posts' && directive[0] != 'tag' && directive[0] != 'page' && directive[0] != 'post' && directive[0] != 'posts'){
				// process a category
					wp_query = "SELECT "+append_table_alias('posts',default_fields)+", term.name AS category FROM "+wp_prefix+"posts posts JOIN "+wp_prefix+"term_relationships rel ON posts.id = rel.object_id JOIN "+wp_prefix+"term_taxonomy tax ON tax.term_taxonomy_id = rel.term_taxonomy_id JOIN "+wp_prefix+"terms term ON term.term_id = tax.term_id WHERE posts.post_status = 'publish' AND posts.post_type = 'post' AND slug = '"+ directive[0]+"' ORDER BY posts.post_date DESC LIMIT " + (directive[1]!= undefined ? directive[1] : "10") + (directive[2] != undefined ? ' OFFSET ' + directive[2] : '') + ';';
					// switch query to whatever the category is equal to
				}else if(directive[0] == 'tag'){
					// test this ... 
					wp_query = "SELECT " + default_fields + ",posts.id FROM "+ wp_prefix +"posts posts JOIN "+ wp_prefix +"term_relationships rel ON posts.id = rel.object_id JOIN "+ wp_prefix +"term_taxonomy tax ON tax.term_taxonomy_id = rel.term_taxonomy_id JOIN "+ wp_prefix +"terms term ON term.term_id = tax.term_id WHERE posts.post_status = 'publish' AND posts.post_type = 'post' AND taxonomy = 'post_tag' AND slug='" + directive[1] + "' GROUP BY posts.id LIMIT " + (directive[2]!= undefined? directive[2]:'10') + (directive[3] != undefined? ' OFFSET ' + directive[3] : '') +';';
					// get a tag ..
				}else if(directive[0] == 'post'){
					// get one post, probably do some kind of sanitization
					wp_query += ' AND post_type="post" AND post_name= "' + directive[1] + '" LIMIT 1;';
				}else if(directive[0] == 'page'){
					// get one page
					wp_query += ' AND post_type="page" AND post_name= "' + directive[1] + '" LIMIT 1;';
				}else if(directive[0] == 'categories'){
					// get category listings
				}else if(directive[0] == 'posts'){
					wp_query += ' AND post_type="post" ORDER BY post_date DESC LIMIT ' + directive[1] + (directive[2] != undefined? ' OFFSET ' + directive[2] : '')+ ';';
				}
			}
	
	    if(wp_query != '' && r_query == false){
		    console.log(wp_query);
		client.query(
	        wp_query,
	        function selectCb(err, results, fields) {
	            if (err) {
	                console.log("ERROR: " + err.message);
	                //throw err;
	            }else if (r_query == false){
	            console.log("Got "+results.length+" Rows:"   + '\n' + wp_query);
	
	            for(var i in results){
		        //  meta = [];
				// TAG lookup
					client.query("SELECT name AS tag FROM "+ wp_prefix+"posts posts JOIN "+ wp_prefix+"term_relationships rel ON posts.id = rel.object_id JOIN "+ wp_prefix+"term_taxonomy tax ON tax.term_taxonomy_id = rel.term_taxonomy_id JOIN "+ wp_prefix+"terms term ON term.term_id = tax.term_id WHERE posts.post_status = 'publish' and posts.post_type = 'post'  and post_name='"+ results[i].post_name+"' and taxonomy = 'post_tag'",
					function procInnerResult(err,results2,fields){
						var temp_tags = [];
						for(x=0;x<results2.length;x++){
							temp_tags.push(results2[x].tag);
						}
						tags.push(temp_tags);
					});
					
					// build array and assemble them in one call instead of looping them over
					/*
					console.log("SELECT guid,meta_key,meta_value FROM wp_posts JOIN "+wp_prefix+"postmeta ON "+wp_prefix+"posts.id = "+wp_prefix+"postmeta.post_id WHERE post_id=" + results[i]['id'] + " AND meta_key ='_wp_attachment_metadata' LIMIT 1");
					
						
					client.query("SELECT guid,meta_key,meta_value FROM wp_posts JOIN "+wp_prefix+"postmeta ON "+wp_prefix+"posts.id = "+wp_prefix+"postmeta.post_id WHERE post_id=" + results[i]['id'] + " AND meta_key ='_wp_attachment_metadata' LIMIT 1",
					function procInnerResult(err,results3,fields){
						for(x=0;x<results3.length;x++){
							console.log(results3[x]);
							meta.push(results3[x]);
						}
					});	
					*/
					
		     	}
				for(z=0;z< results.length;z++){
					results[z].tags = tags[z];
//					results[z].meta = meta[z];
				}
		
//				results[z].meta = meta;
				res.write(JSON.stringify(results));
				res.end();
			
				r_query = true;
				//console.log(r_query);
	        }});
		}
	}
}
}
).listen(my_port, my_server);
console.log('Server running at ' + my_server+ ':' + my_port);