//Band Score Split.js
//Copyright © 2019 kitami.hibiki. All rights reserved.
const vWidth = 708; //画像表示サイズ幅
const vHeight = 1000; //画像表示サイズ幅
const cWidth = 4248; //画像処理時サイズ幅
const cHeight = 6000; //画像処理時サイズ高
const cvRatio = cHeight / vHeight; //cavasサイズ/表示サイズ係数

var scale = 1.0 // 拡大率(初期値)

var tboxNum = 0 //トリミング枠数
var guide_L = vWidth * 0.05; //左側ガイド線位置(初期値)
var guide_R = vWidth - guide_L; //右側ガイド線位置(初期値)

var tvHeight = vHeight * 0.1 //トリミング枠縦幅(初期値)
var tvWidth = guide_R - guide_L //ガイド線間幅(初期値)
var offset_Y = 0;
var offset_X = 0;

var widthLock = false; //横幅ロックフラグ
var guideLeft = 10; //ガイド線左側のスペース
var Top_margin = vHeight * 0.05; //描画開始位置X（上部余白）

var title_h = 0;
var Para_interval = 15; //段落間隔
var outParaNum = 1; //出力領域段落カウント

const cvs = document.getElementById('in'); //inエリアcanvas
cvs.width = cWidth;
cvs.height = cHeight;
let out = document.getElementById('out'); //outエリアcanvas
out.width = cWidth;
out.height = cHeight;
const ctx_in = cvs.getContext('2d');
const ctx_out = out.getContext('2d');

var rangeInput_X1 = document.getElementById('rangeInput_X1');
var rangeInput_X2 = document.getElementById('rangeInput_X2');
var rangeInput_Y = document.getElementById('rangeInput_Y1');
var trimBoxList = document.getElementsByClassName('trimArea');
var OCRTextList = document.getElementsByClassName('OCRText');

//File input
var reader;
var file;
var fileNo = 0;
var objFile = document.getElementById("selectFile");
const img = new Image()

objFile.addEventListener("change", function(evt) {
    file = evt.target.files;
    reader = new FileReader();
    reader.readAsDataURL(file[0]);
    reader.onload = function() {
        load_img(reader.result);
    }
    ;
}, false);

function Load_Pre() {
    if (fileNo > 0) {
        fileNo--;
        reader.readAsDataURL(file[fileNo]);
    }
}
function Load_Next() {
    if (fileNo < file.length) {
        fileNo++;
        reader.readAsDataURL(file[fileNo]);
    }
}

window.onload = function() {
	rangeInput_X1.max = vWidth/2;
	rangeInput_X2.min = vWidth/2;
	rangeInput_X2.max = vWidth;

	rangeInput_X1.value = guide_L;
	rangeInput_X2.value = guide_R;

	document.getElementById('tboxX').value = guide_L;
	document.getElementById('tboxY').value = 0;
	document.getElementById('tvWidth').value = tvWidth;
    document.getElementById('tvHeight').value = tvHeight;
    document.getElementById('Para_interval').value = Para_interval;
    document.getElementById('title_text').value = 'タイトル';
    load_img('./image/001.jpg'); //DEBUG用
    //drawTrimBox('tbox_0',vHeight*0.1);
    drawGuideLine('guide_left','v',guide_L + 5);
    drawGuideLine('guide_right','v',guide_R - 5);
}

img.onload = function(_ev) {
    // 画像が読み込まれた
    scale = cWidth / img.width;
    draw_canvas();
    // 画像更新
    //console.log("load complete, scaling:"+ scale);
}

function load_img(dataUrl) {
	// 画像の読み込み
	clean_input()
	img.src = dataUrl
}

function draw_canvas() {
    // 画像更新
    ctx_in.fillStyle = 'rgb(255, 255, 255)'
    //inエリア背景
    ctx_in.fillRect(0, 0, cWidth, cHeight)
    // 背景を塗る
    ctx_in.drawImage(img,0,0,img.width,img.height,0,0,img.width*scale,img.height*scale)
    ctx_in.lineWidth = 2;
}

var divbox = {
	borderWidth : 1,
	borderColor : 'aqua',
	className : 'divbox',
	id : '',

	draw: function(x,y,width,height) {
	var elem = document.createElement('div');
			elem.className = this.className;
			elem.style.left = x + 'px';
			elem.style.top = y + 'px';
			elem.style.width = width + 'px';
			elem.style.height = height + 'px';
			if(this.id !='') elem.id = this.id;
			if(this.className == '') elem.style.border = this.borderWidth+'px solid '+this.borderColor;
			document.getElementById('inputDiv').appendChild(elem);
	}
}

 //トリミング領域描画
