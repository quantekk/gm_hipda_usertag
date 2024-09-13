// UserScript
// @name HiPDA BlackList and UserTag
// @description hi-pda.com BlackList and UserTag
// @version 0.1
// @author Jichao Wu, Quantek
// @license MIT
// @namespace com.jichaowu.hipda
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_addStyle
// @match http://www.4d4y.com/forum/*
// @match https://www.4d4y.com/forum/*
// /UserScript
(function() {
    'use strict';
// ================= helpers ==================
console.log("running at " + window.location.href);
function q(s){if(document.body){return document.body.querySelector(s);}return null;}
function xpath(s) {
	return document.evaluate(s, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}
// ================= Configuation Page  ==================
function addConfigDiv() {
    // BlackList Configuration Page
    var hp_cfg = document.createElement("div");
    hp_cfg.id = "hp_blacklist_config_div";
    hp_cfg.style = "position:fixed;align:center; width:300px; height:50%;\
        padding:15px;top:20px;right:20px;z-index:99;-moz-border-radius:5px;\
        color:#fff;background:#9287AE;border:2px solid #bfbfbf;opacity:0.95;\
        text-align:left;font-size:14px !important; overflow-y: scroll;";
    //hp_cfg.style.display = "none";
    hp_cfg.innerHTML = '\
    	<a href="javascript:void(0)" id="hp_blacklist_close_button" style="position:fixed; top:25px; right:100px; color:white">关闭</a>\
        <div id="hp_blacklist_blacklist"></div><br />\
        <div id="hp_blacklist_taglist"></div><br />\
    	<a href="javascript:void(0)" id="hp_blacklist_export_button" style="color:white">导出</a>\
    	<a href="javascript:void(0)" id="hp_blacklist_import_button" style="color:white">导入</a>\
        <input type="file" id="hp_blacklist_real_import_button" accept=".csv" style="display:none" />\
        ';
    q('#header').insertBefore(hp_cfg, q('#header').firstChild);
    q('#hp_blacklist_close_button').addEventListener('click', function(){
    	hp_cfg.style.display = 'none';
    }, false);
    q('#hp_blacklist_export_button').addEventListener('click', function(){
    	exportToCSV();
    }, false);
    q('#hp_blacklist_import_button').addEventListener('click', function(){
    	document.getElementById('hp_blacklist_real_import_button').click();
    }, false);
    q('#hp_blacklist_real_import_button').addEventListener('change', function(){
    	var selectedFile = document.getElementById("hp_blacklist_real_import_button").files[0];
        console.log(selectedFile);
        importFromCSV(selectedFile);
    }, false);
    // Add shortlinks
    document.getElementById('umenu').appendChild(document.createTextNode(" | "));
    var menuitem1=document.createElement('a');
    menuitem1.innerHTML="我的帖子";
    menuitem1.href='https://www.4d4y.com/forum/my.php?item=threads';
    document.getElementById('umenu').appendChild(menuitem1);
    document.getElementById('umenu').appendChild(document.createTextNode(" | "));
    var menuitem2=document.createElement('a');
    menuitem2.innerHTML="我的回复";
    menuitem2.href='https://www.4d4y.com/forum/my.php?item=posts';
    document.getElementById('umenu').appendChild(menuitem2);
    document.getElementById('umenu').appendChild(document.createTextNode(" | "));
    var menuitem=document.createElement('a');
    menuitem.innerHTML="黑名单";
    menuitem.href='javascript:void(0)';
    document.getElementById('umenu').appendChild(menuitem);
    menuitem.addEventListener('click', function(){
    	hp_cfg.style.display = hp_cfg.style.display === 'none' ? '' : 'none';
    }, false);
    hp_cfg.style.display = 'none';
}
function updateBlackListUI() {
    // Update the blacklist on the configuration page
    var blackList = getSavedBlackList();
    var dom = q('#hp_blacklist_blacklist');
	var list = [];
    for (const [key, value] of Object.entries(blackList)) {
        //console.log(key, value);
		list.push('<span class="hp_blacklist_username" style="font-size:12px">' + key + '</span>&nbsp&nbsp<a username="'+key+'">x</a>');
    }
	dom.innerHTML = list.join('\n<br />');
	var buttons = dom.getElementsByTagName('a');
	for (var i = 0; i < buttons.length; i++) {
		var b = buttons[i];
		var u = b.getAttribute('username');
		(function(username){
			b.addEventListener('click', function(){
				removeUser(username);
			}, false);
		})(u);
	}
}
function updateTagListUI() {
    // Update the Taglist on the configuration page
	var dom = q('#hp_blacklist_taglist');
	var list = [];
    var tagList = getSavedTag();
    for (const [key, value] of Object.entries(tagList)) {
        //console.log(key, value);
		list.push('<span class="hp_blacklist_username" style="font-size:12px">' + key + ' ' + value + '</span>');
    }
	dom.innerHTML = list.join('\n<br />');
}
// ================= Modify Post Page  ==================
function addBlockBtn(){
  //Add Block button on each reply
  var s = xpath("//div[@class='authorinfo']");
  for (var i = s.snapshotLength - 1; i >= 0; i--) {
    var t = s.snapshotItem(i);
    var a1=document.createElement('a');
    a1.innerHTML = '屏蔽';
    a1.href = '###';
 	a1.addEventListener('click', onBlockUser, false);
    t.appendChild(document.createTextNode(" | "));
    t.appendChild(a1);
  }
}
function removeBlockedPost() {
    var s,i,t,a;
    if (location.href.indexOf('viewthread.php') !== -1) {
        s = xpath("//div[@class='postinfo']");
        for (i = s.snapshotLength - 1; i >= 0; i--) {
            t = s.snapshotItem(i);
            a = t.getElementsByTagName('a')[0];
            if( a != undefined){
            	t.parentNode.parentNode.parentNode.parentNode.style.display = isUserInBlackList(a.text) ? 'none' : '';
            }
        }
    }
    if (location.href.indexOf('forumdisplay.php') !== -1) {
        s = xpath("//td[@class='author']");
        for (i = s.snapshotLength - 1; i >= 0; i--) {
            t = s.snapshotItem(i);
            a = t.getElementsByTagName('a')[0];
            if( a != undefined){
            	t.parentNode.style.display = isUserInBlackList(a.text) ? 'none' : '';
            }
        }
    }
}
function simplifyPost(){
    var s,i,t,a;
    if (location.href.indexOf('viewthread.php') !== -1) {
        s = xpath("//td[@class='postcontent postbottom']"); // remove signature
        for ( i = s.snapshotLength - 1; i >= 0; i--) {
            t = s.snapshotItem(i);
            t.style.display = 'none';
        }
    }
    if (location.href.indexOf('viewthread.php') !== -1) {
        s = xpath("//div[@class='t_msgfontfix']"); // remove post's height limitation
        for ( i = s.snapshotLength - 1; i >= 0; i--) {
            t = s.snapshotItem(i);
            t.classList.remove('t_msgfontfix');
        }
    }
    if (location.href.indexOf('viewthread.php') !== -1) {
        s = xpath("//dl[@class='profile s_clear']"); // remove user's register date info
        for ( i = s.snapshotLength - 1; i >= 0; i--) {
            t = s.snapshotItem(i);
            t.style.display = 'none';
            t.previousElementSibling.previousElementSibling.firstElementChild.innerHTML = '';
            t.previousElementSibling.previousElementSibling.firstElementChild.nextElementSibling.innerHTML = '';
            t.previousElementSibling.innerHTML = '';
        }
    }
}
function updateUI() {
    addConfigDiv();
	updateBlackListUI();
    updateTagListUI();
	removeBlockedPost();
    simplifyPost();
    addBlockBtn();
	addUserTag();
}
updateUI()
// -----------------  User Tag  -------------
function getUserTag(userName) {
    var tagList = getSavedTag();
	var tag = tagList[userName];
	return (tag == undefined ? '' : tag);
}
function addUserTag() {
    // Add tag for each author
    if (location.href.indexOf('viewthread.php') !== -1) {
        var s = xpath("//dl[@class='profile s_clear']");
        for (var i = s.snapshotLength - 1; i >= 0; i--) {
            var t = s.snapshotItem(i);
            var aUser = t.parentNode.getElementsByTagName('a')[0];
            var aUserTag = getUserTag(aUser.text);
            var aTag=document.createElement('a');
            aTag.innerHTML = '<div class=tag><p>'+ (aUserTag == '' ? '...' : aUserTag) + '</p></div>';
            aTag.href = '###';
            aTag.addEventListener('click', onEditUserTag, false);
            t.parentNode.appendChild(aTag);
        }
    }
}
function onEditUserTag(e){
    // Click tag to edit it
    var node = e.target.parentNode.parentNode.parentNode.parentNode.parentNode.getElementsByClassName('postinfo')[0].getElementsByTagName('a')[0];
    var tagList = getSavedTag();
    var userName = node.text;
    var oldTag = getUserTag(userName);
    var newTag = prompt('修改标签', oldTag);
    console.log(newTag);
    if (newTag !== oldTag && newTag !== null){
        getSavedTag();
        if (newTag == ''){
            delete tagList[userName];
        } else {
            tagList[userName] = newTag;
        }
        var aUser = e.target;
        aUser.innerHTML = (newTag == '' ? '...' : newTag);
        saveTag(tagList);
        updateTagListUI();
    }
};
function getSavedTag() {
	var tagList = GM_getValue('HPSavedTag_V1') || {};
    console.log(tagList)
    return tagList;
}
function saveTag(tagList) {
	GM_setValue('HPSavedTag_V1', tagList );
    console.log(tagList)
}
// ================= blacklist service ================
function onBlockUser(e){
    var node = e.target.parentNode.parentNode.parentNode.parentNode.parentNode.getElementsByClassName('postinfo')[0].getElementsByTagName('a')[0];
    var username = node.text;
    addUser(username);
};
function isUserInBlackList(username) {
    var blackList = getSavedBlackList();
	var a = blackList[username];
	return (a == undefined ? false : true);
}
function addUser(username) {
    if (!isUserInBlackList(username)) {
        var blackList = getSavedBlackList();
        blackList[username] = true;
        saveBlackList(blackList);
        updateBlackListUI();
        removeBlockedPost();
    }
}
function removeUser(username) {
    var blackList = getSavedBlackList();
    if (isUserInBlackList(username)) {
        delete blackList[username];
        saveBlackList(blackList);
        updateBlackListUI();
    }
}
function getSavedBlackList() {
	var blackList = GM_getValue('HPSavedBlackList_V1') || {};
    console.log( blackList);
    return blackList;
}
function saveBlackList(blackList) {
	GM_setValue('HPSavedBlackList_V1',blackList );
    console.log(blackList);
}
// =================== Export and Import CSV =================
function downloadCSV(csv, filename) {
    var csvFile;
    var downloadLink;
    //define the file type to text/csv
    csvFile = new Blob([csv], {type: 'text/csv'});
    downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
}
function exportToCSV() {
   var csv = [];
   var blackList = getSavedBlackList();
   var tagList = getSavedTag();
   for (const [key, value] of Object.entries(blackList)) {
        //console.log(key, value);
		csv.push( key + '\t' + value);
   }
   for (const [key, value] of Object.entries(tagList)) {
		csv.push( key + '\t' + value);
   }
   downloadCSV(csv.join("\n"), "hipda_blacklist.csv");
}
function importFromCSV(filename) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        console.log(text);
        var rows = text.split('\n');
        var newBlackList = {};
        var newTagList = {};
        for (var rr of rows) {
            var data = rr.split("\t");
            if (data[1] == "true") {
               newBlackList[data[0]]=true;
            } else {
               newTagList[data[0]]=data[1];
            }
        }
        saveBlackList(newBlackList);
        saveTag(newTagList);
        updateBlackListUI();
        removeBlockedPost();
    };
    reader.readAsText(filename);
}
})();