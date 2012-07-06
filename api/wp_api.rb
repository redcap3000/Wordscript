#! /usr/bin/env rubyo
## Wordscript JSON API Ruby
## Simple script for connecting to wordpress db; local or remote
## Sends generated queries and returns results as JSON. 
## Uses Gems - mysql2, json, php-serialize
## Ronaldo Barbachano July 2012

## Edit mysql2 connection hash at the END of the script... Designed to avoid loading 
## json/mysql if the get param isn't valid

require 'cgi'

get = CGI.new

require('config.rb');

class String
  def is_number?
    true if Float(self) rescue false
  end
end

# for testing purposes to be determined by get variable json=

if(get.params['json'])
  # clean up directive
  directive = get.params['json'][0].split('/')
else
  directive = ['posts']
end

# simple def to append table aliases to default fields (for advanced queries with joins)
def append_table_alias(name,fields)
  fields.gsub(',' ,','+ name +'.')
end

if(directive[0] == 'posts')
	if(directive.size > 1)		
		if(directive[1] == 'category')
		  # lookup posts category
			query = "SELECT " + append_table_alias('posts',$default_fields) + ", term.name AS category 
						FROM " + $wp_pre + "posts posts JOIN " + $wp_pre + "term_relationships rel ON posts.id = rel.object_id JOIN " + $wp_pre + 
						"term_taxonomy tax ON tax.term_taxonomy_id = rel.term_taxonomy_id JOIN "+ $wp_pre +"terms term ON term.term_id = tax.term_id 
						WHERE posts.post_status = 'publish' AND posts.post_type = 'post' AND slug = '" + directive[2] + "' 
						ORDER BY posts.post_date DESC " + 'LIMIT ' + (directive[2] ? directive[2] : $default_limit) + ";"
		elsif(directive[1] =='tag')
		  # lookup posts by tag
			query = "SELECT " + $default_fields + ",posts.id, post_title,post_name,post_date 
					  FROM "+ $wp_pre +"posts posts JOIN "+ $wp_pre +"term_relationships rel on posts.id = rel.object_id 
							JOIN "+ $wp_pre +"term_taxonomy tax ON tax.term_taxonomy_id = rel.term_taxonomy_id 
							join "+ $wp_pre +"terms term ON term.term_id = tax.term_id 
					  WHERE posts.post_status = 'publish' AND posts.post_type = 'post' AND taxonomy = 'post_tag' AND slug='" + directive[2] + "'
					  GROUP BY posts.id " + 'LIMIT ' + (directive[3] ? directive[3] : $default_limit) + ';'
			# check for directive 3 to do the 'limit'
		elsif(directive[1].is_number?)
		  #default .. with limit (this could be better)
		  	query = 'SELECT ' + $default_fields + ' FROM ' + $wp_pre + 'posts WHERE post_status="publish" AND post_type="post" ORDER BY post_date DESC LIMIT ' + directive[1] + ';'
		end

	else
	# default 'select of posts;'... check for a limit tho..	 default posts .. get 10 json=posts
		query = 'SELECT ' + $default_fields + '  FROM ' + $wp_pre + 'posts WHERE post_status="publish" AND post_type="post" ORDER BY post_date DESC LIMIT ' +$default_limit +';'

	end
elsif(directive[0] == 'page' && directive[1])
  # lookup page
	query = 'SELECT ' + $default_fields + ' FROM ' + $wp_pre + 'posts WHERE post_status ="publish" AND post_type="' + directive[0] + '" AND post_name= "' + directive[1] + '" ORDER BY post_date DESC LIMIT 1;'
elsif(directive[0] == 'categories')
  
  #lookup list of categories, this will need to be handled slightly different ? 
  query = "SELECT DISTINCT slug FROM "+ $wp_pre + "posts posts JOIN "
  + $wp_pre + "term_relationships rel ON posts.id = rel.object_id JOIN "
  + $wp_pre + "term_taxonomy tax ON tax.term_taxonomy_id = rel.term_taxonomy_id JOIN "
  + $wp_pre + "terms term ON term.term_id = tax.term_id WHERE post_status = 'publish' AND post_type != 'page' AND taxonomy = 'category' ORDER BY post_date DESC";	
end

# Preparing header for output

puts "Content-type: application/json" 
puts

# process query and return json

if(query != nil && query != false)
# Loading depdencies  
	require 'rubygems' 
	require 'mysql2'
	require 'json'
	# gem install php-serialize	for attachments and metadata
	require 'php_serialize'
	client = Mysql2::Client.new(:host => $mysql_host, :username => $mysql_username, :password=> $mysql_password, :database=>$mysql_database)
	result = []	
	client.query(query.to_str).each do |row|
	  # do additional lookup for tags.. 
	  # but check for noTags to prevent these lookups..
	  #if(get.params['noTags'] == undefined)
	  if(directive[0] != 'categories')
      	query = "SELECT name as tag FROM " + $wp_pre + "posts posts JOIN "+ $wp_pre +"term_relationships rel ON posts.id = rel.object_id JOIN "+ $wp_pre +"term_taxonomy tax ON tax.term_taxonomy_id = rel.term_taxonomy_id JOIN " + $wp_pre +"terms term ON term.term_id = tax.term_id WHERE posts.post_status = 'publish' AND posts.post_type = 'post'  AND post_name='" + row['post_name'] + "' AND taxonomy = 'post_tag'"
         row["tags"] = []
         
         client.query(query).each do |row2|
	         row["tags"].push(row2["tag"])
	     end
	     # basic meta processing
	     # or create a var that stores a query2 history... trying to kiss.	     
	     # these get run in loops so this is probably the easiest way to
	     # handle a large number of rows and not utlize too much memory on strings
	     query = "SELECT * FROM " + $wp_pre + "postmeta WHERE post_id='" + row["id"].to_s + "' "
	     row["meta"] = [];
	     client.query(query).each do |row2|
	         row["meta"].push(row2)
	     end
	     # second pass to check for attachments etc...
	     row["meta"].each_with_index{|i,n| 
		     if(i['meta_key']=='_thumbnail_id')
			    query =  "SELECT guid,meta_key,meta_value FROM wp_posts JOIN "+$wp_pre+"postmeta ON "+$wp_pre+"posts.id = "+$wp_pre+"postmeta.post_id WHERE post_id=" + i['meta_value'].to_s + " AND meta_key ='_wp_attachment_metadata' LIMIT 1"
			    client.query(query).each do |thumbnail|			    
			    	row["meta"][n]['thumb'] = thumbnail.map { |key, value| 
			    		(key =='meta_value' && value != '' && value != nil ? PHP.unserialize(value):value.to_s) 
			    		}
			    	#filter blank values ?	
			    end
			 elsif (i['meta_key']=='_attachments_pro')
			 	row["meta"][n]['_at_pro']= PHP.unserialize(i["meta_value"])
			 	# look up related posts? if at pro's only variable is 'version' then theres nothing attached...
			 	# unserialize the meta_value
		     end 
	     }
	  end  
	if(directive[0] == 'categories')
      # store less verbose version slug: cat1,slug: cat2 becomes cat1,cat2
      result.push(row["slug"])   
    else
      # store the final 'row' inside an array called 'result'
      result.push(row)  
	end
   end
	# rendering result
   if(result.size > 0 )
	  puts JSON.generate(result)
	else
	  # Query returned no results
	  puts 'null'  
  end
else
    # Something wrong with query/get directive
    puts 'null'
end