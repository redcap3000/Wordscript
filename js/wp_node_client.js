// Wordscript Node Wordpress Client
// Ronaldo Barbachano
// http://doinglines.com

// Good example of how to interact with a mysql server via node, including 'inner queries' - queries
// that run based on the result of another query (to do tag lookups, specifically), and catching
// and processing the url (and GET params) to do various things. The greatest challenge in writing
// was to prevent the script from running multiple queries after a result set was achieved; and 
// properly processing GET directives.


// Using mysql node module
// https://github.com/felixge/node-mysql

// Renders html .. could more easily render JSON to be used as an API. Fill in wp server info inside of http.createServer
// set port and server name up top to match your node setup

// reload the script once to get appropriate output (working on fixing that)

var my_port = 1337;
var my_server = 'localhost';
http = require('http');
var tags = [];
http.createServer(function (req, res) {
	console.log('creating server');
if(typeof(results) == 'undefined')
	{
	var url = require('url');
	
	var wp_db_name = 'wordpress_mysql_database';
	var wp_prefix = 'wp_';
	// default fields to include .. rename a field 
	// post_content as content,
	var default_fields='id,post_title,post_name,post_author,post_date,post_content,post_type,post_status';
 	var r_set = [];
	var wp_query = '';
	var Client = require('mysql').Client;
	client = new Client(); 
	var wp_query = '';
	// Your mysql info. For local installation probably use localhost
	client.host ='localhost';
	client.user = 'root';
	client.password = 'password';

	client.query('use ' + wp_db_name);

  	res.writeHead(200, {'Content-Type': 'text/html'});

// get the url (this seems to run a few times..)
  	url_parts = url.parse(req.url,true);
  if(url_parts.path != '/favicon.ico' && url_parts.path != '/') {
		// process a passed get method	
		if(typeof(url_parts.query.category) != 'undefined' && wp_query ==''){
			wp_query = "SELECT "+append_table_alias('posts',default_fields)+", term.name as category FROM "+wp_prefix+"posts posts join "+wp_prefix+"term_relationships rel on posts.id = rel.object_id join "+wp_prefix+"term_taxonomy tax on tax.term_taxonomy_id = rel.term_taxonomy_id join "+wp_prefix+"terms term on term.term_id = tax.term_id where posts.post_status = 'publish' and posts.post_type = 'post' and slug = '"+url_parts.query.category+"' order by posts.post_date desc";
			// switch query to whatever the category is equal to
		}else if(typeof(url_parts.query.tag) != 'undefined'){
			console.log('url poarts . tag is defined');
			// get a tag ..
		}else if(typeof(url_parts.query.post) != 'undefined'){
			console.log('url poarts . tag is defined');
			// get one post
		}else if(typeof(url_parts.query.page) != 'undefined'){
			// get one page
		}else if(typeof(url_parts.query.categories) != 'undefined'){
			// get category listings
		}
	}else{
		// this is here because mysql often will keep querying the server after receiving a result...
		if(typeof(page) != 'undefined' && url_parts.path == '/favicon.ico')
			res.end('<!doctype html>\n<html>\n\t<head>\n\t<meta charset=UTF-8 >\n\t'+	page + '\t\t</body>\n</html>');
		else	
			wp_query = 'select ' +  default_fields + ' from ' + wp_prefix + 'posts where post_status ="publish" and post_type="post" order by post_date desc LIMIT 100';
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
			page_title='default';
			page='';
			res.write('<!doctype html>\n<html>\n\t<head>\n\t<meta charset=UTF-8 >\n\t<title>' + page_title + '</title>\n</head>\n\t<body>\n\t\t');

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
				// weird bug that renders tags as undefined but only after 'first load'
				// goes away subsequently
				if(typeof(tags[i]) != 'undefined')
					res.write(wp_build_post_content(results[i],tags[i]));
				else
					res.writeHead(302,{'location':'/'});
			}
			res.end( '\t\t</body>\n</html>');
        });
	}
}
}

).listen(my_port, my_server);
console.log('Server running at http://mdocs.info:1337');


// trigger event to get it to reload itself to avoid weird first load bugs?
// functions that will define how the wordpress data appears in HTML

function wp_build_categories(cat){
		cat_link = 'wp_build_post("?json=get_category_posts&slug=' + cat.slug + '")'
	   return    _tag('div',null,"<a onclick='" + cat_link+ "' href='#'> " + cat.title +  '</a>')

}

function wp_build_post_content(the_post,tags){
	return   _tag('div','post',    _tag('h2','title',the_post.post_title) +
				_tag('div','entry', 	_tag('div','date',the_post.post_date) +
					_tag('div','post',the_post.post_content)  + _tag('div','tags',tags)),'id="' + the_post.id + '"');
}

// function that updates the DOM with json data (converted to HTML) using above functions
// convience function for rendering html tags
function _tag(tag,the_class,inner,extra){return '<' + tag + ' class="'+the_class+'"'+(typeof(extra) == 'undefined' ? '':' '+ extra)+'>' + inner + '</' + tag + '>'}
function append_table_alias(alias,fields){return fields.replace(/,/g,',' + alias + '.');}
