/**
 * jquery.SelectAutoChange v1.57
 * 25 Jun 2015
 *
 * 使之支持对三个下拉框赋不同的初始值
 * 更新使用方法(05 Jun 2015 v1.56)
 * 下拉框三级联动(15 Mar 2015 v1.55)
 * 基于https://github.com/jasonslyvia/china-city-select
 * 增加 select>option 的默认值( value 为 -1 ) 
 * 增加对2级联动的支持
 * 增加只有1级时隐藏其余联动
 * 增加对低版本IE的支持 (23 Oct 2014)
 * 修复不影响正常功能的脚本错误
 * 新增 hideState
 *
 * By JohnnyWong
 *
 */

/*使用方法
    SelectList.mf_init({
      country: 'selCountry',                                           //一级 select 的 ID
      state: 'selState',                                               //二级 select 的 ID
      city: 'selCity',                                                 //三级 select 的 ID (可选,如为两级联动,则不需要该属性)
      hideState: 'true',                                               //是否隐藏只有一个子分类的二级分类(可选,默认为隐藏)
      defaultValue: ['---请选择---', '---请选择---', '---请选择---'],        //每个select的第一个option的值(可选,如为二级联动,则可以只写两个)
      current: '31|01|07',                                             //初始化时3个select的默认值，使用region code及 | 区分，如 '31|01|07' ，具体请查阅相对应的 xml 数据文件
      language: 'zh_cn',                                               //语言版本
      path_to_xml: 'data/china/',                                      //xml文件所在的文件夹
      read_only: false  
    });
*/


var Util_List = {
	mf_add : function(lo_ListObj, ld_Text, ld_Value) {
		var lo_Option = document.createElement("option");
		lo_Option.appendChild(document.createTextNode(ld_Text));
		lo_Option.setAttribute("value", ld_Value);
		if(lo_ListObj != null){
			lo_ListObj.appendChild(lo_Option);
		}
	},
	mf_clear : function(lo_ListObj, defaultValue) {
		if(lo_ListObj != null){
			for (var ld_i = lo_ListObj.options.length - 1; ld_i >= 0; ld_i--) {
				try {
					lo_ListObj.remove(ld_i);
				} catch (e) {
				}
			}
			this.mf_add(lo_ListObj, defaultValue, '-1');
		}
	},
	mf_select : function(lo_ListObj, ld_Value) {
		var ld_i = 0;
		if(lo_ListObj != null){
			for (; ld_i < lo_ListObj.options.length; ld_i++) {
				if (lo_ListObj.options[ld_i].value == ld_Value) {
					break;
				};
			}
			if (ld_i >= lo_ListObj.options.length) {
				return false;
			}
			try { // An error message will be show under IE6, but it still work, so we wrap it with try...catch
				lo_ListObj.options[ld_i].selected = true;
			} catch (e) {

			}
			lo_ListObj.selectedIndex = ld_i;
			lo_ListObj.value = ld_Value;
			return true;
		}
	},
	mf_isempty : function(lo_ListObj) {
		if ((lo_ListObj.options.length > 0) && (lo_ListObj.value == "")) {
			return true;
		} else {
			return false;
		}
	}
};

/*
 * @desc	AJAX Object
 */
var XmlHttp = {
	mf_createxmlhttp : function() {
		var lo_http_request = false;
		if (window.ActiveXObject) {
			var ld_xmlhttps = ["MSXML2.XMLHTTP.4.0", "MSXML2.XMLHTTP.3.0",
					"MSXML2.XMLHTTP", "Microsoft.XMLHTTP"];
			for (var l_i = 0; l_i < ld_xmlhttps.length; l_i++) {
				try {
					lo_http_request = new ActiveXObject(ld_xmlhttps[l_i]);
					break;
				} catch (ld_e) {
					lo_http_request = false;
				}
			}
		} else {
			try {
				lo_http_request = new XMLHttpRequest();
			} catch (ld_e) {
				lo_http_request = false;
			}
		}
		return lo_http_request;
	},
	mf_sendrequest : function(lo_xmlhttp, ld_url, lf_process) {
		lo_xmlhttp.onreadystatechange = lf_process;
		lo_xmlhttp.open("GET", ld_url, true);
		lo_xmlhttp.send(null);
	},
	mf_sendrequest_sync : function(lo_xmlhttp, ld_url) {
		lo_xmlhttp.open("GET", ld_url, false);
		lo_xmlhttp.send(null);
	},
	mf_postrequest : function(lo_xmlhttp, ld_url, lf_process, ld_data) {
		lo_xmlhttp.onreadystatechange = lf_process;
		lo_xmlhttp.open("POST", ld_url, true);
		lo_xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		lo_xmlhttp.send(ld_data);
	}
};

