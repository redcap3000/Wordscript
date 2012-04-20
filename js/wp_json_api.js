<!--
## Wordscript
## Uses the WP Json API Plugin 
## Uses an XHR request to get the json properly from the plugin.
## Ronaldo Barbachano April 2012
## http://doinglines.com
-->


// functions that will define how the wordpress data appears in HTML
function wp_build_categories(cat){
		cat_link = 'wp_build_post("?json=get_category_posts&slug=' + cat.slug + '")'
	   return    _tag('div',null,"<a onclick='" + cat_link+ "' href='#'> " + cat.title +  '</a>')
	
}

function wp_build_post_content(the_post){
	return    _tag('h2',null,the_post.title_plain) +
				_tag('div','entry', 	_tag('div','date',the_post.date) +
					_tag('div','post',the_post.content)  )
    
}

// function that updates the DOM with json data (converted to HTML) using above functions
function wp_parse_response(json,data_key,HTML_target,css_id){

 	    data=eval("("+json+"."+data_key+")") //retrieve result as an JavaScript object
		if(css_id === undefined)
			css_id = data_key
		output = ''
		// switch based on data_key ??
		if(data_key == 'categories'){op_function = 'wp_build_categories'}
		
		if(data_key == 'posts'){op_function = 'wp_build_post_content'}
		
	   for (var i=0; i<data.length; i++){
		eval('output +=' + op_function + '(data[i])')
	   }

	   output+= document.getElementById(HTML_target).innerHTML+=output='<div id="'+css_id+'">' +  (data_key != 'posts'? _tag('h4',null,data_key):'') +  output + '</div>'
	
}

function wp_build_post(url){

	var wp_posts_request=new ajaxRequest()
	wp_posts_request.onreadystatechange=function(){
	 if (wp_posts_request.readyState==4){
	  if (wp_posts_request.status==200 || window.location.href.indexOf("http")==-1){
		wp_parse_response(wp_posts_request.responseText,'posts','content','content')
	  }
	  else{
	   alert("An error has occured making the request")
	  }
	 }
	}
	wp_posts_request.open("GET", wp_root_url + url, true)
	wp_posts_request.send(null)

}

// boilerplate ajaxRequest function
function ajaxRequest(){
 var activexmodes=["Msxml2.XMLHTTP", "Microsoft.XMLHTTP"] //activeX versions to check for in IE
 if (window.ActiveXObject){ //Test for support for ActiveXObject in IE first (as XMLHttpRequest in IE7 is broken)
  for (var i=0; i<activexmodes.length; i++){
   try{
    return new ActiveXObject(activexmodes[i])
   }
   catch(e){
    //suppress error
   }
  }
 }
 else if (window.XMLHttpRequest) // if Mozilla, Safari etc
  return new XMLHttpRequest()
 else
  return false
}

// convience function for rendering html tags
function _tag(tag,the_class,inner,extra){return '<' + tag + ' class="'+the_class+'"'+extra+'>' + inner + '</' + tag + '>'}


