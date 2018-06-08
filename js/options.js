$(document).ready(function(){
  // Load values
  $('#input_url_1').val(localStorage['postek_url_1']);
  $('#input_login_1').val(localStorage['postek_login_1']);
  $('#input_pwd_1').val(localStorage['postek_pwd_1']);
  $('#input_width_1').val(localStorage['postek_width_1']);
  $('#input_mini_width_1').val(localStorage['postek_mini_width_1']);
  $('#input_mini_height_1').val(localStorage['postek_mini_height_1']);
  
  $('#btn_save').click(function(){
    get_user_info(1, $('#input_url_1').val(), $('#input_login_1').val(), $('#input_pwd_1').val());
  });
});

//----------------------------------------------------------------------------------------------

function get_user_info(blogid, url, login, pwd){
	$.xmlrpc({
		url: url + '/xmlrpc.php',
		dataType: 'xml',
		methodName: 'wp.getProfile',
		params: [1, login, pwd],
		success: function(response){
					save_options(response);
				},
		error: function(err, status, thrown){
					console.log(err);
					console.log(status);
				}
	});
}

function save_options(response) {
	var width_1 = parseInt($('#input_width_1').val()) || 560;
	var height_1 = Math.round(width_1/1.777777778);
	
	var mini_width_1 = parseInt($('#input_mini_width_1').val()) || 500;
	var mini_height_1 = parseInt($('#input_mini_height_1').val()) || 200;
    // Save values
    localStorage['postek_url_1'] = $('#input_url_1').val();
    localStorage['postek_login_1'] = $('#input_login_1').val();
    localStorage['postek_pwd_1'] = $('#input_pwd_1').val();
    localStorage['postek_userid_1'] = response[0]['user_id'];
    localStorage['postek_width_1'] = width_1;
    localStorage['postek_height_1'] = height_1;
	localStorage['postek_mini_width_1'] = mini_width_1;
    localStorage['postek_mini_height_1'] = mini_height_1;
	
	$('#btn_save').removeClass("btn-primary");
	$('#btn_save').addClass("btn-success");
	$('#btn_save').html("The settings were succesfully saved. Just close this page and begin to use Postek !");
}

