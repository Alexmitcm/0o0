var gradle = { log: function(val){val && console.log( gradle.isMobile && (typeof val === 'object') ? JSON.stringify(val) : val );},
/**
	GRADLE - KNOWLEDGE IS POWER
	***** JACOB SERVICES LLC ***
    ***** PROPRIETARY CODE *****
    @author : gradle (jacob.services@outlook.com)
	@date: 01/26/2021 14:43:00
	@version: 7.0.0
	copyright @2021
*/
	isTesting: true,

	intervalAds    : 3,     //Ads each interval for example each 3 times
    
	fullsize		   : true,

	
	//Languages :
	//===========
	translate :{
		en :{
			'lang'	 : 'Language',
			'easy'   : 'EASY',
			'normal' : 'NORMAL',
			'expert' : 'EXPERT',
			'time'   : 'Time',
			'cells'  : 'Cells',
			'edit'   : 'EDIT',
		},
		fr :{
			'lang'	 : 'Langue',
			'easy'   : 'FACILE',
			'normal' : 'NORMALE',
			'expert' : 'EXPERT',
			'time'   : 'Temps',
			'cells'  : 'Cells',
			'edit'   : 'EDITER',
		},
		es :{
			'lang'	 : 'Idioma',
			'easy'   : 'FÁCIL',
			'normal' : 'NORMAL',
			'expert' : 'EXPERTO',
			'time'   : 'Tiempo',
			'cells'  : 'Células',
			'edit'   : 'EDITAR',
		},
	},
	

	
	//Events manager :
	//================
    event: function(ev, msg){
		if(gradle.process(ev,msg))
        switch(ev){

		case 'first_start':   //First start
			//gradle.showInter();
			break;

		case 'button_play':   //button play
			gradle.showInter();
			break;
		case 'replay': //event on replay
			//gradle.showInter();
			break;
		case 'congratulations': // end of level - Gameover / Congratulations
			gradle.showInter();
			break;
		case 'sound_yes': //event on button sound
			//gradle.showInter();
			break;
		case 'sound_no': //event on button sound
			//gradle.showInter();
			break;
		
		case 'test':
			//gradle.checkInterval() && gradle.showInter();
			break;
		
        }
    },





    //Ready : /!\ DO NOT CHANGE, ONLY IF YOU ARE AN EXPERT.
    //=========================
	start: function(){
		gradle.get_lang();
		try{
			snd_track.play();
		}
		catch(err){}
		//setTimeout(function(){sizeHandler();gradle.event_ext('hide_splash');}, 600);
    },
	pause: function(){
		console.log('gradle pause ...');
		try{
			snd_track.pause();
		}
		catch(err){}
		game.status=0;
    },
	resume: function(){
		console.log('gradle resume ...');
		try{
			snd_track.play();
		}
		catch(err){}
		game.status=1;
    },

    run: function() {
        gradle.event('first_start');
		gradle.isMobile = ( /(ipad|iphone|ipod|android|windows phone)/i.test(navigator.userAgent) );
        document.addEventListener("visibilitychange", gradle.onVisibilityChanged, false);
		gradle.start();
    },

	lang: 'en',
	text: function(val, ret){
		gradle.get_lang();
		result = gradle.translate[gradle.lang][''+val];
		if(ret==true){
			return result;
		}
		else{
			document.write(result);
		}
	},
	
	get_default_lang : function(){
		var lang = (navigator.language || navigator.userLanguage).split('-')[0];
		for(var i in gradle.translate){
			if(i==lang){
				return lang;
			}
		}
		return 'en';
	},
	
	get_lang: function(){
		gradle.lang = gradle.getStorage('lang', gradle.get_default_lang() );
		console.log(gradle.lang);
	},
	
	set_lang: function(lang){
		console.log(lang);
		gradle.setStorage('lang',lang);
		location.href = './index.html';
	},
	





	mute: false,
    event_ext: function(val){
		if(this.isMobile && typeof jacob!='undefined'){
			jacob.do_event(val);
		}
	},

	old_ev: null,
    process: function(ev, msg){
		if(gradle.old_ev ==ev){
			if(ev=='button_share' || ev=='button_play'){
				console.log('repeat');
				//return false;
			}
		}
        if(ev=='state_game_create'){
			null != game && (game.sound.mute = !1, game.paused = !1);
			//this.triggerEvent(document.getElementById('game'), 'click');
		}
		switch(ev){
            case 'btn_more':
                gradle.event_ext('show_more');
                break;
            case 'btn_privacy':
                gradle.event_ext('show_privacy');
                break;
            case 'btn_share':
                gradle.event_ext('show_share');
                break;
            case 'btn_profile':
                gradle.event_ext('show_profile');
                break;
            case 'btn_exit_game':
                gradle.event_ext('exit_game');
                break;
        }
		gradle.old_ev = ev;
		gradle.log(ev,msg);
		return true;
    },

    showInter: function(){
        if(!gradle.isMobile) return;
        gradle.log('jacob|show_inter');
    },
	
	score : 0,
    save_score(score, level){
        gradle.event_ext('save_score|'+score+'|'+level);
    },

	onVisibilityChanged : function(){
	    if (document.hidden || document.mozHidden || document.webkitHidden || document.msHidden){
			gradle.pause();
		}else{
			gradle.resume();
		}
	},

	currentInterval : 0,
	checkInterval: function(){
		return (++gradle.currentInterval==gradle.intervalAds) ? !(gradle.currentInterval=0) : !1;
	},
	
	
	buildKey : function(key){
		return "gd.4024."+key;
	},

	getStorage: function(key, default_value){
		var value;
		try {
			value = localStorage.getItem(gradle.buildKey(key));
		}
		catch(error){
			return default_value;
		}
		if(value !== undefined && value !=null){
			value = window.atob(value);
		}
		else{
			value = default_value;
		}
		return value;
	},

	setStorage: function(key, value){
		var v = value;
		if(v !== undefined){
			v = window.btoa(v);
		}
		try{
			localStorage.setItem(gradle.buildKey(key), v);
			return value;
		}
		catch(error){
			return undefined;
		}
	}
};

gradle.run();
