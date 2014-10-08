$(function(){

	// Set default options
	JSONEditor.defaults.options.theme = 'bootstrap3';
	JSONEditor.defaults.options.disable_collapse = true;
	JSONEditor.defaults.options.disable_edit_json = true;
	JSONEditor.defaults.options.disable_properties = true;

	var editor;
	var profileType = 'Person';

	//Initialize the editor
	function initEditor(type){

		profileType = type;

		$.getJSON('res/js/schemas/'+profileType+'.json', function(json){

			document.getElementById('editor_holder').innerHTML = "";
			editor = new JSONEditor(document.getElementById('editor_holder'),json);

			editor.on('change',function() {

				var errors = editor.validate();
				if(errors.length) {

					$('#validator').removeClass('ok');
					$('#validator').text('Not valid');
					$('#validator').addClass('error');
					$('#generate_btn').addClass('disabled');

				}else{

					$('#validator').removeClass('error');
					$('#validator').text('Valid');
					$('#validator').addClass('ok');
					$('#generate_btn').removeClass('disabled');

				}

			});

		});

	}

	initEditor('Person');

	// TABS
	$("#tabPerson").on('click',function() {
		initEditor('Person');
		$("#tabPerson").addClass('active');
		$("#tabOrganisation").removeClass('active');
		$("#tabPlace").removeClass('active');
	});

	$("#tabOrganisation").on('click',function() {
		initEditor('Organization');
		$("#tabPerson").removeClass('active');
		$("#tabOrganisation").addClass('active');
		$("#tabPlace").removeClass('active');
	});

	$("#tabPlace").on('click',function() {
		initEditor('Place');
		$("#tabPerson").removeClass('active');
		$("#tabOrganisation").removeClass('active');
		$("#tabPlace").addClass('active');
	});

	// STEP 2
	$('#generateBtn').on('click',function() {

		// Validate
		var errors = editor.validate();
		if(!errors.length) {

      saveProfile();

		}

	});

	// UTILITY FUNCTIONS
	function profileWithoutId(profile){
		return delete profile['@id'];
	}

	function saveProfile(){

		var data = editor.getValue();
		data["@context"] = window.plp.config.context;
		data["@type"] = profileType;

		console.log(data);

		window.localStorage.setItem('profile',JSON.stringify(editor.getValue()));

	}

	function enableRemoteStorage(){

		remoteStorage.access.claim('shares', 'rw');
		remoteStorage.displayWidget();

	}

	function validateURL(value) {

		return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);

	}

});
