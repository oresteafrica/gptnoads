var lang = app.LoadText('lang','en','gptnoads');

const db = app.OpenDatabase('dbgptnoads');
const dbFields = 'id INTEGER NOT NULL primary key,'+
            'model TEXT,'+
            'question TEXT,'+
            'answer TEXT,'+
            'dt TEXT,'+
            'tokens INTEGER,'+
            'temperature REAL,'+
            'top_p REAL,'+
            'presence_penalty REAL,'+
            'frequency_penalty REAL';
db.ExecuteSql('CREATE TABLE IF NOT EXISTS history ('+dbFields+')',null,exeSqlCreateOk,exeSqlCreateErr);

const modelsFields = 'idn INTEGER NOT NULL primary key,'+
            'id TEXT,'+
            'object TEXT,'+
			'created INTEGER,'+
			'owned_by TEXT,'+
			'p_id TEXT,'+
			'p_object TEXT,'+
			'p_created INTEGER,'+
			'p_allow_create_engine INTEGER,'+
			'p_allow_sampling INTEGER,'+
			'p_allow_logprobs INTEGER,'+
			'p_allow_search_indices INTEGER,'+
			'p_allow_view INTEGER,'+
			'p_allow_fine_tuning INTEGER,'+
			'p_organization TEXT,'+
			'p_group TEXT,'+
			'p_is_blocking INTEGER,'+
			'root TEXT,'+
			'parent TEXT';
db.ExecuteSql('CREATE TABLE IF NOT EXISTS models ('+modelsFields+')',null,exeSqlCreateOk,exeSqlCreateErr);

db.ExecuteSql('SELECT idn FROM models;', [], exeSqlCountModelsOK,exeSqlCountModelsKO);

const chatUrl = 'https://api.openai.com/v1/chat/completions';
const modelsUrl = 'https://api.openai.com/v1/models';
const sub = document.querySelector('#submit-box');
const bum = document.querySelector('#menu-box');
const txt = document.querySelector('#input-box textarea');
const main = document.querySelector('#main');
const down = document.querySelector('#down');
const waitCur = document.querySelector('#wait-cursor');
const spanModel = document.querySelector('#span_model');
const menuLabel = document.querySelector('#menu-box>center>p');

var model = app.LoadText('model','gpt-3.5-turbo','gptnoads');
var max_tokens = app.LoadNumber('max_tokens',0,'gptnoads');
var temperature = app.LoadNumber('temperature',-10,'gptnoads');
var top_p = app.LoadNumber('top_p',-10,'gptnoads');
var presence_penalty = app.LoadNumber('presence_penalty',-10,'gptnoads');
var frequency_penalty = app.LoadNumber('frequency_penalty',-10,'gptnoads');
var theme = app.LoadText('theme','dark','gptnoads');

main.className = theme;

bum.addEventListener('click', clickMenu);
sub.addEventListener('click', getResponse);

spanModel.innerHTML = model;
changeLang(lang);

