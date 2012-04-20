<?php
/*

	Wordscript JSON API (PHP) 
	Ronaldo Barbachano
	PHP 
	http://doinglines.com

*/


// add any extra fields that exist inside of posts table, careful here.
$default_fields ='id,post_title,post_name,post_author,post_date,post_content,post_type,post_status';

// stats
$start_time = (float) array_sum(explode(' ',microtime())) ;
$queries=0;

// super simple api for connecting to a wordpress 

// FILL THESE OUT

$config["db_name"] = "database_name";

$config["db_user"] = "database_user";

$config["db_pass"] = "dbpword";

$config["db_host"] = "localhost";

// on most installations this is simply wp_ , trailing underscore required!
// This is the prefix that is appended before all related wordpress tables

$config["wp"]="wp_";


if(isset($_GET['json'])){
	$directive = explode('/',$_GET['json'],6);
	$directive_count = count($directive);
	if(count($directive) > 5){
		unset($directive);
		unset($_GET);
		// reload page ...
	}else{
		if($directive[0] == 'posts'){
			if($directive_count > 1 ){
				if($directive[1] == 'category'){
					$query = "SELECT ".append_table_alias($alias,$default_fields).", term.name as category 
								FROM ".$config['wp']."posts posts join ".$config['wp']."term_relationships rel on posts.id = rel.object_id join ".$config['wp']."term_taxonomy tax on tax.term_taxonomy_id = rel.term_taxonomy_id join ".$config['wp']."terms term on term.term_id = tax.term_id 
								where posts.post_status = 'publish' and posts.post_type = 'post' and slug = '".$directive[2]."' 
								order by posts.post_date desc";
				
				}elseif($directive[1] == 'tag'){
				
					$query = "SELECT $default_fields,posts.id, post_title,post_name,post_date 
							  FROM ".$config['wp']."posts posts join ".$config['wp']."term_relationships rel on posts.id = rel.object_id 
									join ".$config['wp']."term_taxonomy tax on tax.term_taxonomy_id = rel.term_taxonomy_id 
									join ".$config['wp']."terms term on term.term_id = tax.term_id 
							  WHERE posts.post_status = 'publish' and posts.post_type = 'post' and taxonomy = 'post_tag' and slug='".$directive[2]."'
							  GROUP BY posts.id ". (isset($directive[4]) && $directive[4] == 'desc' ? ' desc ' : '') . (isset($directive[3]) ? ' LIMIT ' . $directive[3] : '');
					if(isset($directive[3])){
							$limit = ' LIMIT ' . $directive[3];
						
					}	
						//echo json_encode($query);	
				}elseif(is_numeric($directive[1])){
						$limit = ' LIMIT ' . $directive[1];
				}
			
			}
			
			if(!isset($query)){
				if(!isset($limit))
					$limit = ' LIMIT 10';		
				$query = 'select '. $default_fields .' from ' . $config['wp'].'posts where post_status ="publish" and post_type="post" order by post_date desc' . $limit;
				}
		}elseif($directive[0] == 'post'  || $directive[0] == 'page' && $directive_count == 2){
			$query = 'select '.$default_fields.' from ' . $config['wp'].'posts where post_status ="publish" and post_type="'.$directive[0].'" and post_name= "'.$directive[1].'" order by post_date desc' . $limit;
		}elseif($directive[0] =='categories'){
			$query = "SELECT distinct slug FROM ".$config['wp']."posts posts join ".$config['wp']."term_relationships rel on posts.id = rel.object_id join ".$config['wp']."term_taxonomy tax on tax.term_taxonomy_id = rel.term_taxonomy_id join ".$config['wp']."terms term on term.term_id = tax.term_id WHERE post_status = 'publish' and post_type != 'page' and taxonomy = 'category' ORDER BY post_date DESC";
		}
		
	}
	
	$mysqli_link = mysqli_init();
	if (!$mysqli_link)     die('mysqli_init failed');
	if (!mysqli_real_connect($mysqli_link, $config["db_host"], $config["db_user"], $config["db_pass"],$config["db_name"])) error_404('Connect Error (' . mysqli_connect_errno() . ') ' . mysqli_connect_error());
	if($directive[0] != 'categories' && $directive[0] != 'post' && $directive[0] != 'page'){
		if(isset($query) && !isset($action)) {
			// process a query that needs multiqueries..
			if(isset($_GET['limit']) && is_numeric($_GET['limit']) ){
				$query .= ' LIMIT ' . $_GET['limit'];
			}
			$action = get_results($query);
			
			if(!isset($_GET['noTags'])){
				foreach($action as $loc=>$post){
					$tags=get_results("select name as tag from ".$config['wp']."posts posts join ".$config['wp']."term_relationships rel on posts.id = rel.object_id join ".$config['wp']."term_taxonomy tax on tax.term_taxonomy_id = rel.term_taxonomy_id join ".$config['wp']."terms term on term.term_id = tax.term_id where posts.post_status = 'publish' and posts.post_type = 'post'  and post_name='".$post->post_name."' and taxonomy = 'post_tag'");
					if($tags)
						$action[$loc]->tags = clean_result($tags,'tag');
					}
			}
		}
	}elseif($action = get_results($query)){
		if($directive[0] == 'categories'){
			$action = clean_result($action,'slug');
		}
	}

	if(isset($_GET['stats']))
		$action['stats']=sprintf("%.4f", (((float) array_sum(explode(' ',microtime())))-$start_time)) * 1000 ."ms,  using " . round(memory_get_usage() / 1024) . " k  / and $queries queries " ;
	
	header('Content-type: application/json');

	echo (isset($_GET['embed']) ?'var wp_api='. json_encode($action) . ';':json_encode($action));

}


function append_table_alias($alias,$fields){
	// some advanced wp functions use aliases, this helps me keep all 
	// field listing consistent and customizable from a single location
	return str_replace(',',',posts.','posts.'.str_replace(' ','',$fields));
}

function clean_result($result,$field_name){
// removes redudant field listings for some queries (tags/categories)
		foreach($result as $obj)
			$r []= $obj->$field_name;
	return $r;
}

function get_results($query,$m_out=0){
	global $mysqli_link;
	global $queries;
	
	$queries++;
	$result = mysqli_query($mysqli_link,$query);
	if ($result)
		while($return = mysqli_fetch_object($result)){ 
			$results[] = $return;
			} 
    
	return $results;
}
