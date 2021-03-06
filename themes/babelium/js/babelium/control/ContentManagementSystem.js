
/* ============================================================
 * BABELIUM's CONTENT MANAGEMENT SYSTEM
 * ==========================================================*/

BP.CMS = (function()
{
	// Private interface
	var _usernav;
	var _mainnav;
	var _searchnav;
	var _maincontent;
	var _loader;
	
	// CMS state	
	var _initiated = false;
	var _loading = false;
	
	/**
	 * Setup Babelium's CMS
	 */
	function _setup()
	{
		if ( _initiated )
			return;
		
		_usernav = $("#usernav");
		_mainnav = $("#mainnav");
		_searchnav = $("#searchnav");
		_maincontent = $("section#maincontent");
		_loader = $("aside#loader > div");
		
		_initNavigationLinks();
		_initLocalebox();
		_initViewStacks();
		_initDataTables();
		_initPaginations();
		
		if ( BP.SM.at("home") && !BP.SM.action("activity") )
			_initRatings(); // Only needed at home, datatables and paginators loads ratings itselfs
		if ( (BP.SM.at("practice") && BP.SM.action("view")) || (BP.SM.at("evaluate") && BP.SM.params() != null) )
			_rating(".ratyPreview", true);
		
		_initiated = true;
	}
	
	/**
	 * Init hover action in navitation links
	 */
	function _initNavigationLinks()
	{
		_mainnav.find("ul > li > a").not(":last").hover(function()
		{
			$(this).parent().css("background", "url(themes/babelium/images/separator.png) no-repeat center right," +
					" url(themes/babelium/images/button_nav_highlight_" +
					$(this).attr('class') + ".png) no-repeat 50% 58%");
		}, function()
		{
			$(this).parent().css("background","url(themes/babelium/images/separator.png) no-repeat center right");
		});
		
		_mainnav.find("ul > li > a:last").hover(function()
		{
			$(this).parent().css("background", " url(themes/babelium/images/button_nav_highlight_" +
					$(this).attr('class') + ".png) no-repeat 50% 58%");
		}, function()
		{
			$(this).parent().css("background","none");
		});
	}
	
	/**
	 * Locale Box
	 */
	function _initLocalebox()
	{
		// Hide <select>
		var select = $("select#localebox").css("display", "none");
		
		// Add a div in its place
		select.parent().append("<div class='localebox'></div>");
		var localeBox = $(".localebox");
		
		// Containing 2 divs
		localeBox.append("<div class='selectBox'></div>");
		localeBox.append("<ul class='dropDown'></ul>");
		
		var selectBox = $(".selectBox");
		var dropDown = $(".dropDown").hide();
		
		// Add options to localebox
		select.find("option").each(function (index)
		{
			var option = $(this);
			var text = $(this).text();
			var flag = $(this).data("icon");
			var content = "<img src='" + flag + "' width='16' height='16' align='left' hspace='3' vspace='3' "
							+ "alt='" + text + "' />" + text;
			var arrow = "<img src='themes/babelium/images/arrow-down.png'"
							+ "alignt='left' style='float:right; margin-right: 3px;' />";

			// Is is checked as default initialize localebox
			if ( $(this).is(":selected") )
				selectBox.html(content+arrow);
			
			// Add option
			var li = $('<li>',{html: content});
			dropDown.append(li);
			
			// Trigger action on click the option
			li.click(function()
			{
				selectBox.html($(this).html()+arrow);
				dropDown.slideUp();
				select.val(option.val());
				select.change();
			});
		});
		
		// Show/hide dropDown
		selectBox.click(function()
		{
			dropDown.slideToggle();
		});
	
		// Hide dropdown
		$(document).click(function()
		{
			if ( dropDown.is(':animated') )
				return false;
			
			dropDown.slideUp();
		});
	}
	
	/**
	 * Init navigation navs widgets
	 */
	function _initViewStacks()
	{
		/** Init navigation Menus **/
		if ( BP.SM.at("home") && !BP.SM.action() )
			_viewStack("#motdmessageshelper", "#motdmessages");
		else if ( BP.SM.at("evaluate") && BP.SM.action("touser") && BP.SM.params() != null )
			_viewStack("#evaluationUserNames", "#userEvaluationsContainer");
	}
	
	/**
	 * Init data tables
	 */
	function _initDataTables()
	{
		/** Home user recent activity data tables **/
		if ( BP.SM.at("home") && BP.SM.action("activity") )
		{
			_dataTable("#assesmentsReceived");
			_dataTable("#assesmentsGiven");
		}
	}
	
	/**
	 * Init pagination widgets
	 */
	function _initPaginations()
	{
		/** Exercises **/
		if ( BP.SM.at("practice") )
		{
			_pagination("section.exerciseList", ".exerciseContainer", ".exercise",
					{title: ".exerciseTitle", description: "p.exerciseDescription"});
		}
		else if ( BP.SM.at("evaluate") )
		{
			_pagination("section.evaluationItemList", ".assesmentsContainer", ".evaluationItem",
					{title: ".evaluationTitle", description: ".evaluationTitle"});
		}
	}
	
	/**
	 * Init ratings widgets
	 */
	function _initRatings()
	{
		_rating(".raty");
	}
	
	/**
	 * Create a 5 star rate widget
	 * @param c: class or id
	 */
	function _rating(c, s)
	{
		if ( s == true )
		{
			$(c).each(function ()
			{
				var _this = this;
				$(_this).raty({
					path: "themes/babelium/images/raty",
					readOnly: $(_this).data("readonly"),
					half: true,
					start: $(_this).data("rating")/2,
					size:      24,
					starHalf:  "star-half-big.png",
					starOff:   "star-off-big.png",
					starOn:    "star-on-big.png"
				});
			});
		}
		else
		{
			$(c).each(function ()
			{
				var _this = this;
				$(_this).raty({
					path: "themes/babelium/images/raty",
					readOnly: $(_this).data("readonly"),
					half: true,
					start: $(_this).data("rating")/2
				});
			});
		}
	}
	
	/**
	 * Create a JQuery DataTable
	 * @param v: table id
	 */
	function _dataTable( t )
	{
		var dtable = $(t).dataTable({"bJQueryUI": true,"sPaginationType": "full_numbers"});
		
		// If table has rating widgets, redraw them
		_rating($(dtable.fnGetNodes()).find(".raty"));
	}
	
	/**
	 * Create a JQuery pagination
	 * @param container: main container
	 * @param wrapper: layer containing paginated items
	 * @param items: items to paginate
	 * @param f: json object
	 * @param itemspp: items per page (default 10)
	 */
	function _pagination( container, wrapper, items, f, itemspp )
	{
		if ( typeof itemspp == 'undefined' )
			itemspp = 10;
		
		$(container).jplist(
		{
			filter: f,
			filter_path: ".paginationFilter",
					
			pagingbox: ".paginationButtons",
			pageinfo: ".paginationInfo",
			paging_dd_path: ".paginationPage-by",
					
			items_box: wrapper,
			item_path: items,
			items_on_page: itemspp,
			
			redraw_callback: onRefreshPagination // enable rating widgets
		});
	}
	
	/**
	 * On Refresh pagination
	 */
	function onRefreshPagination()
	{
		_initRatings();
		
		/*var videoContainer = $("#exerciseVideoContainer");
		
		if ( videoContainer.length == 0 )
			return;
		
		videoContainer.find("article").each(function ()
		{
			var _this = $(this);
			_this.click(function ()
			{
				new ExerciseEvent(ExerciseEvent.EXERCISE_SELECTED, 
						new ExerciseVO(_this.data("id"), _this.data("name"), _this.data("title"))
					).dispatch();
			});
		});*/
	}
	
	/**
	 * Create a view stack
	 * @param b: buttons parent layer
	 * @param v: views parent layer
	 */
	function _viewStack(b, v)
	{
		if ( $(b).length == 0 || $(v).length == 0 )
			return;
		
		/**
		 * Nav item
		 */
		var nav = (function ()
		{	
			var _index = 1;
			var _b = b;
			var _v = v;
			var _count = $(_b + " > *").length;
			
			// Hide all views
			$(_v + " > *").css("display", "none");
			// Show default
			$(_v + " > *:first-child").css("display", "block");
			
			// For each button
			$(b + " > *").each(function(index)
			{
				$(this).click(function()
				{
					_show(index+1);
				});
			});
			
			// Show index view
			function _show( newIndex )
			{					
				if ( newIndex < 1 || newIndex > _count )
					return;
				
				$(v + " > *:nth-child("+_index+")").fadeOut(500, function()
				{
					$( v + " > *:nth-child("+newIndex+")").fadeIn(500);
				});
				
				_index = newIndex;
			}
			
			// show next view
			function _showNext()
			{
				var nextIndex = _index+1;
				
				if ( nextIndex > _count )
					_show(1);
				else
					_show(nextIndex);
			}
			
			// show prev view
			function _showPrev()
			{
				var prevIndex = _index-1;
				
				if ( prevIndex > 1 )
					_show(_count);
				else
					_show(prevIndex);
			}
			
			return {
				next : function ()
				{
					_showNext();
				},
				
				prev : function ()
				{
					_showPrev();
				},
				
				show : function ( i )
				{
					_show(i);
				}
			};
		})();
		
		return nav;
	}
	
	
	// Public interface
	return {
		
		/**
		 * Inits Babelium's CMS
		 */
		init : function()
		{
			_setup();
		},
		
		/**
		 * Prepares main content for a new content insertion
		 * @param location : target module name, just for a loading message
		 * @param callback : callback function
		 */
		prepareMainContent : function ( location, callback, hideHeader )
		{
			if ( _loading || !_initiated )
				return;
			
			_loading = true;
			
			// Display loading message
			var motd = $("aside#motd");
			var header = _maincontent.find("header");
			
			// Loader div
			var top =  _maincontent.offset().top;
			_loader.css("top", top);
			_loader.find("p").html("Loading <strong>"+location+"</strong>");
			_loader.slideDown();
			
			// Animate scrolling 
			if ( $("html, body").scrollTop() > top )
				$("html, body").animate({scrollTop: top}, "slow");
			
			// Slide up current section and remove it on animation end
			if ( $("#maincontent > section").length > 0 )
			{
				// Hide motd if visible
				if ( motd.length > 0 && !hideHeader )
				{
					motd.fadeOut("fast", function(){motd.remove();});
					header.slideDown();
				}
				
				// We are loading home = motd messages instead usual header
				if ( hideHeader )
					header.slideUp();
				
				/**
				 * Hide content
				 * $.when used to avoid multiple callback when maincontent has
				 * more than 1 section
				 */ 
				$.when( $("#maincontent > section").fadeOut() ).done(function()
				{
					$("#maincontent > section").remove();
					
					if ( $("aside#tabBarContainer").length > 0 )
						$("aside#tabBarContainer").remove();
					
					// Call to callback funcion after animation finished
					callback();
				});
			}
			else
			{
				if ( $("aside#tabBarContainer").length > 0 )
					$("aside#tabBarContainer").remove();

				callback();
			}
				
		},
		
		/**
		 * Prepares exercise view for a new exercise insertion
		 * @param location : target module name, just for a loading message
		 * @param callback : callback function
		 */
		prepareExerciseView : function ( callback, title )
		{
			if ( _loading || !_initiated )
				return;
			
			_loading = true;
			
			if ( typeof title == "undefined" )
				title = "exercise";
			
			// Display loading message
			var top =  _maincontent.offset().top;
			_loader.css("top", top + _maincontent.find("header").outerHeight());
			_loader.find("p").text("Retrieving " + title + " information");
			_loader.slideDown();
			
			// Animate scrolling 
			$("html, body").animate({scrollTop: top}, "slow", function()
			{
				callback();
			});
		},
		
		/**
		 * Creates a view stack
		 * @param b: buttons layer (<ul> e.g.)
		 * @param v: views layer (<ul>, <section>, <article>)
		 */
		viewStack : function ( b, v )
		{
			if ( !_initiated )
				return;

			return _viewStack(b, v);
		},
		
		/**
		 * Reloads view stacks
		 */
		reloadViewStacks : function ()
		{
			if ( !_initiated )
				return;
			
			_initViewStacks();
		},
		
		/**
		 * Reloads data tables
		 */
		reloadDataTables : function ()
		{
			if ( !_initiated )
				return;

			_initDataTables();
		},
		
		/**
		 * Reloads paginations
		 */
		reloadPaginations : function ()
		{
			if ( !_initiated )
				return;

			_initPaginations();
		},
		
		/**
		 * Reloads ratings
		 */
		reloadRatings : function ()
		{
			if ( !_initiated )
				return;
			
			if ( BP.SM.at("home") && !BP.SM.action("activity") )
				_initRatings(); // Only needed at home, datatables and paginators loads ratings itselfs
			if ( (BP.SM.at("practice") && BP.SM.action("view")) || BP.SM.at("evaluate") )
				_rating(".ratyPreview", true);
		},

		/**
		 * Inner and display new content in main section
		 * @param data : JSON object with {title, content}
		 */
		innerMainContent : function ( data )
		{
			if ( !_loading )
				return;
			
			data = $.parseJSON(data);
			$("#maincontent > header > h1").text(data.title);
			var content = $(data.content).hide();
			content.appendTo("#maincontent").fadeIn();
			_loader.slideUp();
			
			// Reload views
			this.reloadViewStacks();
			this.reloadDataTables();
			this.reloadPaginations();
			this.reloadRatings();
			
			_loading = false;
		},
		
		/**
		 * Inner and display new exercise
		 * @param data : JSON object with {title, content}
		 */
		innerExerciseView : function ( data, evaluation )
		{
			if ( !_loading )
				return;
			
			var insertAfter = "", container = "";
			
			if ( typeof evaluation == "undefined" )
			{
				container = "section.exerciseInfo";
				insertAfter = "aside#loader";
			}
			else
			{
				container = "section.evaluationDetails";
				insertAfter = "aside#tabBarContainer";
			}
			
			var _this = this;
			
			data = $.parseJSON(data);
			var content = $(data.content).hide();
			
			// Slide up current exercise and remove it on animation end
			if ( $(container).length > 0 )
			{
				$(container).fadeOut("fast", function()
				{
					$(container).remove();
					content.insertAfter(insertAfter).fadeIn();
					_this.reloadRatings();
					_this.reloadViewStacks();
					_loader.slideUp();
				});
			}
			else
			{
				content.insertAfter(insertAfter).fadeIn();
				_this.reloadRatings();
				_this.reloadViewStacks();
				_loader.slideUp();
			}
			
			_loading = false;
		},
		
		/**
		 * Shows or hides login popup
		 */
		toggleLoginPopup : function ( )
		{
			if ( !_initiated )
				return;
			
			var popup = $("aside#popup");
			
			if ( popup.is(":visible") )
			{
				this.hideLoginPopup();
			}
			else
			{
				this.showLoginPopup();
			}
		},
		
		/**
		 * Hides login popup
		 */
		hideLoginPopup : function ( )
		{
			if ( !_initiated )
				return;

			var popup = $("aside#popup");
			
			popup.fadeOut("fast", function(){document.getElementById("loginForm").reset();});
		},
		
		/**
		 * Shows login popup
		 */
		showLoginPopup : function ()
		{
			if ( !_initiated )
				return;

			var popup = $("aside#popup");
			
			popup.fadeIn();
		},
		
		/**
		 * Abort content loading
		 */
		abortLoading : function ()
		{
			if ( _loading )
			{
				_loader.slideUp();
				_loading = false;
			}
		}
		
	};

})();