function drawTrimBox(id,PositionY) {
	divbox.id = id
	divbox.className = 'trimArea'
	divbox.draw(guide_L-guideLeft,PositionY,tvWidth+guideLeft,tvHeight)
}

//ガイド線描画
function drawGuideLine(id,type,positon) {
	divbox.className = 'guide ' + type
	divbox.id = id
	if (type == 'h')
		divbox.draw(0,positon,vWidth,0)
	else
		divbox.draw(positon,0,0,vHeight)
}

 //トリミング領域削除/追加
function deleTrimBox(tboxId) {
	elem = document.getElementById(tboxId)
	elem.parentNode.removeChild(elem)
}
function addTrimBox() {//TO-DO
}

 //画像出力
function download() {
    var filename = 'download.png';
    var downloadLink = document.getElementById('hiddenLink');

    if (out.msToBlob) {
        var blob = out.msToBlob();
        window.navigator.msSaveBlob(blob, filename);
    } else {
        downloadLink.href = out.toDataURL('image/png');
        downloadLink.download = filename;
        downloadLink.click();
    }
}
 //画像トリミング
function doTrim() {
    if (outParaNum == 1) {
        // 背景
        ctx_out.fillStyle = 'white'
		//ctx_out.fillStyle = '#f1f1f1' //DEBUG用
        ctx_out.fillRect(0, 0, cWidth, cHeight)
        // 表題
        var titleText = document.getElementById('title_text').value;
        if (titleText != '') {
            ctx_out.font = cWidth / 25 + "px serif";
            ctx_out.fillStyle = 'black'
            var textWidth = ctx_out.measureText(titleText).width;
            ctx_out.fillText(titleText, (cWidth - textWidth) / 2, Top_margin * cvRatio)
            title_h = 20;
        }
    }

    for (var i = 0; i < trimBoxList.length; i++) {
        //console.log("描画回数:" + outParaNum);

        var nextY = paraY1(outParaNum) + tvHeight;
        if (nextY > vHeight) {
            window.alert('ページ末尾に到達しました');
            break;
        }
        ;
        //画面位置to実際位置座標変換係数　
		rate = 1 / scale * cvRatio;
		elem = trimBoxList[i]
        //入力部
        sx = parseInt(elem.style.left) * rate;
        sy = parseInt(elem.style.top) * rate;
        sWidth = parseInt(elem.style.width) * rate;
        sHeight = parseInt(elem.style.height) * rate;
        //出力部
        dx = (vWidth-tvWidth -guideLeft) / 2 * cvRatio;
        dy = paraY1(outParaNum) * cvRatio;
        dWidth = sWidth * scale;
        dHeight = sHeight * scale;

        ctx_out.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        outParaNum++;
    }
}
 //n段目から描画位置Y1を計算
function paraY1(n) {
    if (n == 1)
        return Top_margin + title_h
    else
        return Top_margin + title_h + n*Para_interval + (n - 1) * tvHeight
}

function rangeXChange(Xn,val) {
	if(Xn==1){
		guide_L = parseInt(val);
		document.getElementById('guide_left').style.left = parseInt(val)+3 + 'px';
	} else {
		guide_R = parseInt(val);
		document.getElementById('guide_right').style.left = parseInt(val)-4 + 'px';
	}
	tvWidth = guide_R - guide_L;

    for (var i in trimBoxList) {
        if (isNaN(i)) continue;
        //左端変更時
        if(Xn==1){
            guide_L = parseInt(val);
			trimBoxList[i].style.left = guide_L + 'px';
            if(widthLock){
				guide_R = guide_L+tvWidth;
				document.getElementById('rangeInput_X2').value = guide_R;
            } else {
				tvWidth = guide_R - guide_L;
                trimBoxList[i].style.width = tvWidth + 'px';
			}
        }
      //右端変更時
        if (Xn == 2) {
            guide_R = parseInt(val);
            if (widthLock) {
                guide_L = guide_R - tvWidth;
                trimBoxList[i].style.left = guide_L + 'px';
                document.getElementById('rangeInput_X1').value = guide_L;
            } else {
                tvWidth = guide_R - guide_L;
				realWidth = tvWidth + guideLeft
                trimBoxList[i].style.width = realWidth + 'px';
            }
        }
	}
}


function rangeYChange(val) {
	for (var i in trimBoxList) {
	    var tboxElem = trimBoxList[i];
	    var origin_Y = parseInt(tboxElem.style.top) + offset_Y;
	    offset_Y = parseInt(val);
	    var topVal = origin_Y - offset_Y;
	    tboxElem.style.top = topVal+'px';
	}
}

