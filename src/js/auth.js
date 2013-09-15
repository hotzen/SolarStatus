$(document).ready(function() {
	$("form[name=auth]").submit(function() {
		var $form = $(this);
		
		// append hash
		var action = $form.attr("action") 
		if (window.location.hash && window.location.hash.length > 1 && action.indexOf("#") == -1) {
			$form.attr("action", action + window.location.hash)
		}
		
		var challenge = $form.find("input[name=c]").val()
		var password  = $form.find("input[name=p]").val()
		
		$form.find("input[name=p]").val("")
		$form.find("input[name=r]").val( $.sha1( challenge + password ) )
	});
})