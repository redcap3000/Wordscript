<?php
/*

	Wordscript JSON API (PHP) 
	Ronaldo Barbachano
	PHP 
	http://doinglines.com

*/


require('config.php');

// add any extra fields that exist inside of posts table, careful here.
$default_fields ='id,post_title,post_name,post_author,post_date,post_content,post_type,post_status';

// stats
$start_time = (float) array_sum(explode(' ',microtime())) ;
$queries=0;
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
					if($config['meta']){
						$meta = get_results("SELECT * FROM ". $config['wp']."postmeta WHERE post_id='".$post->id."' ");
					// process meta tags, including images and attachments pro
						foreach($meta as $meta_field){
                            
							if(isset($meta_field->meta_key) && isset($meta_field->meta_value)){
								// process thumbnail
                                if($meta_field->meta_key== '_thumbnail_id'){
                                    $thumb = get_results("SELECT guid,meta_key,meta_value FROM wp_posts JOIN ".$config['wp']."postmeta ON ".$config['wp']."posts.id = ".$config['wp']."postmeta.post_id WHERE post_id=" . $meta_field->meta_value . " AND meta_key ='_wp_attachment_metadata' LIMIT 1" );
                    
                                    $thumb = $thumb[0];
                    
                                    $thumb_data = unserialize($thumb->meta_value);
                                    // sometimes wordpress throws up a meta field thumbnail_id that is just an empty file
                                    // probably taxonomy spillage, this makes that check and avoids processing
                                    if(isset($thumb_data['file']) && empty($thumb_data['file'][0])){
                                            $thumb_data = false;
                                    }
                    
                                    // look up this meta_value inside of post meta..
                    
                                    // we're given a file name for each image size. but its somewhat useless
                                    // because then we have to reconstruct it anyway to fit into the file path.
                                    // good job wordpress.
                    
                                    if($thumb_data){
                        
                                            $thumb_data['file'] = explode('/',$thumb_data['file']);

                                            // remove?, appends an images directory to the path, remove to remove all abs. references
                        
                                            if(!isset($thumb_data['sizes']['medium'])){
                                                // this is if we are working with a thumb nail image anyhow...
                            
                                                if(isset($thumb_data['sizes']['thumbnail'])){
                                                    // use these values instead
                            
                                                        $useable_filename = $images_directory . $thumb_data['file'][0]. '/'. $thumb_data['file'][1] . $thumb_data['sizes']['thumbnail']['file'];
                                
                                                        // set values because i'm lazy? 
                                
                                                        $thumb_data['sizes']['medium'] = $thumb_data['sizes']['thumbnail'];

                                                }elseif(isset($thumb_data['image_meta'])){
                                                        // this can't be right can it?                                        
                                                        $thumb_data['sizes']['medium']['height'] = $thumb_data['height'];
                                                        $thumb_data['sizes']['medium']['width'] = $thumb_data['width'];
                                                        $usable_filename = $images_directory . implode('/',$thumb_data['file']);
                                                        $thumb_data['sizes']['medium']['file'] = $usable_filename;
                               
                                                }
                                            }else{
                                                $usable_filename= $images_directory . $thumb_data['file'][0]. '/'. $thumb_data['file'][1] . '/' .$thumb_data['sizes']['medium']['file'];
                                            }
                                            // build appropriate paths /html to images may want to customize 'class='' to use $config, and may want to manipulate $config based on $_GET, add to row..
                                            $action[$loc]->meta ['thumb_img'] = "<img src='". $usable_filename. "' class='attachment-medium wp-post-image' width='" .$thumb_data['sizes']['medium']['width'] . "' height ='" .$thumb_data['sizes']['medium']['height'] . "' />";
                                            $action[$loc]->meta ['thumb_file'] = $images_directory . $thumb_data['file'][0]. '/'. $thumb_data['file'][1] . '/' .$thumb_data['sizes']['medium']['file'];
                                            $action[$loc]->meta ['thumb_width'] = $thumb_data['sizes']['medium']['width'];
                                            $action[$loc]->meta ['thumb_height'] = $thumb_data['sizes']['medium']['height'];
                                    }
                                    
								}

								if($meta_field->meta_key == '_attachments_pro'){
									// Make no mistake.. you'll still need the attachments_pro plug for this to work.
                                                       			 // so this gives us a really cruddy structure of where the post attachments go? and then just filter them into the location when running through the loop..
                                    $attachments = unserialize($meta_field->meta_value);
                                                            		// clean up
									$attach = array();
									if(isset($attachments['attachments']['attachments'])){
										$attachments = $attachments['attachments']['attachments'];
                                        foreach($attachments as $row=>$data){
                                            /* select multiple sets ??? , to only perform one lookup for guids
                                            object need to be built before hand or else tag values disappear ? */
                                            $attach []= 'id="' . $data['id']. '"';
                                            /* 
                                            restructure... but order is important...
                                            to use to link to the lookup value 
                                            */
                                            $struct[$row] = $data['id'];
                                            $aKey = $data['id'];
                                            // build the rest of the objects for the new values to insert into
										}
                                        $first_id = array_pop($attach);
                                        $lookup_att =  get_results('select ID as id,post_date_gmt,guid from '.$config['wp']. 'posts where '. $first_id. ' or '. implode(' or ',$attach).';');
                                        /* 
                                        next match the row->id to $struct and replace the value ?
                                        convert lookup_att to a single dimension array
                                        */
                                        foreach($lookup_att as $loc=>$att){
                                            $thumb_meta= get_results('select guid,meta_key,meta_value from '.$config['wp'].'posts join '.$config['wp'].'postmeta on '.$config['wp'].'posts.id = '.$config['wp'].'postmeta.post_id where meta_key = "_wp_attachment_metadata" and post_id ='. $att->id,'lat'.$att->id);
                                            /* 
                                                store medium sized attachment data for reassembly later ? 
                                                make a feature with not much data have an attachment ? hide the good with no info in it?
                                            */
                                            $thumb_meta = unserialize($thumb_meta[0]->meta_value);
                                            $thumb_main_attr['width'] = $thumb_meta['width']; 
                                            $thumb_main_attr['height'] =$thumb_meta['height'];
                                            $thumb_main_attr['file'] =$thumb_meta['file'];
                                        
                                            if(isset($thumb_meta['sizes']['medium']))
                                                    $thumb_main_attr['thumb'] = $thumb_meta['sizes']['medium'];
                                        
                                            // don't build the url yet.. save for 'display layer'
                                            $att_ar[$att->id] = $thumb_main_attr;
                                            $att_ar[$att->id]['post_date'] = $att->post_date_gmt;
                                            unset($thumb_main_attr);
                                            unset($thumb_meta);
                                        }
                                        // properly puts feature posts in order based on attachments_pro
                                        for($z=0;$z< count($struct);$z++){
                                            // move post date up a level to make processing simpler
                                            $action[$loc]->meta['_attachments_pro'][$z]['post_date'] = $att_ar[$struct[$z]]['post_date'];
                                            $action[$loc]->meta['_attachments_pro'][$z]['thumb_img'] = $att_ar[$struct[$z]];
                                        }
                                    }
							}
						}
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
	}
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
    
	return (isset($results) ?$results:false) ;
}
