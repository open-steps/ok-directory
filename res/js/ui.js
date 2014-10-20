var nd;

$(function(){
    nd = new Pyk.newsDiscovery();
    nd.init();
});

var Pyk = {};
var id_tags;
var mapViewOn = false;
var articles = new Object();
var activeArticle;

Pyk.newsDiscovery = function(){

    this.init = function(){

        // Load Facets & Render
        $.getJSON('res/data/facet.json', function(json){
            nd.facet = json;
            nd.renderColHeadings();
        });

        //Get the data from directory
        superagent.get(window.plp.config.directory)
          .set('Accept', 'application/json')
          .end(function(res){

            if (res.ok) {

              var graph = res.body["@graph"];
              nd.data = graph;
              nd.initCrossfilter();
              nd.initMap();
              nd.renderTags();
              nd.initSearch();

            } else {

              alert('Oh no! error ' + res.text);

            }

        });

    };


    this.renderColHeadings = function(){
        var h5s = $(".tag-holder h5"); // Capture all the required <h5> tags
        var f = this.facet.children;  // Get the data nd corresponds to it
        for(var i in f) $(h5s[i]).html(f[i].label);
    };


    this.initCrossfilter = function(){

      // this.data contains the array of profiles.
      this.cf = {};
      this.cf.data = crossfilter(this.data);

      this.cf.id_dimension = this.cf.data.dimension(function(d){
        var id = uuid.v4();
        articles[d["about"]["name"]] = d;
        return d["about"]["name"];
      });

      this.cf.dd_dimension = this.cf.data.dimension(function(d){
        if (!d["about"]["address"][0])
          return "N/A";
        return d["about"]["address"][0]["country"];
      });

      this.cf.ee_dimension = this.cf.data.dimension(function(d){
        if (!d["about"]["address"][0])
          return "N/A";
        return d["about"]["address"][0]["city"];
      });

      this.cf.ff_dimension = this.cf.data.dimension(function(d){

        if (d["about"]["@type"] == "Organization"){
          if (!d["about"]["name"])
            return "N/A";
          return d["about"]["name"];
        }else if(d["about"]["@type"] == "Person"){
          if (!d["about"]["memberOf"][0])
            return "N/A";
          return d["about"]["memberOf"][0]["name"];
        }

      });

      // We need 2 identical dimensions for the numbers to update
      // See http://git.io/_IvVUw for details
      this.cf.aa_dimension = this.cf.data.dimension(function(d){
        if (!d["about"]["interest"])
          return "N/A";
        return d["about"]["interest"];
      });

      // This is the dimension nd we'll use for rendering
      this.cf.aar_dimension = this.cf.data.dimension(function(d){
        if (!d["about"]["interest"])
          return "N/A";
        return d["about"]["interest"];
      });

      // Create empty filter roster
      this.activeFilters = {

          "ee": [],
          "ff": [],
          "dd": [],
          "aa": [],
          "id": []
      };

    };

    this.renderTags = function(){

      var nd = this;

      // Skills
      var aa_tags = this._aaReduce(this.cf.aar_dimension.groupAll().reduce(reduceAdd, reduceRemove, reduceInitial).value());
      var aa_list = d3.select("#table3").selectAll("li").data(aa_tags);
      aa_list.enter().append("li").html(function(d){
              var link = "<a href='#'>" + d.key;
              link += "<span class='badge'>" + d.value + "</span>";
              link += "</a>";
              return link;
          })
          .classed("active", function(d){
              return nd._isActiveFilter("aa", d.key);
          })
          .on("click", function(d){
              nd.filter("aa", d.key);
          });
      aa_list.exit().remove();

      // Country
      var dd_tags = this._removeEmptyKeys(this.cf.dd_dimension.group().all(), "dd");
      var dd_list = d3.select("#table1").selectAll("li").data(dd_tags);
      dd_list.enter().append("li").html(function(d){
              var link = "<a href='#'>" + d.key;
              link += "<span class='badge'>" + d.value + "</span>";
              link += "</a>";
              return link;
          })
          .classed("active", function(d){
              return nd._isActiveFilter("dd", d.key);
          })
          .on("click", function(d){
              nd.filter("dd", d.key);
          });
      dd_list.exit().remove();

      // City
      var ee_tags = this._removeEmptyKeys(this.cf.ee_dimension.group().all(), "ee");
      var ee_list = d3.select("#table6").selectAll("li").data(ee_tags);
      ee_list.enter().append("li").html(function(d){
              var link = "<a href='#'>" + d.key;
              link += "<span class='badge'>" + d.value + "</span>";
              link += "</a>";
              return link;
          })
          .classed("active", function(d){
              return nd._isActiveFilter("ee", d.key);
          })
          .on("click", function(d){
              nd.filter("ee", d.key);
          });
      ee_list.exit().remove();

      // organisation
      var ff_tags = this._removeEmptyKeys(this.cf.ff_dimension.group().all(), "ff");
      var ff_list = d3.select("#table2").selectAll("li").data(ff_tags);
      ff_list.enter().append("li").html(function(d){
              var link = "<a href='#'>" + d.key;
              link += "<span class='badge'>" + d.value + "</span>";
              link += "</a>";
              return link;
          })
          .classed("active", function(d){
              return nd._isActiveFilter("ff", d.key);
          })
          .on("click", function(d){
              nd.filter("ff", d.key);
          });
      ff_list.exit().remove();

      // Before rendering the Grid, we have to clear the layerGroup in the map instance in order to display new markers
      clearLayers();

      // Title aka Full Name
      id_tags = this._removeEmptyKeys(this.cf.id_dimension.group().all(), "id");
      var id_list = d3.select("#table4").selectAll("li").data(id_tags);
      id_list.enter().append("li").html(function(d){
            var article = nd._findArticleById(d.key);
            var link = "<a href='#'>" + article["about"]["name"];
            link += "<span class='badge'>" + d.value + "</span>";
            link += "</a>";

            return link;
        })
        .classed("active", function(d){
            return nd._isActiveFilter("id", d.key);
        })
        .on("click", function(d){
            nd.filter("id", d.key);
        });
      id_list.exit().remove();

      // Grid at the bottom
      d3.select("#grid").selectAll("div").remove();
      var grid_list = d3.select("#grid").selectAll("div").data(id_tags);
      grid_list.enter().append("div").html(function(d,i){

        var article = nd._findArticleById(d.key);
        var lastOne = i==grid_list[0].length-1 ? true : false;
        var cardHtml = nd._renderArticleCardPreview(article);
        codeAddressFromArticle(nd,article,lastOne);

        return cardHtml;

      })
      .on("click", function(d){
        var article = nd._findArticleById(d.key);
        nd._showArticleDetails(article);
      })
      .on("mouseover", function(d){
          var article = nd._findArticleById(d.key);
          panMapToArticle(nd,article);
      });

      grid_list.exit().remove();
    };

    this.filter = function(d, e){

      var nd = this;

      var i = this.activeFilters[d].indexOf(e);
      if(i < 0){
          this.activeFilters[d].push(e);
      }else{
          this.activeFilters[d].splice(i, 1);
      }
      // RUN ALL THE FILTERS! :P

      this.cf.ee_dimension.filterAll();
      if(this.activeFilters["ee"].length > 0){
          this.cf.ee_dimension.filter(function(d){
              return nd.activeFilters["ee"].indexOf(d) > -1;
          });
      }

      this.cf.dd_dimension.filterAll();
      if(this.activeFilters["dd"].length > 0){
          this.cf.dd_dimension.filter(function(d){
              return nd.activeFilters["dd"].indexOf(d) > -1;
          });
      }

      this.cf.ff_dimension.filterAll();
      if(this.activeFilters["ff"].length > 0){
          this.cf.ff_dimension.filter(function(d){
              return nd.activeFilters["ff"].indexOf(d) > -1;
          });
      }

      this.cf.id_dimension.filterAll();
      if(this.activeFilters["id"].length > 0){
          this.cf.id_dimension.filter(function(d){
              return nd.activeFilters["id"].indexOf(d) > -1;
          });
      }

      this.cf.aa_dimension.filterAll();
      if(this.activeFilters["aa"].length > 0){
          this.cf.aa_dimension.filter(function(d){
              // d is the data of the dataset
              // f is the filters nd are applied
              var f = nd.activeFilters["aa"];

              var filter = true;
              for(var i in f){
                  if(d.indexOf(f[i]) < 0) filter = false;
              }

              return filter;
          });
      }

      this.renderTags();
    };

    // Defines method for search and typeahead.
    this.initSearch = function(){

      var nd = this;
      var searchFilterArray = this._buildSearchFilterArray();

      $('#searchField').typeahead({

        source: function (query, process) {

          var articleTitles = searchFilterArray.articleTitles
          process(articleTitles);

        },
        updater: function (item) {

          var searchTerm = item;
          var article = searchFilterArray[searchTerm];
          if(article.filter){
              console.log(article);
              nd.filter(article.filter,article["id"]);
          }

          return item;

        },
        matcher: function (item) {

          if (!item) return false;

          if (item.toLowerCase().indexOf(this.query.trim().toLowerCase()) != -1) {
            return true;
          }

        },
        sorter: function (items) {

          return items.sort();

        },
        highlighter: function (item) {

         var regex = new RegExp( '(' + this.query + ')', 'gi' );
         return item.replace( regex, "<strong>$1</strong>" );

        },

      });

    };

    // Defines method for search and typeahead.
    this.initMap = function(){

      initializeMap();

    }

    $("#clearBtn").on('click',function(){
      nd.initCrossfilter();
      nd.renderTags();
      $("#searchField").val("");
    });

    $("#openJoinPageBtn").on('click',function(){
      nd._closeSidebar();
      $("#joinPage").fadeIn("slow");
    });

    $("#closeJoinPageBtn").on('click',function(){
      nd._openSidebar();
      $("#joinPage").hide();
    });

    $("#openInfoPageBtn").on('click',function(){
      nd._closeSidebar();
      $("#infoPage").fadeIn("slow");
    });

    $("#closeInfoPageBtn").on('click',function(){
      nd._openSidebar();
      $("#infoPage").hide();
    });

    /*--------------------
      HELPERS
    --------------------*/

    this._closeSidebar = function(){
      $("#left").removeClass("col-md-2").addClass("col-md-1");
      $("#middle").removeClass("col-md-10").addClass("col-md-11");
      $("#logo-text").hide();
      $("#header").hide();
      $("#map").hide();
      $("#grid").hide();
      $(".leftmenu").hide();
    }

    this._openSidebar = function(){
      $("#left").removeClass("col-md-1").addClass("col-md-2");
      $("#middle").removeClass("col-md-11").addClass("col-md-10");
      $("#logo-text").show();
      $("#header").show();
      $("#map").show();
      $("#grid").show();
      $(".leftmenu").fadeIn();
    }

    this._renderArticleCardPreview = function(article){

      if (article["about"]["@type"] == "Person"){

        return nd._renderArticleCardPreviewPerson(article);

      }else if (article["about"]["@type"] == "Organization"){

        return nd._renderArticleCardPreviewOrganization(article);

      }else if (article["about"]["@type"] == "Place"){

        return nd._renderArticleCardPreviewPlace(article);

      }

    }

    this._renderArticleCardPreviewPerson = function(article){

      var container = $("<div/>").addClass("card col-xs-2");

      var profileimg = $("<div/>").addClass("profileimage");
      this._setProfileImageUrlPerson(article,profileimg);

      var profileexcerpt = $("<div/>").addClass("profileexcerpt");
      profileexcerpt.append("<b>" + article["about"]["name"] + "</b>");

      if (article["about"]["memberOf"][0])
        profileexcerpt.append($("<div/>").addClass("organisation").html(article["about"]["memberOf"][0]["name"]));

      if (article["about"]["address"][0])
        profileexcerpt.append($("<div/>").addClass("city").html(article["about"]["address"][0]["city"] + ", " + article["about"]["address"][0]["country"]).get(0));

      container.append(profileimg);
      container.append(profileexcerpt);
      return container.get(0).outerHTML;

    }

    this._renderArticleCardPreviewOrganization = function(article){

      var container = $("<div/>").addClass("card col-xs-2");

      var profileimg = $("<div/>").addClass("profileimage");
      this._setProfileImageUrlOrganization(article,profileimg);

      var profileexcerpt = $("<div/>").addClass("profileexcerpt");
      profileexcerpt.append("<b>" + article["about"]["name"] + "</b>");

      if (article["about"]["address"][0])
        profileexcerpt.append($("<div/>").addClass("city").html(article["about"]["address"][0]["city"] + ", " + article["about"]["address"][0]["country"]).get(0));

      container.append(profileimg);
      container.append(profileexcerpt);
      return container.get(0).outerHTML;

    }

    this._renderArticleCardPreviewPlace = function(article){

      var container = $("<div/>").addClass("card col-xs-2");

      var profileimg = $("<div/>").addClass("profileimage");
      this._setProfileImageUrlPlace(article,profileimg);

      var profileexcerpt = $("<div/>").addClass("profileexcerpt");
      profileexcerpt.append("<b>" + article["about"]["name"] + "</b>");

      if (article["about"]["address"][0])
        profileexcerpt.append($("<div/>").addClass("city").html(article["about"]["address"][0]["city"] + ", " + article["about"]["address"][0]["country"]).get(0));

      container.append(profileimg);
      container.append(profileexcerpt);
      return container.get(0).outerHTML;

    }

    this._showArticleDetails = function(article){

       $('#article-card').modal('show');

       if (article["about"]["@type"] == "Person"){

         return nd._renderArticleCardDetailsPerson(article);

       }else if (article["about"]["@type"] == "Organization"){

         return nd._renderArticleCardDetailsOrganization(article);

       }else if (article["about"]["@type"] == "Place"){

         return nd._renderArticleCardDetailsPlace(article);

       }

    }

    // Generates the HTML content of the card representation of the articles on the grid
    this._renderArticleCardDetailsPerson = function(article){

      $("#article-card-left").empty();
      $("#article-card-right").empty();

      var profileimg = $("<div/>").addClass("profileimage");
      $("#article-card-left").append(profileimg);
      this._setProfileImageUrlPerson(article,profileimg);

      $("#article-card-left").append('<h2 id="article-card-name">'+article["about"]["name"]+'</h2>');
      if (article["about"]["memberOf"][0])
        $("#article-card-left").append($("<div/>").addClass("organisation").html(article["about"]["memberOf"][0]["name"]));
      $("#article-card-left").append('<p id="article-card-location">'+article["about"]["address"][0]["city"]+", "+article["about"]["address"][0]["country"]+'</p>');

      // EMAIL
      var email = nd._getValueForKey(article["about"]["contactPoint"],"Email");
      if (email){
       $("#article-card-left").append($("<div/>").addClass("email contact-point").html('</br><a href="' + "mailto:" + email + '"><i class="fa fa-envelope fa-lg"></i></a>'));
      }

      // WEBSITE
      if (article["about"]["website"]){
        $("#article-card-left").append($("<div/>").addClass("website contact-point").html('<a href="' + article["about"]["website"] + '" target="_blank"><i class="fa fa-globe fa-lg"></i></a>'));
      }

      // TWITTER
      var twitter = nd._getValueForKey(article["about"]["contactPoint"],"Twitter");
      if (twitter){
        $("#article-card-left").append($("<div/>").addClass("twitter contact-point").html('<a href="https://www.twitter.com/' + nd._cleanTwitterHandle(twitter) + '" target="_blank"><i class="fa fa-twitter fa-lg"></i></a>'));
      }

      // FACEBOOK
      var facebook = nd._getValueForKey(article["about"]["contactPoint"],"Facebook");
      if (facebook){
        $("#article-card-left").append($("<div/>").addClass("facebook contact-point").html('<a href="' + facebook + '" target="_blank"><i class="fa fa-facebook fa-lg"></i></a>'));
      }

      // LINKEDIN
      var linkedin = nd._getValueForKey(article["about"]["contactPoint"],"Linkedin");
      if (linkedin){
        $("#article-card-left").append($("<div/>").addClass("linkedin contact-point").html('<a href="' + linkedin + '" target="_blank"><i class="fa fa-linkedin fa-lg"></i></a>'));
      }

      // GITHUB
      var github = nd._getValueForKey(article["about"]["contactPoint"],"Github");
      if (github){
        $("#article-card-left").append($("<div/>").addClass("github contact-point").html('<a href="' + github + '" target="_blank"><i class="fa fa-github fa-lg"></i></a>'));
      }

      // Description
      $("#article-card-right").append("<h2>About "+article["about"]["name"]+"</h2>");
      $("#article-card-right").append('<p id="article-card-description">'+article["about"]["description"]+'</p>');

      // Interests
      $("#article-card-right").append("<h2>Areas of interest</h2>");
      if (article["about"]["interest"]){
        var skills = $("<div/>").addClass("skill-list");
        skills.append($("<ul/>"));
        for (key in article["about"]["interest"]){
            skills.append('<li>'+article["about"]["interest"][key]["name"]+'</li>');
        }
        $("#article-card-right").append(skills);
      }

      $("#profile-published-uri").html("<p>PLP Profile stored under: <b></br>"+article["about"]["@id"]+"</b></p>");
    }

    // Generates the HTML content of the card representation of the articles on the grid
    this._renderArticleCardDetailsOrganization = function(article){

      $("#article-card-left").empty();
      $("#article-card-right").empty();

      var profileimg = $("<div/>").addClass("profileimage");
      $("#article-card-left").append(profileimg);
      this._setProfileImageUrlOrganization(article,profileimg);

      $("#article-card-left").append('<h2 id="article-card-name">'+article["about"]["name"]+'</h2>');
      $("#article-card-left").append('<p id="article-card-location">'+article["about"]["address"][0]["city"]+", "+article["about"]["address"][0]["country"]+'</p>');

      // EMAIL
      var email = nd._getValueForKey(article["about"]["contactPoint"],"Email");
      if (email){
       $("#article-card-left").append($("<div/>").addClass("email contact-point").html('</br><a href="' + "mailto:" + email + '"><i class="fa fa-envelope fa-lg"></i></a>'));
      }

      // WEBSITE
      if (article["about"]["website"]){
        $("#article-card-left").append($("<div/>").addClass("website contact-point").html('<a href="' + article["about"]["website"] + '" target="_blank"><i class="fa fa-globe fa-lg"></i></a>'));
      }

      // TWITTER
      var twitter = nd._getValueForKey(article["about"]["contactPoint"],"Twitter");
      if (twitter){
        $("#article-card-left").append($("<div/>").addClass("twitter contact-point").html('<a href="https://www.twitter.com/' + nd._cleanTwitterHandle(twitter) + '" target="_blank"><i class="fa fa-twitter fa-lg"></i></a>'));
      }

      // FACEBOOK
      var facebook = nd._getValueForKey(article["about"]["contactPoint"],"Facebook");
      if (facebook){
        $("#article-card-left").append($("<div/>").addClass("facebook contact-point").html('<a href="' + facebook + '" target="_blank"><i class="fa fa-facebook fa-lg"></i></a>'));
      }

      // LINKEDIN
      var linkedin = nd._getValueForKey(article["about"]["contactPoint"],"Linkedin");
      if (linkedin){
        $("#article-card-left").append($("<div/>").addClass("linkedin contact-point").html('<a href="' + linkedin + '" target="_blank"><i class="fa fa-linkedin fa-lg"></i></a>'));
      }

      // GITHUB
      var github = nd._getValueForKey(article["about"]["contactPoint"],"Github");
      if (github){
        $("#article-card-left").append($("<div/>").addClass("github contact-point").html('<a href="' + github + '" target="_blank"><i class="fa fa-github fa-lg"></i></a>'));
      }

      // Description
      $("#article-card-right").append("<h2>About "+article["about"]["name"]+"</h2>");
      $("#article-card-right").append('<p id="article-card-description">'+article["about"]["description"]+'</p>');

      // Interests
      $("#article-card-right").append("<h2>Areas of interest</h2>");
      if (article["about"]["interest"]){
        var skills = $("<div/>").addClass("skill-list");
        skills.append($("<ul/>"));
        for (key in article["about"]["interest"]){
            skills.append('<li>'+article["about"]["interest"][key]["name"]+'</li>');
        }
        $("#article-card-right").append(skills);
      }

      $("#profile-published-uri").html("<p>PLP Profile stored under: <b></br>"+article["about"]["@id"]+"</b></p>");
    }

    // Generates the HTML content of the card representation of the articles on the grid
    this._renderArticleCardDetailsPlace = function(article){

      $("#article-card-left").empty();
      $("#article-card-right").empty();

      var profileimg = $("<div/>").addClass("profileimage");
      $("#article-card-left").append(profileimg);
      this._setProfileImageUrlPlace(article,profileimg);

      $("#article-card-left").append('<h2 id="article-card-name">'+article["about"]["name"]+'</h2>');
      $("#article-card-left").append('<p id="article-card-location">'+article["about"]["address"][0]["city"]+", "+article["about"]["address"][0]["country"]+'</p>');

      // Description
      $("#article-card-right").append("<h2>About "+article["about"]["name"]+"</h2>");
      $("#article-card-right").append('<p id="article-card-description">'+article["about"]["description"]+'</p>');

      $("#profile-published-uri").html("<p>PLP Profile stored under: <b></br>"+article["about"]["@id"]+"</b></p>");
    }

    this._isActiveFilter = function(d,e){
        var i = this.activeFilters[d].indexOf(e);
        return i > -1;
    };

    // TODO Optimize this function, use Array.filter/reduce
    // Or create a hashmap of ids and their index in the array on init
    this._findArticleById = function(id){
        return articles[id];
    };

    // Gets the list of titles from the articles
    this._buildSearchFilterArray = function(){

      //Define metadata Object, containing an array of titles for the autocompletion
      var articleSearchFilter = new Object;
      articleSearchFilter.articleTitles = [];

      // Skills
      var aa_tags = this._aaReduce(this.cf.aar_dimension.groupAll().reduce(reduceAdd, reduceRemove, reduceInitial).value());
      $.each(aa_tags, function( index, value ) {
        articleSearchFilter[value["key"]] = new Object;
        articleSearchFilter[value["key"]].filter = "aa";
        articleSearchFilter[value["key"]].id = value["key"];
        articleSearchFilter.articleTitles.push(value["key"]);
      });

      // Country
      var dd_tags = this._removeEmptyKeys(this.cf.dd_dimension.group().all(), "dd");
      $.each(dd_tags, function( index, value ) {
        articleSearchFilter[value["key"]] = new Object;
        articleSearchFilter[value["key"]].filter = "dd";
        articleSearchFilter[value["key"]].id = value["key"];
        articleSearchFilter.articleTitles.push(value["key"]);
      });

      // City
      var ee_tags = this._removeEmptyKeys(this.cf.ee_dimension.group().all(), "ee");
      $.each(ee_tags, function( index, value ) {
        articleSearchFilter[value["key"]] = new Object;
        articleSearchFilter[value["key"]].filter = "ee";
        articleSearchFilter[value["key"]].id = value["key"];
        articleSearchFilter.articleTitles.push(value["key"]);
      });

      // organisation
      var ff_tags = this._removeEmptyKeys(this.cf.ff_dimension.group().all(), "ff");
      $.each(ff_tags, function( index, value ) {
        articleSearchFilter[value["key"]] = new Object;
        articleSearchFilter[value["key"]].filter = "ff";
        articleSearchFilter[value["key"]].id = value["key"];
        articleSearchFilter.articleTitles.push(value["key"]);
      });

      // add to search filter
      $.each(id_tags, function( index, value ) {
        var a = nd._findArticleById(value["key"]);
        var name = a["about"]["name"];
        articleSearchFilter[name] = new Object;
        articleSearchFilter[name].filter = "id";
        articleSearchFilter[name].id = name;
        articleSearchFilter.articleTitles.push(name);
      });

      return articleSearchFilter;

    };

    // This function does two things:
    //  1. Removes keys if their values are 0
    //  2. Removes all the keys but one if a filter is
    //     selected on ff, dd or id
    this._removeEmptyKeys = function(d, dim){
        if(dim === "aa"){
            var a = [];
            for(var i in d) if(d[i].value !== 0) a.push(d[i]);
            return a;
        }

        var f = this.activeFilters[dim];
        if(f.length === 0){
            var a = [];
            for(var i in d) if(d[i].value !== 0) a.push(d[i]);
            return a;
        }else{
            var a = [];
            for(var i  in d) if(f.indexOf(d[i].key) > -1) a.push(d[i]);
            return a;
        }
    };


    // The value we get for ... is in a different
    // format. This function makes it the same
    this._aaReduce = function(d){
        var a = [];
        for(var i in d) a.push({"key": i, "value": d[i]});
        return a;
    };

    this._setProfileImageUrlPerson = function(article,profile_image_holder){

      pathToImage = "res/img/Person.png"
      profile_image_holder.append("<img src=\""+pathToImage+"\"></img>")

      if (article["about"]["image"]){

        pathToImage = article["about"]["image"];
        profile_image_holder.html("<img src=\""+pathToImage+"\"></img>")

      }else if (!article["about"]["image"] && nd._getValueForKey(article["about"]["contactPoint"],"Twitter")){

        nd._getTwitterProfileImageUrl(article,profile_image_holder);

      }

    }

    this._setProfileImageUrlOrganization = function(article,profile_image_holder){

      pathToImage = "res/img/Organization.png"
      profile_image_holder.append("<img src=\""+pathToImage+"\"></img>")

      if (article["about"]["logo"]){

        pathToImage = article["about"]["logo"];
        profile_image_holder.html("<img src=\""+pathToImage+"\"></img>")

      }else if (!article["about"]["logo"] && nd._getValueForKey(article["about"]["contactPoint"],"Twitter")){

        nd._getTwitterProfileImageUrl(article,profile_image_holder);

      }

    }

    this._setProfileImageUrlPlace = function(article,profile_image_holder){

      pathToImage = "res/img/Place.png"
      profile_image_holder.append("<img src=\""+pathToImage+"\"></img>")

      if (article["about"]["image"]){

        pathToImage = article["about"]["image"];
        profile_image_holder.html("<img src=\""+pathToImage+"\"></img>")

      }else if (!article["about"]["image"] && nd._getValueForKey(article["about"]["contactPoint"],"Twitter")){

        nd._getTwitterProfileImageUrl(article,profile_image_holder);

      }

    }

    this._getTwitterProfileImageUrl = function(article,profile_image_holder){

      var twitterHandle = nd._getValueForKey(article["about"]["contactPoint"],"Twitter")
      twitterHandle = nd._cleanTwitterHandle(twitterHandle);

      $.get( "http://directory.open-steps.org/ext/twitter/twitter_profile_retriever.php?screen_name="+twitterHandle, function( data ) {
        data = data.replace("\n","");
        profile_image_holder.html("<img src=\""+data+"\"></img>")
      });

    };

    this._cleanTwitterHandle= function(twitterHandle){

      twitterHandle = twitterHandle.replace( "@", "" );
      twitterHandle = twitterHandle.replace( "http://www.twitter.com/", "" );
      twitterHandle = twitterHandle.replace( "https://www.twitter.com/", "" );
      twitterHandle = twitterHandle.replace( "https://twitter.com/", "" );
      twitterHandle = twitterHandle.replace( "http://twitter.com/", "" );
      twitterHandle = twitterHandle.replace( "twitter.com/", "" );

      return twitterHandle;

    }

    this._getFacebookProfileUrl = function(username){

      console.log('_getFacebookProfileUrl');

    };

    this._getValueForKey = function(element,value){
      for (key in element){
        if (element[key]["type"] == value)
          return element[key]["id"];
      }
    }

};


/*------------------------------
Reduce functions for the arrays
of AA.
------------------------------*/
function reduceAdd(p, v) {
  if (!v["about"]["interest"]) return p;
  v["about"]["interest"].forEach (function(val, idx) {
     p[val["name"]] = (p[val["name"]] || 0) + 1; //increment counts
  });
  return p;
}

function reduceRemove(p, v) {
  if (!v["about"]["interest"]) return p;
  v["about"]["interest"].forEach (function(val, idx) {
     p[val["name"]] = (p[val["name"]] || 0) - 1; //decrement counts
  });
  return p;

}

function reduceInitial() {
  return {};
}
