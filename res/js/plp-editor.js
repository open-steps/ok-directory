$(function(){

  // Set default options
  JSONEditor.defaults.options.theme = 'bootstrap3';
  JSONEditor.defaults.options.disable_collapse = true;
  JSONEditor.defaults.options.disable_edit_json = true;
  JSONEditor.defaults.options.disable_properties = true;

  var editor;
  var profileType = 'Person';

  //Initialize the editor
  function initEditor(type,profile){

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

      if (profile){
        editor.setValue(profile);
      }

    });

  }

  initEditor('Person');

  // TABS
  $("#tabPerson").on('click',function() {
    initEditor('Person');
    selectProfileType("Person");
  });
  $("#tabOrganization").on('click',function() {
    initEditor('Organization');
    selectProfileType("Organization");
  });
  $("#tabPlace").on('click',function() {
    initEditor('Place');
    selectProfileType("Place");
  });

  // STEP 2
  $('#generateBtn').on('click',function() {

    // Validate
    var errors = editor.validate();
    if(!errors.length) {

      saveProfile();

      var uriInProvider = "";

      console.log('Posting profile to provider ' + localStorage.profile);

      superagent.post(window.plp.config.provider)
      .type('application/ld+json')
      .accept('application/ld+json')
      .send(localStorage.profile)
      .end(function(err,provRes){

        if (err){

          console.log('Error ' + err);

        }else{

          if(provRes.ok) {

            console.log('Profile successfully pushed to provider ' + provRes.text);
            uriInProvider = JSON.parse(provRes.text)["@id"];

            // FIXME: handle errors
            var profile = JSON.parse(provRes.text);

            if (window.plp.config.directory){

              superagent.post(window.plp.config.directory)
                .type('application/ld+json')
                .accept('application/ld+json')
                .send(JSON.stringify(profile))
                .end(function(err,dirRes){

                  if (err){
                    console.log('Error ' + err);
                    showProfilePublishedError();
                  }

                  if (dirRes.ok){
                    console.log('Profile succesfully listed in directory ' + dirRes.text);
                    showProfilePublishedOk(uriInProvider);
                  }

              });

            }

          }

        }

      });

    }

  });

  $('#editBtn').on('click',function() {

    var url = $('#existing_profile_field').val();

    if (validateURL(url)){

      superagent.get(url)
        .accept('application/ld+json')
        .end(function(err,res){

            if (err){

              console.log('Error ' + err);

              $('#existing_profile_field').val('Something went wrong');
              $('#existing_profile_field').addClass('error');

            }else{

              if(res.ok) {

                console.log('Profile correctly downloaded from provider ' + res.text);

                var profile = JSON.parse(res.text);
                var type = profile["@type"];
                initEditor(type,profile);
                selectProfileType(type);

              }

            }

         });

    }else{

      $('#toStep2Edit').addClass('disabled');

    }

  });

  $('#existing_profile_field').on('input',function() {

    var url = $('#existing_profile_field').val();
    if (validateURL(url)){
      $('#editBtn').removeClass('disabled');
    }else{
      $('#editBtn').addClass('disabled');
    }

  });

  // UTILITY FUNCTIONS

  function showProfilePublishedOk(profile_url){

    nd._afterRegisteringNewUser();

    $('#profile-published').modal('show');
    $('#profile-published-body').append("<span class=\"glyphicon glyphicon-ok large-icon ok\"></span>");
    $('#profile-published-body').append("<h2>Profile successfully Saved</h2>");
    $('#profile-published-body').append("<p>Thanks for registering on our directory. You have just created/modified a PLP Profile which can be found under the following URL:</br><h2>"+profile_url+"<h2></p>");
    $('#profile-published-body').append("<hr>");
    $('#profile-published-body').append("<p>Do you know PLP Profiles already? if not, you can experience more about them <a href=\"http://profiles.allmende.io/\">here</a></p>");
  }

  function showProfilePublishedError(){

    nd._afterRegisteringNewUser();

    $('#profile-published').modal('show');
    $('#profile-published-body').append("<span class=\"glyphicon glyphicon-remove large-icon error\"></span>");
    $('#profile-published-body').append("<h2>Problem saving your profile</h2>");
    $('#profile-published-body').append("<p>Something went wrong while creating/modifying you profile. Please contact us at contact [at] open-steps.org</p>");

  }

  function selectProfileType(profile){

    $("#tabPerson").removeClass('active');
    $("#tabOrganization").removeClass('active');
    $("#tabPlace").removeClass('active');
    $("#tab"+profile).addClass('active');

  }

  function profileWithoutId(profile){
    return delete profile['@id'];
  }

  function saveProfile(){

    var editorValue = editor.getValue();
    editorValue["@type"] = profileType;
    editorValue["@context"] = window.plp.config.context;

    var profile = JSON.stringify(editorValue);
    window.localStorage.setItem('profile', profile);
    console.log("Profile stored in localStorage " + profile);

  }

  function enableRemoteStorage(){

    remoteStorage.access.claim('shares', 'rw');
    remoteStorage.displayWidget();

  }

  function validateURL(value) {

    return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);

  }

});
