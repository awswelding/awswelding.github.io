/*
Author: Saad Amin
Website: http://www.saadamin.com
*/
jQuery(window).load(function () {
    function s() {
        jQuery("div.result_div").width() < 700
            ? (jQuery(".std_input").css({ "max-width": "100%", width: "100%", "margin-right": "auto" }),
              jQuery("div.result_box div.sep").css({ padding: "0 20px", "margin-bottom": "10px" }),
              jQuery(".std_title").css({ "margin-left": "auto" }))
            : (jQuery(".std_input").css({ "max-width": "60%", "margin-right": "20px", "max-width": "350px" }),
              jQuery("div.result_box div.sep").css({ padding: "auto", "margin-bottom": "auto" }),
              jQuery(".std_title").css({ "margin-left": "20px" }));
    }
    var r;
    jQuery(window).resize(s),
        s(),
        jQuery("#rues").css({ opacity: 1 }),
        jQuery("#rues").keypress(function () {
            console.log("key pressed"),
                jQuery("#ssr_msgbox").css("display", "none"),
                jQuery("#ssr_frnt_circle").css("display", "block"),
                jQuery(".result_box").css({ opacity: 1 }),
                r && clearTimeout(r),
                (r = setTimeout(function () {
                    jQuery("#ssr_r_f_1").show(),
                        jQuery("#ssr_r_f_2").show(),
                        jQuery("#ssr_r_f_2").show(),
                        jQuery("#ssr_r_f_3").show(),
                        jQuery("#ssr_r_f_4").show(),
                        jQuery("#ssr_r_f_5").show(),
                        jQuery("#ssr_r_f_6").show(),
                        jQuery("#ssr_r_f_7").show(),
                        jQuery("#ssr_r_f_8").show(),
                        jQuery("#ssr_r_f_9").show(),
                        jQuery("#ssr_r_f_10").show(),
                        jQuery("#ssr_r_f_11").show(),
                        jQuery("#ssr_r_f_12").show(),
                        jQuery("#ssr_r_f_13").show(),
                        console.log("started" + jQuery("#rues").val().length);
                        if(jQuery("#rues").val().length > 0){
							
				jQuery.ajax({
					url: SSR_Ajax.root + "v2/ssr_find_all",
					method: "POST",
					data: {postID: jQuery.trim(jQuery("#rues").val())},
					success: function (s) {
						if (s.success==true){
							console.log(s);
							jQuery("#rid2").val(s[0].rid);
							jQuery("#rn2").val(s[0].roll);
							jQuery("#stn2").val(s[0].stdname);
							jQuery("#stfn2").val(s[0].fathersname);
							jQuery("#stpy2").val(s[0].pyear);
							jQuery("#stcgpa2").val(s[0].cgpa);
							jQuery("#stsub2").val(s[0].subject);
							jQuery("#stsub3").val(s[0].dob);
							jQuery("#stsub4").val(s[0].gender);
							jQuery("#stsub5").val(s[0].address);
							jQuery("#stsub6").val(s[0].mnam);
							jQuery("#stsub7").val(s[0].c1);
							jQuery("#stsub8").val(s[0].c2);
						  jQuery("#st_img2").length && (jQuery("#st_img2").attr("src", s[0].image), jQuery("#st_img2").attr("src").length < 1 && jQuery("#st_img2").hide()),
						  jQuery("#stsub8").val().length < 1 && jQuery("#ssr_r_f_13").hide(),
						  jQuery("#stsub7").val().length < 1 && jQuery("#ssr_r_f_12").hide(),
						  jQuery("#stsub6").val().length < 1 && jQuery("#ssr_r_f_11").hide(),
						  jQuery("#stsub5").val().length < 1 && jQuery("#ssr_r_f_10").hide(),
						  jQuery("#stsub4").val().length < 1 && jQuery("#ssr_r_f_9").hide(),
						  jQuery("#stsub3").val().length < 1 && jQuery("#ssr_r_f_8").hide(),
						  jQuery("#stsub2").val().length < 1 && jQuery("#ssr_r_f_7").hide(),
						  jQuery("#stcgpa2").val().length < 1 && jQuery("#ssr_r_f_6").hide(),
						  jQuery("#stpy2").val().length < 1 && jQuery("#ssr_r_f_5").hide(),
						  jQuery("#stfn2").val().length < 1 && jQuery("#ssr_r_f_4").hide(),
						  jQuery("#stn2").val().length < 1 && jQuery("#ssr_r_f_3").hide(),
						  jQuery("#rn2").val().length < 1 && jQuery("#ssr_r_f_2").hide(),
						  jQuery("#ssr_frnt_circle").css("display", "none"),
						  jQuery(".result_box").css({ opacity: 1 }),
						  jQuery("#ssr_msgbox").css("display", "none");
						} else {
							 console.log("not found"), jQuery(".result_box").css({ opacity: 0 }), jQuery("#ssr_msgbox").css("display", "block"), jQuery("#ssr_frnt_circle").css("display", "none");
						}
					}
					})
				}else{
					console.log("empty"), jQuery(".result_box").css({ opacity: 0 }), jQuery("#ssr_msgbox").css("display", "none"), jQuery("#ssr_frnt_circle").css("display", "none");
				}
                }, 1e3));
        }),
        jQuery("#rues").keydown(function (s) {
            return 32 != s.keyCode && void 0;
        });
});
