$(document).ready(function() {
	$("#auth").submit(function() {
		var $form = $(this);
		
		var challenge = $form.find("input[name=c]").val()
		var password  = $form.find("input[name=p]").val()
		
		$form.find("input[name=p]").val("")
		$form.find("input[name=r]").val( $.sha1( challenge + password ) )
	});
})