//------------------------------------------------------------------------------
function OnMenu(item) {
    switch (item) {
        case t_history[lang]:
            reset();
            db.ExecuteSql('select * from history order by dt desc;', [], exeSqlSelectAll);
            break;
        case t_reset[lang]:
            reset();
            txt.value = '';
            break;
        case t_param[lang]:
            reset();
            db.ExecuteSql('SELECT * FROM models;', [], exeSqlSelectModelsOK, exeSqlSelectModelsKO);
            break;
        case t_language[lang]:
            reset();
            lang_flags.forEach(function (e, i) {
            	main.innerHTML += '<button '+
            	                    'style="height:6vh;font-size:4vw;margin:8px;border-radius:20%;box-shadow:4px 4px gray;" '+
                                    'onclick="changeLang(\''+
                                    e[0]+'\')"> '+e[1]+' '+e[2]+
                                    '</button>';
            });
            break;
        case t_theme[lang]:
            if (main.className == 'dark') {theme='bright';} else {theme='dark';}
            app.SaveText('theme',theme,'gptnoads');
            main.className = theme;
            break;
        case t_key[lang]:
            reset();
            load_html('apikey.html');
            break;
        case t_help[lang]:
            reset();
            load_html('help_'+lang+'.html');
            break;
        default:
    }
}
//------------------------------------------------------------------------------
function load_html(fh) {
    xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() { 
        if (xhr.readyState == 4 && xhr.status == 200) {
            modifiedContent = replaceVars(xhr.responseText);
            main.innerHTML = modifiedContent;
        }
    }
    xhr.open('GET', 'Html/'+fh, true);
    xhr.setRequestHeader('Content-type', 'text/html');
    xhr.send();
}
//------------------------------------------------------------------------------
function replaceVars(htmlContent) {
	data = ['t_menu','t_history','t_reset','t_param','t_language','t_key','t_help','t_write','t_getapi','t_date','t_question','t_answer','t_yourkey','t_apinotvalid','t_dbaserr','t_apisaved','t_ok','t_cancel','t_norisp'];
	var modifiedContent = htmlContent;
	data.forEach(function(k, i) { 	
		var regex = new RegExp(k, "g");
		modifiedContent = modifiedContent.replace(regex, eval(k+'[lang]'));
	});
	return modifiedContent;
}
//------------------------------------------------------------------------------
function reset() {
    main.innerHTML = '';
}
//------------------------------------------------------------------------------
function clickMenu() {
    app.ShowMenu();
}
//------------------------------------------------------------------------------
function getTemperature(o) {
	var t = document.querySelector('#dia-top_p').value;
	var v = o.value;
	if (t!=-10) {o.value=-10}
}    
//------------------------------------------------------------------------------
function getTop_t(o) {
	var t = document.querySelector('#dia-temperature').value;
	var v = o.value;
	if (t!=-10) {o.value=-10}
}
//------------------------------------------------------------------------------
function apiBuOkFun(o) {
    apiKey = o.previousElementSibling.value;
    if (apiKey.length<50) {
		app.ShowPopup(t_apinotvalid[lang],'Long');
	} else {
		app.SaveText('apiKey',apiKey,'gptnoads')
		app.ShowPopup(t_apisaved[lang],'Long');
	}
    reset();
}
//------------------------------------------------------------------------------
function paramBuOkFun(o) {
    var oModel = o.parentElement.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.children[0];
    var model = oModel.value;
    var oMaxTokens = o.parentElement.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.children[0];
    var max_tokens = parseInt(oMaxTokens.value);
    var oTemperature = o.parentElement.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.children[0];
    var temperature = Number(oTemperature.value);
    var oTopp = o.parentElement.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.children[0];
    var top_p = Number(oTopp.value);
    var oPresencePenalty = o.parentElement.previousElementSibling.previousElementSibling.previousElementSibling.children[0];
    var presence_penalty = Number(oPresencePenalty.value);
    var oFrequencyPenalty = o.parentElement.previousElementSibling.children[0];
    var frequency_penalty = Number(oFrequencyPenalty.value);
    app.SaveText('model',model,'gptnoads');
    app.SaveNumber('max_tokens',max_tokens,'gptnoads');
    app.SaveNumber('temperature',temperature,'gptnoads');
    app.SaveNumber('top_p',top_p,'gptnoads');
    app.SaveNumber('presence_penalty',presence_penalty,'gptnoads');
    app.SaveNumber('frequency_penalty',frequency_penalty,'gptnoads');
    spanModel.innerHTML = model;
    reset();
}
//------------------------------------------------------------------------------
function buShareFun(el,pm) {
    var strModel = el.parentElement.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.textContent;
    var strDate = el.parentElement.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.textContent;
    var strQuestion = el.parentElement.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.textContent;
    var strAnswer = el.parentElement.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.textContent;
    var strToken = el.parentElement.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.textContent;
    var strTemperature = el.parentElement.previousElementSibling.previousElementSibling.previousElementSibling.previousElementSibling.textContent;
    var strTop_p = el.parentElement.previousElementSibling.previousElementSibling.previousElementSibling.textContent;
    var strPresencePenalty = el.parentElement.previousElementSibling.previousElementSibling.textContent;
    var strFrequencyPenalty = el.parentElement.previousElementSibling.textContent;
    var txt = strModel+'\n'+strDate+'\n'+strQuestion+'\n'+strAnswer+'\n'+strToken+'\n'+strTemperature+'\n'+strTop_p+'\n'+strPresencePenalty+'\n'+strFrequencyPenalty;
    switch (pm) {
    	case 'whatsapp':
    	    app.OpenUrl('whatsapp://send?text='+txt );
    		break;
    	case 'telegram':
    	    app.OpenUrl('tg://msg?text='+txt );
    		break;
    	default:
    }
}
//------------------------------------------------------------------------------
function changeLang(l) {
    app.SaveText('lang',l,'gptnoads');
    menuStr = t_history[l]+','+t_reset[l]+','+t_param[l]+','+t_language[l]+','+t_theme[l]+','+t_key[l]+','+t_help[l];
    app.SetMenu(menuStr);
    menuLabel.innerText = t_menu[l];
    // app.ShowPopup(l,'Short');
    lang = l;
    reset();
}
//------------------------------------------------------------------------------
function OnEntryError(e) {
    app.ShowPopup(t_dbaserr[lang]+':\n'+e,'Long');   
}
//------------------------------------------------------------------------------
function exeSqlCreateOk(s) {
    app.Debug('exeSqlCreateOk = '+JSON.stringify(s, null, 2));
}
//------------------------------------------------------------------------------
function exeSqlCreateErr(e) {
    app.Debug('exeSqlCreateErr = '+JSON.stringify(e, null, 2));
}
//------------------------------------------------------------------------------
function escapeQuotes(str) {
    return str.replace(/['"]/g, '\\$&');
}
//------------------------------------------------------------------------------
function exeSqlSelectAll(res) {
    var len = res.rows.length;
    for(var i = 0; i < len; i++ ) {
        var item = res.rows.item(i);
        main.innerHTML += '<div><b>Model:</b> '+item.model+'</div>';
        main.innerHTML += '<div><b>'+t_date[lang]+':</b> '+item.dt+'</div>';
        main.innerHTML += '<div><b>'+t_question[lang]+'</b></div>';
        main.innerHTML += '<div>'+item.question+'</div>';
        main.innerHTML += '<div><b>'+t_answer[lang]+'</b></div>';
        main.innerHTML += '<div>'+item.answer+'</div>';
        main.innerHTML += '<div><b>Tokens:</b> '+item.tokens+'</div>';
        main.innerHTML += '<div><b>Temperature:</b> '+item.temperature+'</div>';
        main.innerHTML += '<div><b>top_p:</b> '+item.top_p+'</div>';
        main.innerHTML += '<div><b>Presence penalty:</b> '+item.presence_penalty+'</div>';
        main.innerHTML += '<div><b>Frequency penalty:</b> '+item.frequency_penalty+'</div>';
        main.innerHTML += '<div>';
        main.innerHTML += '<button class="bu_share bu_whatsapp" onclick="buShareFun(this,\'whatsapp\');"></button>';
        main.innerHTML += '<button class="bu_share bu_telegram" onclick="buShareFun(this,\'telegram\');"></button>';
        main.innerHTML += '</div>';
        main.innerHTML += '<hr />';
    }
}
//------------------------------------------------------------------------------
function exeSqlCountModelsOK(s) {
    var len_s = s.rows.length;
    if (len_s < 10) {
        getModels();
    }
}
//------------------------------------------------------------------------------
function exeSqlCountModelsKO(e) {
	main.innerHTML = '<div>'+
	    t_norisp[lang]+
	    '<br />exeSqlCountModelsKO(e)<br />'+
	    e+
	    '</div>';
    console.log('-'.repeat(40));
    console.log('exeSqlCountModelsKO(e)');
    console.log('e = '+JSON.stringify(e, null, 2));
    console.log('-'.repeat(40));
}
//------------------------------------------------------------------------------
async function getResponse() {
    waitCur.style.display = 'block';
	reset();
    var quest = txt.value;
    if (quest == '') {
        app.ShowPopup(t_write[lang],'Long');
        waitCur.style.display = 'none';
        return;
    }
    var apiKey = app.LoadText('apiKey','','gptnoads');
    if (apiKey.length<50) {
        app.ShowPopup(t_getapi[lang],'Long');
        waitCur.style.display = 'none';
        main.innerHTML = quest;
        waitCur.style.display = 'none';
        return;
    }
    var nowDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    model = app.LoadText('model','gpt-3.5-turbo','gptnoads');
    max_tokens = app.LoadNumber('max_tokens',0,'gptnoads');
    temperature = app.LoadNumber('temperature',0,'gptnoads');
    top_p = app.LoadNumber('top_p',0,'gptnoads');
    presence_penalty = app.LoadNumber('presence_penalty',0,'gptnoads');
    frequency_penalty = app.LoadNumber('frequency_penalty',0,'gptnoads');
	var body = {};
    body.model = model;
    if (max_tokens!=0 ) { body.max_tokens = max_tokens};
    if (temperature!=-10) { body.temperature = temperature};
    if (top_p!=-10) { body.top_p = top_p};
    if (presence_penalty!=-10) { body.presence_penalty = presence_penalty};
    if (frequency_penalty!=-10) { body.frequency_penalty = frequency_penalty};
    body.messages = [];
    var objMessages = {role:'user',content:quest};
    body.messages.push(objMessages);
	const options = {
		method: 'POST',
		headers: {
			'Authorization': 'Bearer ' + apiKey,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	}
	try {
		const response = await fetch(chatUrl, options)
		const data = await response.json()
		var respText = data.choices[0].message.content;
		var tokens = data.usage.total_tokens;
		if(respText && quest) {
    		main.innerHTML = '<hr /><p style="border-bottom:solid yellow 1px">Q. - '+
    		                    txt.value+
    		                    '</p><p style="border-bottom:solid yellow 1px">A. - '+
    		                    respText+'</p><p>Tokens: '+tokens+
                                '</p>'+
                                '<hr />';
            txt.value = '';
            db.ExecuteSql( 'INSERT INTO history (model,question,answer,dt,tokens,temperature,top_p,presence_penalty,frequency_penalty) VALUES (?,?,?,?,?,?,?,?,?)', [model,quest,respText,nowDateTime,tokens,temperature,top_p,presence_penalty,frequency_penalty], null, OnEntryError );
		}
	} catch(e) {
	    main.innerHTML = '<div>'+t_norisp[lang]+'</div>';
        console.log('e = '+e);
	}
    waitCur.style.display = 'none';
}
//------------------------------------------------------------------------------
async function getModels() {
    var a_model_keys = [];
    var a_model_vals = [];
    var temp_val;
    var sqlite = '';
    var apiKey = app.LoadText('apiKey','','gptnoads');
	fetch(modelsUrl, {
		method: 'GET',
		headers: {
			'Authorization': 'Bearer ' + apiKey
		}
	})
	.then(response => response.json())
	.then(data => {
		data.data.forEach((e) => {
			for (k in e) {
				if (k == 'permission') {
				    var permis = e[k][0];
        			for (h in permis) {
    				    a_model_keys.push('p_' + h);
    				    temp_val = val_sqlite_compatible(permis[h]);
    				    a_model_vals.push(temp_val);
                    }
				} else {
				    a_model_keys.push(k);
				    temp_val = val_sqlite_compatible(e[k]);
				    a_model_vals.push(temp_val);
				}
			}
			sqlite = 'INSERT INTO models ('+a_model_keys.join(',')+') VALUES ('+a_model_vals.join(',')+');';
            a_model_keys = [];
            a_model_vals = [];
           db.ExecuteSql( sqlite, null, OnEntryModelOK, OnEntryModelKO );
		})

	})
	.catch(e => {
		app.ShowPopup(t_norisp[lang],'Long');
		console.log('e = '+e);
	});
}
//------------------------------------------------------------------------------
function val_sqlite_compatible(v) {
	if(typeof(v)=='boolean' && (v=='false' || v==false)) { return 0; }
	if(typeof(v)=='boolean' && (v=='true' || v==true)) { return 1; }
	if(v==null) { return 'NULL'; }
	if(typeof(v)=='string') { return "'"+v+"'"; }
	if(typeof(v)=='number') { return v; }
	return v;
}
//------------------------------------------------------------------------------
function OnEntryModelOK(s) {
	app.ShowPopup(t_ok[lang],'Short');
    console.log('OnEntryModelOK('+JSON.stringify(s, null, 2)+')');
}
//------------------------------------------------------------------------------
function OnEntryModelKO(e) {
	app.ShowPopup(t_dbaserr[lang],'Short');
    console.log('OnEntryModelKO('+JSON.stringify(e, null, 2)+')');
}
//------------------------------------------------------------------------------
function exeSqlSelectModelsOK(res) {
    var xhrParam = new XMLHttpRequest();
    xhrParam.onreadystatechange = function() {
        if (xhrParam.readyState == 4 && xhrParam.status == 200) {
            modifiedContent = replaceVars(xhrParam.responseText);
            main.innerHTML = modifiedContent;
            model = app.LoadText('model','gpt-3.5-turbo','gptnoads');
            max_tokens = app.LoadNumber('max_tokens',0,'gptnoads');
            temperature = app.LoadNumber('temperature',-10,'gptnoads');
            top_p = app.LoadNumber('top_p',-10,'gptnoads');
            presence_penalty = app.LoadNumber('presence_penalty',-10,'gptnoads');
            frequency_penalty = app.LoadNumber('frequency_penalty',-10,'gptnoads');
            var oDiv = main.children[0]
            var oModel =  oDiv.children[1].children[0];
			var lenRes = res.rows.length;
			for(var i = 0; i < lenRes; i++ ) {
				var item = res.rows.item(i)
				let opt = document.createElement('option');
				opt.value = item.id;
				opt.innerHTML = item.id;
				if (item.owned_by!='openai') { continue; }
				if (item.id==model) { opt.setAttribute('selected', 'selected'); }
				oModel.append(opt);
			}
            var oMaxTokens = oDiv.children[3].children[0];
            oMaxTokens.value = max_tokens;
            var oTemperature = oDiv.children[5].children[0];
            oTemperature.value = temperature;
            var oTopp = oDiv.children[7].children[0];
            oTopp.value = top_p;
            var oPresencePenalty = oDiv.children[9].children[0];
            oPresencePenalty.value = presence_penalty;
            var oFrequencyPenalty = oDiv.children[11].children[0];
            oFrequencyPenalty.value = frequency_penalty;
        }
    }
    xhrParam.open('GET', 'Html/parameters.html', true);
    xhrParam.setRequestHeader('Content-type', 'text/html');
    xhrParam.send();
    console.log('exeSqlSelectModelsOK()');
}
//------------------------------------------------------------------------------
function exeSqlSelectModelsKO(e) {
	main.innerHTML = '<hr /><p style="color:red;font-size:x-large;">'+t_dbaserr[lang]+' '+t_param[lang]+'</p><hr />';
    console.log('exeSqlSelectModelsKO()');
}
//------------------------------------------------------------------------------
