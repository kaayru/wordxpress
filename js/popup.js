var url = '';
var login = '';
var pwd = '';
var userid = 0;
var width = 0;
var height = 0;
var mini_width = 0;
var mini_height = 0;
var current_url = '';

var success_btn = '<button id="btn_post" class="btn btn-large btn-success"><i class="icon-ok icon-white"></i> Post published !</button>';
var loading_btn = '<button id="btn_post" class="btn btn-large btn-info disabled"><i class="icon-glass icon-white"></i> Posting...</button>';
var warning_btn = '<button id="btn_post" class="btn btn-large btn-warning disabled"><i class="icon-fire icon-white"></i> Posting failed !</button>';
var connect_btn = '<button id="btn_post" class="btn btn-large btn-error disabled"><i class="icon-resize-full icon-white"></i> Connection problem !</button>';

//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------
$(window).ready(function(){	
  set_blog_vars();

  if(!url || !login || !pwd || userid == 0 || width == 0 || height == 0){
    chrome.tabs.create({url: "options.html"});
    window.close();
  }
  else{
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	  chrome.tabs.sendMessage(tabs[0].id, {method: "updateMedias", mini_width: mini_width, mini_height: mini_height}, function(response) {
	        var post_img = response.img;
    		var post_media = response.media;
			current_url = response.current_url;

    		$('#destination').html(url);

    		if(post_img){$('#post_image').html(post_img);}
			if(post_media){$('#post_media').html(post_media);}
			if(current_url){$('#post_source').val(current_url);}

    		get_categories();

    		$('#btn_post').click(function(){
				get_embeds();
  			});
	  });
	});
  }
});

$(document).on('click','.imgchkbox', function(){
	if($(this).is(':checked')){
		$('.imgchkbox').not(this).attr('checked', false);
	}
});

$(document).on('click','#source_btn', function(){
		$('#post_content').val($('#post_content').val()+'[source]'); 
});

//----------------------------------------------------------------------------------------------
//---------------- Build post (img, video, content, title, category, tags) ---------------------
//----------------------------------------------------------------------------------------------
function get_embeds() {
	$('#post_button').html(loading_btn);
	
	var img = '';
	var media = '';
	var imgflag = false;
	var content = '<p>' + $('#post_content').val() + '</p>';
  
	$("input:checked").each(function() {
		if (this.name == 'img')
			imgflag = true;
		else if (this.name == 'youtube')
			media += '<p>' + embed_youtube(this.value) + '</p>';
		else if (this.name == 'vimeo')
			media += '<p>' + embed_vimeo(this.value) + '</p>';
		else if (this.name == 'dailymotion')
			media += '<p>' + embed_dailymotion(this.value) + '</p>';
		}
	);
  
	if (imgflag == true) {
			var selectedimgdiv = $(".imgitem:has(input:checked)")[0];
			var selectedimgsrc = $(selectedimgdiv).find(".imgthumb")[0].src;
			get_uploaded_img_url(selectedimgsrc, content, media, true);
		}
	else {
			//for featured img
			var firstmediadiv = $(".viditem:has(input:checked)")[0];
			var firstmediasrc = $(firstmediadiv).find(".vidthumb")[0].src;
			get_uploaded_img_url(firstmediasrc, content, media, false);			
		}
		//postek(img, content, media, $('.vidthumb')[0].src);
}