function tvHeightChange(val) {
    for (var i in trimBoxList) {
		if (isNaN(i)) break;
		tboxElem = trimBoxList[i]
		var topVal = parseInt(tboxElem.style.top)
        var hChange = parseInt(val - tvHeight) / 2;
        tboxElem.style.height = parseInt(val) + 'px';
        tboxElem.style.top = topVal-hChange + 'px';
    }
    tvHeight = parseInt(val);
}

function paraIntervalChange(val) {
    Para_interval = val;
}
function widthLockChange(elem) {
    if(elem.checked)
        widthLock = true;
    else
        widthLock = false;
    //console.log("widthLock:" + widthLock);
}
 //出力領域クリア
function clean_img() {
    ctx_out.clearRect(0, 0, cWidth, cHeight)
    outParaNum = 1
	title_h = 0
}
 //入力領域クリア
function clean_input() {

	for (var i in trimBoxList) {
		if (isNaN(i)) continue;
		elem = trimBoxList[i];
		elem.parentNode.removeChild(elem);
	}

	for (var i in OCRTextList) {
		if (isNaN(i)) continue;
		elem = OCRTextList[i];
		elem.parentNode.removeChild(elem);
	}

}

//以下、OCR関連
var language = "eng";
var instList = new Array();
var checkedList = new Array();

var worker = new Tesseract.createWorker({
  logger: progressUpdate
});

function instSelect(elem){
	var instNo = elem.value
	var instElem = document.getElementById('instList_'+instNo)

	if(elem.checked && !checkedList.includes(instNo)) {
		var y = parseInt(instElem.style.top) + parseInt(instElem.style.height)/2 - tvHeight/2
		tboxId = 'tbox_instNo_'+ instNo
		drawTrimBox(tboxId,y)
		checkedList.push(instNo)
	}
	if(!elem.checked && checkedList.includes(instNo)){
		index = checkedList.indexOf(instNo)
		checkedList.splice(index,1)
		tboxId = 'tbox_instNo_'+ instNo
		deleTrimBox(tboxId)
	}
}

function getInputCanvas() {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
	var useWidth = img.width * guide_L / vWidth;
    canvas.width = useWidth;
    canvas.height = img.height;
    ctx.drawImage(img,0,0,useWidth,img.height,0,0,useWidth,img.height);
    //document.getElementById('outputDiv').appendChild(canvas);
    return canvas;
}

async function startOCR(){
	var input = getInputCanvas();
	await worker.load();
	await worker.loadLanguage(language);
	await worker.initialize(language);
	await worker.setParameters({
	    tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.{()'
	  });
	const { data } = await worker.recognize(input);
	result(data);
}

function result(res){
	console.log('result was:', res)
	progressUpdate({ status: 'done', data: res })

	//結果配列から単語単位で取り出す
	instList = new Array();
	var index = 0;
	res.words.forEach(function(w){
		var b = w.bbox;
		isWord = w.text.match(/[a-z]/gi);
		if(isWord){
			divbox.id = "instList_" + index
			instList.push(w.text)
			divbox.className = 'OCRText'
			index++

			var imgToView = 1*scale/cvRatio;
			var x =(b.x0)*imgToView
			var y =(b.y0)*imgToView
			var width = (b.x1-b.x0)*imgToView
			var hieght = (b.y1-b.y0)*imgToView

			if(guideLeft<width)
				guideLeft = width

			divbox.draw(x, y, width, hieght)
		}
	})

	if(instList.length > 0){
		resultArea = document.getElementById('result');
		resultArea.innerHTML='認識結果:';
		instList.forEach(
				function (value, index){
				var chkboxstr = '<input type="checkbox" oninput="instSelect(this)" value="' + index + '" id="ckbox_' + index + '">'
				+ '<label>' + value + '</label>';
				resultArea.insertAdjacentHTML('beforeend',chkboxstr);
						}
				);
	}
}

function progressUpdate(packet){
	var statusText = document.getElementById('statusText');
	var progressbar = document.getElementById('progressbar');
	var log = document.getElementById('log');

	statusText.innerHTML = packet.status;
	if('progress' in packet){
		progressbar.value = packet.progress;
	}

/*
	if(packet.status == 'done'){
		var pre = document.createElement('pre')
		pre.appendChild(document.createTextNode(packet.data.text))
		line.innerHTML = ''
		log.appendChild(pre)
	}
*/

}
