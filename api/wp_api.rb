#! /usr/bin/env rubyo
## Wordscript JSON API Ruby
## Simple script for connecting to wordpress db; local or remote
## Sends generated queries and returns results as JSON. 
## Uses Gems - mysql2, json
## Ronaldo Barbchano April 2012

## Edit mysql2 connection hash at the END of the script... Designed to avoid loading 
## json/mysql if the get param isn't valid

require 'cgi'

get = CGI.new


## These are what most queries will return add remove-rename at will just no comma at the end - post_name must be present for tags to render properly
default_fields = 'id,post_title,post_name,post_author,post_date,post_content,post_type,post_status'

## use &limit=15 to override
default_limit = "10"
#default_fields = "id,post_title"

wp_pre = 'wp_'

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

#puts directive[0] + directive[1] + directive[2]

# simple def to append table aliases to default fields (for advanced queries with joins)
def append_table_alias(name,fields)
  fields.gsub(',' ,','+ name +'.')
end

if(directive[0] == 'posts')

	if(directive.size > 1)
		
		if(directive[1] == 'category')
		  
		  # lookup posts category
		  
			query = "SELECT " + append_table_alias('posts',default_fields) + ", term.name as category 
						FROM " + wp_pre + "posts posts join " + wp_pre + "term_relationships rel on posts.id = rel.object_id join " + wp_pre + 
						"term_taxonomy tax on tax.term_taxonomy_id = rel.term_taxonomy_id join "+ wp_pre +"terms term on term.term_id = tax.term_id 
						where posts.post_status = 'publish' and posts.post_type = 'post' and slug = '" + directive[2] + "' 
						order by posts.post_date desc " + 'LIMIT ' + (directive[2] ? directive[2] : default_limit) + ";"
		elsif(directive[1] =='tag')
		  
		  # lookup posts by tag
		  
			query = "SELECT " + default_fields + ",posts.id, post_title,post_name,post_date 
					  FROM "+ wp_pre +"posts posts join "+ wp_pre +"term_relationships rel on posts.id = rel.object_id 
							join "+ wp_pre +"term_taxonomy tax on tax.term_taxonomy_id = rel.term_taxonomy_id 
							join "+ wp_pre +"terms term on term.term_id = tax.term_id 
					  WHERE posts.post_status = 'publish' and posts.post_type = 'post' and taxonomy = 'post_tag' and slug='" + directive[2] + "'
					  GROUP BY posts.id " + 'LIMIT ' + (directive[3] ? directive[3] : default_limit) + ';'
			# check for directive 3 to do the 'limit'

		elsif(directive[1].is_number?)

		  #default .. with limit (this could be better)
		  
		  query = 'select ' + default_fields + '  from ' + wp_pre + 'posts where post_status="publish" and post_type="post" order by post_date desc LIMIT;' + directive[1]

  	end

	else

	# default 'select of posts;'... check for a limit tho..	

		query = 'select ' + default_fields + '  from ' + wp_pre + 'posts where post_status="publish" and post_type="post" order by post_date desc;'

	end
elsif(directive[0] == 'page' && directive[1])

  # lookup page

	query = 'select ' + default_fields + ' from ' + wp_pre + 'posts where post_status ="publish" and post_type="' + directive[0] + '" and post_name= "' + directive[1] + '" order by post_date desc LIMIT 1;'
elsif(directive[0] == 'categories')
  
  #lookup list of categories, this will need to be handled slightly different ? 
  query = "SELECT distinct slug FROM "+ wp_pre + "posts posts join "+ wp_pre + "term_relationships rel on posts.id = rel.object_id join "+ wp_pre + "term_taxonomy tax on tax.term_taxonomy_id = rel.term_taxonomy_id join "+ wp_pre + "terms term on term.term_id = tax.term_id WHERE post_status = 'publish' and post_type != 'page' and taxonomy = 'category' ORDER BY post_date DESC";	
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

# Make mysql connection # Provide your info here...
	client = Mysql2::Client.new(:host => "hostname", :username => "username", :password=> "pass", :database=>"db")

	result = []

	client.query(query).each do |row|
	  
	  # do additional lookup for tags.. 
	  # but check for noTags to prevent these lookups..
	  #if(get.params['noTags'] == undefined)
	  if(1 != 0 && directive[0] != 'categories')
     query2 = "select name as tag from " + wp_pre + "posts posts join "+ wp_pre +"term_relationships rel on posts.id = rel.object_id join "+ wp_pre +"term_taxonomy tax on tax.term_taxonomy_id = rel.term_taxonomy_id join "
              + wp_pre +"terms term on term.term_id = tax.term_id where posts.post_status = 'publish' and posts.post_type = 'post'  and post_name='" + row["post_name"] + "' and taxonomy = 'post_tag'"
      row["tags"] = []
      client.query(query2).each do |row2|
        row["tags"].push(row2["tag"])
      end  
		end  
		
		if(directive[0] == 'categories')
      # store less verbose version slug: cat1,slug: cat2 becomes cat1,cat2
      result.push(row["slug"])   
    else
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
