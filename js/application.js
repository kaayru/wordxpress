var media = {};

function getAllMediaId() {
	var success = false;
	var domain = $.url('domain');
	
	if (domain == "youtube.com") {
		success = parse_media_id(document.URL);
	}
	else if (domain == "dailymotion.com") {
		success = parse_media_id(document.URL);
	}
	else if (domain == "vimeo.com") {
		success = parse_media_id(document.URL);
	}
	else {
		$('embed,object,iframe,pagespeed_iframe').each(function() {
			success = parse_media_id($(this).attr('src'));
		});
	}

	if (success) { return true; }
	else { console.log("No valid media id detected on : "+document.URL); }
	return false;
}

function parse_media_id(url) {
	if (typeof url === "undefined")
		return false;

	var success = false;

	//if (url.match('http://(www.)?youtube|youtu\.be')) {
	if (url.match('//(www.)?youtube|youtu\.be')) {
		if (url.match('embed')) { youtube_id = url.split(/embed\//)[1].split('"')[0].split('?')[0]; }
		else { youtube_id = url.split(/v\/|v=|youtu\.be\//)[1].split(/[?&]/)[0]; }
		media[youtube_id] = "youtube";
		success = true;
	}
	else if (url.match('//(player.)?vimeo\.com')) {
		vimeo_id = url.split(/video\/|\/\/vimeo\.com\//)[1].split(/[?&]/)[0];
		media[vimeo_id] = "vimeo";
		success = true;
	}
	else if (url.match('//(www.)?dailymotion\.com')) {
		var m = url.match(/^.+dailymotion.com\/((embed|video|hub)\/([^_]+))?[^#]*(#video=([^_&]+))?/);
		dailymotion_id = m ? m[5] || m[3] : null;
		dailymotion_id = dailymotion_id.replace('video/', '');
		media[dailymotion_id] = "dailymotion";
		success = true;
	}

	return success;
}

function buildMediaItem(thumb_url, media_id, media_type, media_title, media_duration){
		var vid_thumbs = '';

		vid_thumbs += '<div class="viditem">';
		vid_thumbs += '<div class="selectbox">';
		vid_thumbs += '<input type="checkbox" name="'+media_type+'" value="'+media_id+'">';
		vid_thumbs += '</div>';
		vid_thumbs += '<div class="thumb">';
		vid_thumbs += '<img class="vidthumb" src="'+thumb_url+'" width="128" />';
		vid_thumbs += '</div>';
		vid_thumbs += '<div class="info">';
		vid_thumbs += '<i class="icon-film"></i> ';
		vid_thumbs += media_type;
		if(media_title != "")
		vid_thumbs += '<br>'+media_title.substring(0, 1).toUpperCase()+media_title.substring(1, 18).toLowerCase()+'...';
		if(Math.floor(media_duration / 60) > 0) {vid_thumbs += Math.floor(media_duration / 60)+'min ';}
		if(media_duration % 60 > 0) {vid_thumbs += '<br>time: ' + media_duration % 60 + 's';}
		vid_thumbs += '</div>';
		vid_thumbs += '</div>';
		
		return vid_thumbs;
}

function buildImgItem(img, width, height) {
		var img_thumbs = '';

		img_thumbs	  += '<div class="imgitem">';
		img_thumbs    += '<div class="selectbox">';
		img_thumbs    += '<input type="checkbox" class="imgchkbox" name="img" value="img">';
		img_thumbs    += '</div>';
		img_thumbs    += '<div class="thumb">';
		img_thumbs    += '<img class="imgthumb" width="128" src="'+img+'" />';
		img_thumbs    += '</div>';
		img_thumbs    += '<div class="info">';
		img_thumbs 	  += '<i class="icon-picture"></i> ';
		img_thumbs    += 'image<br>';
		img_thumbs    += 'width : '+width+'px<br>';
		img_thumbs    += 'height : '+height+'px<br>';
		img_thumbs    += '</div>';
		img_thumbs    += '</div>';
		
		return img_thumbs;
}

function pickMedia(){
	var thumbs = '';
	
	getAllMediaId();
	
	for (var vid in media) {
		$.ajaxSetup({async: false});
		if (media[vid] == 'youtube') {
				var thmb = "http://i.ytimg.com/vi/"+vid+"/mqdefault.jpg";
				$.getJSON("https://gdata.youtube.com/feeds/api/videos/"+vid+"?v=2&alt=json").done(function(data){thumbs += buildMediaItem(thmb, vid, media[vid], data.entry.title.$t, data.entry[ "media$group" ][ "yt$duration" ].seconds);}).fail(function(data){thumbs += buildMediaItem(thmb, vid, media[vid], "", 0);});
			}
		else if (media[vid] == 'dailymotion') {
				$.getJSON("https://api.dailymotion.com/video/" + encodeURIComponent(vid) + "?fields=title,duration,thumbnail_large_url").done(function(data){thumbs += buildMediaItem(data.thumbnail_large_url, vid, media[vid], data.title, data.duration);});
			}
		else if (media[vid] == 'vimeo') {
				$.getJSON('https://vimeo.com/api/v2/video/'+vid+'.json').done(function(data){thumbs += buildMediaItem(data[0].thumbnail_large, vid, media[vid], data[0].title, data[0].duration);});
			}
	}
	
	return thumbs;
}

function pickImg(mini_width, mini_height){
	var thumbs = '';
	var width_tmp = 0;
	var height_tmp = 0;
  
	$('img').each(function(){
		width_tmp = this.width;
		height_tmp = this.height;
		
		if(width_tmp >= mini_width && height_tmp >= mini_height){
			thumbs += buildImgItem($(this).prop('src'), width_tmp, height_tmp);
		}
	});
	  
	return thumbs;
}

chrome.runtime.onMessage.addListener(
function(request, sender, sendResponse){
	if (request.method == "updateMedias"){
		
		media = {};
		
		sendResponse({
			'img': pickImg(request.mini_width, request.mini_height),
			'media': pickMedia(),
			'current_url': document.URL
		});
	}
});