/*
 * @desc	List object for location
 */
var SelectList = {
	mo_options : null,
	mo_countryObj : null,
	mo_stateObj : null,
	mo_cityObj : null,
	mo_hideState: 'true',
	md_defaultCountry : "",
	md_defaultState : "",
	md_defaultCity : "",
	md_defaultValue: ['---', '---', '---'],
	md_loadingId : "loading",
	md_load_completeId : "load_complete",
	md_http_request : false,
	md_loc_xml : false,
	md_bgetfailed : false,
	md_bInit : false,
	md_bAreaLoaded : false,
	md_bUpdate : false,
	
	
	mf_init : function(options) {
		this.mo_options = {
			country: 'country',
			state: 'state',
			city: 'city',
			hideState: 'true',
			defaultValue: ['---', '---', '---'],
			current: '',
			language: 'zh_cn',
			path_to_xml: '',
			read_only: false
		};
		for (var i in this.mo_options) {
			if (options[i]) this.mo_options[i] = options[i];
		}
		this.mo_options.read_only = this.mo_options.read_only || false;
		this.mo_countryObj = document.getElementById(this.mo_options.country);
        addEvent(this.mo_countryObj, "change", this.mf_processStateList);
		this.mo_stateObj = document.getElementById(this.mo_options.state);
        addEvent(this.mo_stateObj, "change", this.mf_processCityList);
		this.mo_cityObj = document.getElementById(this.mo_options.city);
		this.mo_hideState = this.mo_options.hideState;

		if (SelectList.mo_options.read_only && (!this.mo_options.current || this.mo_options.current == '||')) {
			this.mo_cityObj.innerHTML = '-';
			return ;
		}
		
		this.mf_getinfo(this.mo_options.language, this.mo_options.path_to_xml);
		var l_area = this.mo_options.current.split("|");
		this.md_defaultCountry = (l_area[0] ? l_area[0] : "");
		this.md_defaultState = (l_area[1] ? l_area[1] : "");
		this.md_defaultCity = (l_area[2] ? l_area[2] : "");
		this.md_defaultValue = this.mo_options.defaultValue;
		this.md_bInit = true;
	},
	
	mf_getinfo : function(lang, path) {
		if (!lang) lang = "zh_cn";
		if (!path) path = "";
		
		var ld_url = path + "selectAutoChange-" + lang + ".xml";
		if (navigator.userAgent.indexOf("Opera") > -1) {
			ld_url += ("?seed=" + Math.random());
		}
		this.md_http_request = XmlHttp.mf_createxmlhttp();
		if (!this.md_http_request) {
			return false;
		}
		this.md_bgetfailed = false;
		XmlHttp.mf_sendrequest_sync(this.md_http_request, ld_url);
		this.mf_RecvLocList();
		return true;
	},
	
	mf_RecvLocList : function() {
		if (SelectList.md_http_request.readyState == 4) {
			if (SelectList.md_http_request.status == 200) {
				SelectList.md_loc_xml = SelectList.md_http_request.responseXML.documentElement;
				if (SelectList.mo_options.read_only) {
					SelectList.mf_showCity();
				} else {
					SelectList.mf_initUpdate();
				}
			} else {
				SelectList.md_bgetfailed = true;
				alert("Get area list failed, please refresh and try it again!");
			}
		}
	},
	
	mf_initUpdate : function() {
		if (!this.md_bInit || !this.md_loc_xml) {
			setTimeout("SelectList.mf_initUpdate();", 300);
			return;
		}
		this.mf_processCountryList();
		if (this.md_defaultCountry != "") {
			if (Util_List.mf_select(this.mo_countryObj, this.md_defaultCountry)) {
				this.mf_processStateList();
			}
		}
		if (this.md_defaultState != "") {
			if (Util_List.mf_select(this.mo_stateObj, this.md_defaultState)) {
				this.mf_processCityList();
			}
		}
		if (this.md_defaultCity != "") {
			if (Util_List.mf_select(this.mo_cityObj, this.md_defaultCity)) {
				;
			}
		}

		this.md_bAreaLoaded = true;
		return true;
	},
	
	mf_showCity : function() {
		if (!this.md_bInit || !this.md_loc_xml) {
			setTimeout("SelectList.mf_showCity();", 300);
			return;
		}
		
		var city = '';
		var lo_Countrys = this.md_loc_xml.getElementsByTagName("CountryRegion");
		for (var l_i = 0; l_i < lo_Countrys.length; l_i++) {
			if (this.md_defaultCountry == lo_Countrys[l_i].getAttribute("Code")) {
				city += lo_Countrys[l_i].getAttribute("Name");
				break;
			}
		}
		
		var lo_States = lo_Countrys[l_i].getElementsByTagName("State");
		if (lo_States.length > 1) {
			for (l_i = 0; l_i < lo_States.length; l_i++) {
				if (this.md_defaultState == lo_States[l_i].getAttribute("Code")) {
					city += lo_States[l_i].getAttribute("Name");
					break;
				}
			}
			if (lo_States[l_i]) {
				var lo_Citys = lo_States[l_i].getElementsByTagName("City");
				if (lo_Citys.length > 0) {
					for (l_i = 0; l_i < lo_Citys.length; l_i++) {
						if (this.md_defaultCity == lo_Citys[l_i].getAttribute("Code")) {
							city += lo_Citys[l_i].getAttribute("Name");
							break;
						}
					}
				}
			}
		}
		this.mo_cityObj.innerHTML = city;
		return ;
	},
	
	mf_processCountryList : function() {
        var self = null;
		if ( !$(this).hasOwnProperty("md_bInit") || !$(this).hasOwnProperty("md_loc_xml")){
            self = SelectList;
        } 
        else{
            self = this;
        }
        
        if (!self.md_bInit || !self.md_loc_xml) {
			return;
		}
		var lo_CountryDivObj = self.mo_countryObj;
		Util_List.mf_clear(self.mo_countryObj, self.md_defaultValue[0]);
		var lo_Countrys = self.md_loc_xml.getElementsByTagName("CountryRegion");
		var ld_text = "", ld_value = "";
		for (var l_i = 0; l_i < lo_Countrys.length; l_i++) {
			ld_text = lo_Countrys[l_i].getAttribute("Name");
			ld_value = lo_Countrys[l_i].getAttribute("Code");
			Util_List.mf_add(self.mo_countryObj, ld_text, ld_value);
		}
		lo_CountryDivObj.style.display = "inline";
		self.mf_processStateList();
	},
	
	mf_processStateList : function() {
        var self = null;
		if ( !$(this).hasOwnProperty("md_bInit") || !$(this).hasOwnProperty("md_loc_xml")){
            self = SelectList;
        } 
        else{
            self = this;
        }
        
        if (!self.md_bInit || !self.md_loc_xml) {
			return;
		}
        
		var lo_StateDivObj = self.mo_stateObj;
		Util_List.mf_clear(self.mo_stateObj, self.md_defaultValue[1]);
		do {
			var lo_Countrys = self.md_loc_xml
					.getElementsByTagName("CountryRegion");
			var ld_Country = self.mo_countryObj.value;
			var l_i = 0;
			for (l_i = 0; l_i < lo_Countrys.length; l_i++) {
				if (lo_Countrys[l_i].getAttribute("Code") == ld_Country) {
					break;
				}
			}
			if (l_i >= lo_Countrys.length) {
				break;
			}
			var lo_States = lo_Countrys[l_i].getElementsByTagName("State");
			
			if (self.mo_hideState == 'true' ? lo_States.length <= 1 : lo_States.length < 1) {
				lo_StateDivObj.style.display = "none";
				break;
			}
			var ld_text = "", ld_value = "";
			for (l_i = 0; l_i < lo_States.length; l_i++) {
				ld_text = lo_States[l_i].getAttribute("Name");
				ld_value = lo_States[l_i].getAttribute("Code");
				Util_List.mf_add(self.mo_stateObj, ld_text, ld_value);
			}
			lo_StateDivObj.style.display = "inline";
			if (self.md_bUpdate && (Util_List.mf_isempty(self.mo_stateObj))) {
				self.mo_stateObj.focus();
			}
		} while (false);
		if (lo_StateDivObj.style.display == "none") {
			// ErrMapUtil.mf_DelFromErrMap(g_TitleArr[6]);
		}
		self.mf_processCityList();
	},
	
	mf_processCityList : function() {
        var self = null;
		if ( !$(this).hasOwnProperty("md_bInit") || !$(this).hasOwnProperty("md_loc_xml")){
            self = SelectList;
        } 
        else{
            self = this;
        }
        
        if (!self.md_bInit || !self.md_loc_xml) {
			return;
		}
		var lo_CityDivObj = self.mo_cityObj;
		Util_List.mf_clear(self.mo_cityObj, self.md_defaultValue[2]);
		do {
			var lo_Countrys = self.md_loc_xml
					.getElementsByTagName("CountryRegion");
			var ld_Country = self.mo_countryObj.value;
			var l_i = 0;
			for (l_i = 0; l_i < lo_Countrys.length; l_i++) {
				if (lo_Countrys[l_i].getAttribute("Code") == ld_Country) {
					break;
				}
			}
			if (l_i >= lo_Countrys.length) {
				break;
			}
			var lo_States = lo_Countrys[l_i].getElementsByTagName("State");
			l_i = 0;
			if (self.mo_hideState == 'true' ? lo_States.length > 1 : lo_States.length >= 1) {
				var ld_State = self.mo_stateObj.value;
				for (; l_i < lo_States.length; l_i++) {
					if (lo_States[l_i].getAttribute("Code") == ld_State) {
						break;
					}
				}
				if (l_i >= lo_States.length) {
					break;
				}
			} else if (lo_States.length <= 0) {
				if(lo_CityDivObj != null){
					lo_CityDivObj.style.display = "none";
				}
				break;
			}
			var lo_Citys = lo_States[l_i].getElementsByTagName("City");
			if (lo_Citys.length <= 0) {
				if(lo_CityDivObj != null){
					lo_CityDivObj.style.display = "none";
					break;
				}
			}else{
				if(lo_CityDivObj != null){
					lo_CityDivObj.style.display = "inline";
				}
			}
			var ld_text = "", ld_value = "";
			for (l_i = 0; l_i < lo_Citys.length; l_i++) {
				ld_text = lo_Citys[l_i].getAttribute("Name");
				ld_value = lo_Citys[l_i].getAttribute("Code");
				Util_List.mf_add(self.mo_cityObj, ld_text, ld_value);
			}
			if(lo_CityDivObj != null){
				lo_CityDivObj.style.display = "inline";
				if (self.md_bUpdate && (Util_List.mf_isempty(self.mo_cityObj))) {
					self.mo_cityObj.focus();
				}
			}
		} while (false)
		if(lo_CityDivObj != null){
			if (lo_CityDivObj.style.display == "none") {
				// ErrMapUtil.mf_DelFromErrMap(g_TitleArr[7]);
			}
		}
	}
};

function addEvent(obj, type, func){
    if(obj.addEventListener){
        obj.addEventListener(type, func, false);
    }
    else if(obj.attachEvent){
        obj["e" + type + func] = func;
        obj[type + func] = function(){
            obj["e" + type + func](window.event);
        }
        obj.attachEvent("on" + type, obj[type + func]);
    }
    else{
        obj["on" + type] = obj["e" + type + func];
    }
}