//----------------------------------------------------------------------------------------------
function postek(img, content, media, featimgid) {
	content = content.replace('[source]', '<a href="'+current_url+'" target="_blank">source</a>');
	var post = img+content+media;
	var title = $('#post_title').val();
	var category = parseInt($("#post_category option:selected").val());
	var tags = $("#post_tags").val().replace(/[`~!@#$%^&*()_|+\-=?;:'".<>\{\}\[\]\\\/]/gi, '');
	
	tags = $.trim(tags);
	var tagtab = tags.split(/[\s,]+/);
	tagtab = $.grep(tagtab, function(n){
		return (n !== "" && n !== " " && n != null);
		});
  
	post_to_worpress(title, post, category, tagtab, featimgid);
}

//----------------------------------------------------------------------------------------------
function get_uploaded_img_url(file, content, media, insertimg){
    var xhr = new XMLHttpRequest();
    xhr.open("GET", file, true);
	xhr.responseType = 'arraybuffer';
	
	var filename = $.url('file',file);
	var fileext = $.url('fileext',file);
	var mime = "image/jpeg";
	
	if (fileext == 'png')
		mime = "image/png";
	else if (fileext == 'gif')
		mime = "image/gif";

	xhr.onload = function(e) {
		//console.log(filename+' - '+mime);
		$.xmlrpc({
				url: url + '/xmlrpc.php',
				dataType: 'xml',
				methodName: 'wp.uploadFile',
				params: [1, login, pwd,
							{name: filename,
							type: mime,					
							bits: e.currentTarget.response,
							overwrite: true
							}
						],
				success: function(response){
							var img = '';
							if (insertimg == true) {img = '<p><img src="' + response[0].url + '" width="'+width+'" /></p>';}
							postek(img, content, media, response[0].id);
						},
				error: function(err, status, thrown){
							console.log(err);
							console.log(status);
						}
			});	
	};
    xhr.send();
}

//----------------------------------------------------------------------------------------------
function post_to_worpress(title, post, selcategory, tagtab, featimgid){
	$.xmlrpc({
		url: url + '/xmlrpc.php',
		methodName: 'wp.newPost',
		params: [1, login, pwd, 
					{post_type: 'post', 
					post_status: 'publish', 
					post_author: userid, 
					post_title: title, 
					post_content: post,
					comment_status: 'open',
					post_thumbnail: featimgid,
					terms: {category: [selcategory]},
					terms_names : {post_tag: tagtab},
					custom_fields: [{"key": "rss_pi_source_url", "value": current_url}]
					}
				],
		success: function(response){
					var xml = $($.parseXML(response));
					var post_id = xml.find('post_id');

					if(post_id){
						$('#post_button').html(success_btn);
					}
					else{
						$('#post_button').html(warning_btn);
					}
					window.setInterval( function(){window.close();}, 2000);
				},
		error: function(err, status, thrown){
					switch(status){
						case 'timeout':
							$('#post_button').html(connect_btn);
						break;
        
						case 'error':
							$('#post_button').html(warning_btn);
						break;

						default:
							$('#post_button').html(warning_btn);
					}
					window.setInterval( function(){window.close();}, 2000);
				}
	});  
}

//----------------------------------------------------------------------------------------------
//--------------------------- Get list of wordpress categories ---------------------------------
//----------------------------------------------------------------------------------------------
function get_categories() {
			$.xmlrpc({
					url: url + '/xmlrpc.php',
					dataType: 'xml',
					methodName: 'wp.getTerms',
					params: [1, login, pwd, 'category'],
					success: function(response){
								$.each(response[0], function(index, value) {
										$('#post_category').append('<option value="' + value['term_id'] + '">' + value['name'] + '</option>');
								});
							},
					error: function(err, status, thrown){
								var xml = $($.parseXML(err));
								console.log(xml);
							}
				});
}

function set_blog_vars() {
	url = localStorage['postek_url_1'];
	login = localStorage['postek_login_1'];
	pwd = localStorage['postek_pwd_1'];
	userid = localStorage['postek_userid_1'];
	width = localStorage['postek_width_1'];
	height = localStorage['postek_height_1'];
	mini_width = localStorage['postek_mini_width_1'];
	mini_height = localStorage['postek_mini_height_1'];
}

//----------------------------------------------------------------------------------------------

function embed_youtube(id) {
	return('<iframe width="'+width+'" height="'+height+'" src="http://www.youtube.com/embed/'+id+'" frameborder="0" allowfullscreen></iframe>');
}

function embed_vimeo(id) {
	return('<iframe src="http://player.vimeo.com/video/'+id+'" width="'+width+'" height="'+height+'" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>');
}

function embed_dailymotion(id) {
	return('<iframe src="http://www.dailymotion.com/embed/video/'+id+'?logo=1" width="'+width+'" height="'+height+'" frameborder="0"></iframe>');
}

//----------------------------------------------------------------------------------------------
// Google Analytics




