//Band Score Split.js
//Copyright © 2019 kitami.hibiki. All rights reserved.
"use strict";
const VISIBLE_WIDTH = 708; //画像表示サイズ幅
const VISIBLE_HEIGHT = 1000; //画像表示サイズ幅
const ASPECT_R =Math.SQRT2; //出力用紙アスペクト比
var guide_L = VISIBLE_WIDTH * 0.05; //左側ガイド線位置(初期値)
var guide_R = VISIBLE_WIDTH - guide_L; //右側ガイド線位置(初期値)
var trim_H = VISIBLE_HEIGHT * 0.1; //トリミング枠縦幅(初期値)
var trim_W = guide_R - guide_L; //ガイド線間距離(初期値)
var offset_Y = 0;
var offset_X = 0;
var leftSpace = 10; //ガイド線左側のスペース
var Top_margin = VISIBLE_HEIGHT * 0.05; //描画開始位置X（上部余白）
var title_h = 0;
var Para_interval = 15; //段落間隔
var ParaNo = 1; //出力領域段落カウント
var selectingID = '';
var tiltCorrected = false;

var worker;
const cvs = document.getElementById('in'); //inエリアcanvas
const out = document.getElementById('out'); //outエリアcanvas
const in_ctx = cvs.getContext('2d');
const out_ctx = out.getContext('2d');
const rangeInput_L = document.getElementById('rangeInput_L');
const rangeInput_R = document.getElementById('rangeInput_R');
const trimBoxList = document.getElementsByClassName('trimBox');
const OCRTextList = document.getElementsByClassName('OCRText');
const tboxNum = document.getElementById('trimboxNum'); //トリミング枠数
const FileName = document.getElementById('FileName');
const Tilt_Correction = document.getElementById('Tilt_Correction');

//File input
var reader;
var file;
var fileNo = 0;
var objFile = document.getElementById("selectFile");
const img = new Image();

objFile.addEventListener("change", function(evt) {
	if(evt){
		file = evt.target.files;
		fileNo = 0;
		reader = new FileReader();
		reader.readAsDataURL(file[0]);
		reader.onload = function() {
			Load_Image(reader.result);
		};
	}
}, false);

function Load_Image(dataUrl) {
	// 画像の読み込み
	clearOCRTextBox();
	img.src = dataUrl;
	tiltCorrected = false;
}

img.onload = function(_ev) {
    // 画像が読み込まれた
	if(file.length>1)
		FileName.innerHTML=file[fileNo].name+' ('+(fileNo+1)+' / '+file.length+')';
	cvs.width = img.width;
	cvs.height = img.width*ASPECT_R;
    in_ctx.fillStyle = 'white';
    in_ctx.fillRect(0, 0, cvs.width, cvs.height);
    in_ctx.drawImage(img,0,0,img.width,img.height);
}

function Load_Pre() {
    if (fileNo > 0) {
        fileNo--;
        reader.readAsDataURL(file[fileNo]);
    }
}
function Load_Next() {
    if (fileNo < file.length-1) {
        fileNo++;
        reader.readAsDataURL(file[fileNo]);
    }
}
function Input_Clear(){
	clearTrimBox();
	clearOCRTextBox();
	in_ctx.clearRect(0, 0, cvs.width, cvs.height);
	removeTrimBox('edgeBox');
	objFile.value = '';
	FileName.innerHTML = '';
	tiltCorrected = false;
	Tilt_Correction.value = '';
}

window.onload = function() {
	rangeInput_L.max = parseInt(VISIBLE_WIDTH/2)-5;
	rangeInput_R.min = parseInt(VISIBLE_WIDTH/2)+4;
	rangeInput_R.max = VISIBLE_WIDTH-6;
	rangeInput_L.value = guide_L+5;
	rangeInput_R.value = guide_R-4;
    tboxNum.value = 0;

	document.getElementById('tboxX').value = 0;
	document.getElementById('tboxY').value = 0;
	document.getElementById('trim_W').value = trim_W;
    document.getElementById('trim_H').value = trim_H;
    document.getElementById('Para_interval').value = Para_interval;
    document.getElementById('title_text').value = 'タイトル';
    drawGuideLine('guide_left','v',guide_L + 5);
    drawGuideLine('guide_right','v',guide_R - 5);
    //Load_Image('./image/demo.jpg'); //DEBUG用
}

var divbox = {
	className : 'divbox',
	selectable : false ,
	id : '',
	draw: function(x,y,width,height) {
	var elem = document.createElement('div');
			elem.className = this.className;
			elem.style.left = x + 'px';
			elem.style.top = y + 'px';
			elem.style.width = width + 'px';
			elem.style.height = height + 'px';

			if(this.id !='') elem.id = this.id;

			if(this.className == '')
				elem.style.border = this.borderWidth+'px solid '+this.borderColor;

			if(this.className == 'trimBox') {
				elem.addEventListener('click', selectTrimBox, false);
				elem.addEventListener('mousedown', initMove, false);
				var referenceElement = (function(){
					//for (e of trimBoxList){ if(y < parseInt(e.style.top)) return e } })();
					for (var i=0;i<trimBoxList.length;i++){var e=trimBoxList[i]; if(y<parseInt(e.style.top)) return e; } })();
				document.getElementById('inputDiv').insertBefore(elem, referenceElement);
			} else {
				document.getElementById('inputDiv').appendChild(elem);
			}
	}
}

function selectTrimBox(e) {
	console.log("selectTrimBox:"+ e.target.id);
	//前選択した要素のclassを解除
	if(selectingID != undefined && selectingID != ''){
		var selectedElem = document.getElementById(selectingID);
		var hasPre = false;

		if(selectedElem != undefined)
			hasPre = selectedElem.classList.contains('selecting');

		if(hasPre)
			selectedElem.classList.remove('selecting');
	}
	//現在選択した要素のclassを追加
	selectingID = e.target.id;
	document.getElementById(selectingID).classList.add('selecting');
}

var moveElem;
var move_start_y;
function initMove(e) {
   move_start_y = e.clientY;
   moveElem = event.target;
   window.addEventListener('mousemove', move, false);
   window.addEventListener('mouseup', stopMove, false);
}
function move(e) {
	var topVal = parseInt(moveElem.style.top);
	var moveLength = Math.round(e.clientY - move_start_y);
	moveElem.style.top = (parseInt(topVal) + moveLength) + "px";
	move_start_y = e.clientY;
}
function stopMove(e) {
    window.removeEventListener('mousemove', move, false);
    window.removeEventListener('mouseup', stopMove, false);
}

//guide_L.addEventListener('mousedown', initMove, false);
//guide_R.addEventListener('mousedown', initMove, false);

 //トリミング領域描画
function drawTrimBox(id,PositionY) {
	divbox.id = id;
	divbox.className = 'trimBox';
	divbox.draw(guide_L-leftSpace,PositionY,trim_W+leftSpace,trim_H);
	selectingID = id;
	tboxNum.value ++;
}

//ガイド線描画
function drawGuideLine(id,type,positon) {
	divbox.className = 'guide ' + type;
	divbox.id = id;
	if (type == 'h')
		divbox.draw(0,positon,VISIBLE_WIDTH,0);
	else
		divbox.draw(positon,0,0,VISIBLE_HEIGHT);
}

 //トリミング領域削除
function removeTrimBox(elemID) {
	if(!elemID)
		elemID = selectingID;
	var elem = document.getElementById(elemID);
	if(elem){
		elem.parentNode.removeChild(elem);
		if(tboxNum.value>0)
			tboxNum.value--;
		if(selectingID==elemID)
			selectingID = '';
	}
}
//トリミング領域追加
function addTrimBox() {
	drawTrimBox('trimBox_'+ tboxNum.value,VISIBLE_HEIGHT*0.1);
}

 //画像出力
function download() {
    var filename = 'download.png';
    var downloadLink = document.getElementById('hiddenLink');

    if (out.msToBlob) {
        var blob = out.msToBlob();
        window.navigator.msSaveBlob(blob, filename);
    } else {
		//downloadLink.href = out.toDataURL('image/png');
		dataURI = out.toDataURL('image/png');
		download2(dataURI,filename);
        //downloadLink.download = filename;
        //downloadLink.click();
    }
}

function dataURItoBlob(dataURI) {
	const b64 = atob(dataURI.split(',')[1]);
	const u8 = Uint8Array.from(b64.split(""), function (e){e.charCodeAt()});
	return new Blob([u8], {type: "image/png"});
}
function download2(dataURI, filename){
	const blob = dataURItoBlob(dataURI);
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.download = filename;
	a.href = url;
	a.click();
	// ダウンロードの時間がわからないので多めに 最低 3s,  1MiB / sec として
	// 終わった頃に revoke する
	setTimeout(function (){
		URL.revokeObjectURL(url);
	}, Math.max(5000, 1000 * dataURI.length / 1024 * 1024));
}

 //画像トリミング
var ParaList = new Array();
function doTrim() {
	var rate = img.width / VISIBLE_WIDTH; //画面位置to入力画像位置変換係数
    if (ParaNo == 1) {
		out.width = img.width;
		out.height = img.width*ASPECT_R;
        // 背景
        out_ctx.fillStyle = 'white';  //DEBUG用 '#f1f1f1'
        out_ctx.fillRect(0, 0, cvs.width, cvs.height);
        // 表題
        var titleText = document.getElementById('title_text').value;
        if (titleText.length > 0) {
            out_ctx.font = cvs.width / 25 + "px serif";
            out_ctx.fillStyle = 'black';
            var textWidth = out_ctx.measureText(titleText).width;
            var textHeight = out_ctx.measureText(titleText).height;
            out_ctx.fillText(titleText, (cvs.width - textWidth) / 2, Top_margin * rate);
            title_h = 20;
		} else title_h = 0;
    }

	var rate_out = out.width / VISIBLE_WIDTH; //画面位置to出力位置変換係数
	var trimBoxList_now = document.querySelectorAll('.trimBox');
	var trimBoxListArray = Array.from( trimBoxList_now ) ;// 配列に変換
	trimBoxListArray.sort(function (a,b){ return parseInt(a.style.top) - parseInt(b.style.top); })

    //for (var elem of trimBoxList) {
	for (var i=0;i<trimBoxListArray.length;i++){ var elem = trimBoxListArray[i];
        //console.log("描画回数:" + ParaNo);
        var paraStart = paraStartPosition(ParaNo) + trim_H;
        if (paraStart > VISIBLE_HEIGHT) {
            window.alert('ページ末尾に到達しました');
            break;
        }

        //入力部
        var sx = parseInt(elem.style.left) * rate;
        var sy = parseInt(elem.style.top) * rate;
        var sWidth = parseInt(elem.style.width) * rate;
        var sHeight = parseInt(elem.style.height) * rate;
        //出力部
        var dx = (VISIBLE_WIDTH-trim_W-leftSpace) / 2 * rate_out;
        var dy = paraStartPosition(ParaNo) * rate_out;
        var dWidth = sWidth;
        var dHeight = sHeight;

        out_ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        var drawArea = {x:dx,y:dy,w:dWidth,h:dHeight};
        ParaList.push(drawArea);
        ParaNo++;
    }
}

function cancel(){
    if(ParaList.length>0){
    	var a = ParaList.pop();
    	out_ctx.clearRect(a.x, a.y, a.w, a.h);
    	ParaNo--;
    }
}

 //n段目から描画位置Y1を計算
function paraStartPosition(n) {
        return Top_margin + title_h + (n-1)*Para_interval + (n-1) * trim_H;
}

function rangeXChange(n,val) {
	if(n==1){
		guide_L = parseInt(val);
		document.getElementById('guide_left').style.left = parseInt(val)+ 'px';
	} else {
		guide_R = parseInt(val);
		document.getElementById('guide_right').style.left = parseInt(val)+ 'px';
	}
	trim_W = guide_R - guide_L;

	//for (var elem of trimBoxList) {
	if(trimBoxList.length>0)
	for (var i=0;i<trimBoxList.length;i++){ var elem = trimBoxList[i];
        if(n==1){ //左端変更時
            guide_L = parseInt(val);
            elem.style.left = (guide_L - leftSpace) + 'px';
			trim_W = guide_R - guide_L + leftSpace;
			elem.style.width = trim_W + 'px';
			//leftSpace = 0;
		} else { //右端変更時
            guide_R = parseInt(val);
            trim_W = guide_R - guide_L;
			var realWidth = trim_W + leftSpace
			elem.style.width = realWidth + 'px';
		}
	}
}

function rangeYChange(val) {
	var trimBoxList_now = document.querySelectorAll('.trimBox');
	//for (var elem of trimBoxList_now) {
	for (var i=0;i<trimBoxList.length;i++){ var elem = trimBoxList[i];
		// console.log("tboxElem:"+ elem.id);
	    var origin_Y = parseInt(elem.style.top) + offset_Y;
	    var topVal = origin_Y - parseInt(val);
	    elem.style.top = topVal + 'px';
	}
	offset_Y = parseInt(val);
}

function tvHeightChange(val) {
	var trimBoxList_now = document.querySelectorAll('.trimBox');
	//for (var elem of trimBoxList_now) {
	for (var i=0;i<trimBoxList_now.length;i++){ var elem = trimBoxList_now[i];
		var topVal = parseInt(elem.style.top)
        var hChange = parseInt(val - trim_H) / 2;
		elem.style.height = parseInt(val) + 'px';
		elem.style.top = topVal-hChange + 'px';
	}
    trim_H = parseInt(val);
}


function paraIntervalChange(val) {

	Para_interval = parseInt(val);

	clean_img();
	doTrim();
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
    out_ctx.clearRect(0, 0, out.width, out.height)
    ParaNo = 1
	title_h = 0
}
 //トリミング枠全削除
function clearTrimBox() {
	removeByClassName('trimBox');
	tboxNum.value = 0;
}
//OCR識別枠全削除
function clearOCRTextBox() {
	resultArea.innerHTML='認識結果:';
	removeByClassName('OCRText');
	removeByClassName('edgeBox');
}

//ClassNameで要素削除
function removeByClassName(ClassName) {
	var elemList = document.querySelectorAll('.'+ClassName);
	for (var i=0;i < elemList.length; i++){
		var elem = elemList[i];
		elem.parentNode.removeChild(elem);
	}
}

//以下、OCR関連
var language = "eng";
var instList = new Array();
var checkedList = new Array();
var LinesArray = new Array();
const resultArea = document.getElementById('result');

function instSelect(elem){
	var instNo = elem.value
	var instElem = document.getElementById('instList_'+instNo)

	if(elem.checked && !checkedList.includes(instNo)) {
		var y = parseInt(instElem.style.top) + parseInt(instElem.style.height)/2 - trim_H/2
		var tboxId = 'trimBox_instNo_'+ instNo
		drawTrimBox(tboxId,y)
		checkedList.push(instNo)
	}
	if(!elem.checked && checkedList.includes(instNo)){
		var index = checkedList.indexOf(instNo)
		checkedList.splice(index,1)
		var tboxId = 'trimBox_instNo_'+ instNo
		removeTrimBox(tboxId)
	}
}

function getInputCanvas() {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
	var useWidth = img.width * guide_L / VISIBLE_WIDTH;
    canvas.width = useWidth;
    canvas.height = img.height;
    ctx.drawImage(img,0,0,useWidth,img.height,0,0,useWidth,img.height);
    //document.getElementById('outputDiv').appendChild(canvas);
    return canvas;
}

function result(res){
	console.log('result was:', res);
	progressUpdate({ status: 'done', data: res });

	//結果配列から単語単位で取り出す
	instList = new Array();
	var index = 0;
	res.words.forEach(function(w){
		var b = w.bbox;
		var isWord = w.text.match(/[a-z]/gi);
		if(isWord){
			divbox.id = "instList_" + index
			instList.push(fixWord(w.text))
			divbox.className = 'OCRText'
			index++;

			var imgToView = VISIBLE_WIDTH/img.width;
			var x =(b.x0)*imgToView
			var y =(b.y0)*imgToView
			var width = (b.x1-b.x0)*imgToView
			var hieght = (b.y1-b.y0)*imgToView

			if(leftSpace<width)
				leftSpace = width

			divbox.draw(x, y, width, hieght)
		}
	})

	if(instList.length > 0){
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

/*
 * 以下傾き補正関連
 */
var horizontal_lines = new Array();
const TO_DEG = 1/Math.PI*180; //計算用係数
const TO_RAD = Math.PI/180; //計算用係数

function getInputCanvas2() {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    if(tiltCorrected){
    	var Ratio = VISIBLE_WIDTH / cvs.width;
	    canvas.width = cvs.width*Ratio;
	    canvas.height = cvs.height*Ratio;
	    ctx.drawImage(cvs,0,0,cvs.width,cvs.height,0,0,cvs.width*Ratio,cvs.height*Ratio);
    }else{
        var Ratio = VISIBLE_WIDTH / img.width;
	    canvas.width = img.width*Ratio;
	    canvas.height = img.height*Ratio;
	    ctx.drawImage(img,0,0,img.width,img.height,0,0,img.width*Ratio,img.height*Ratio);
    }
    //document.getElementById('outputDiv').appendChild(canvas);
    return canvas;
}

//openCV HoughLinesP
function lineDetect(){
	progressUpdate({status: '譜表領域検出'});
	let src = cv.imread(getInputCanvas2());
	let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
	let lines = new cv.Mat();
	let color = new cv.Scalar(255, 0, 0);
	cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
	cv.Canny(src, src, 50, 200, 3);

	//HoughLinesP
	rho = 2 * parseInt(img.width / VISIBLE_WIDTH);
	theta = Math.PI / 180;
	threshold = parseInt(img.width / 10);
	minLineLength = parseInt(img.width / 10);
	maxLineGap = parseInt(img.width / 200);
	cv.HoughLinesP(src, lines, rho, theta, threshold, minLineLength, maxLineGap);

	// draw lines
	LinesArray = new Array();
	for (var i = 0; i < lines.rows; ++i) {
	    let startPoint = new cv.Point(lines.data32S[i * 4], lines.data32S[i * 4 + 1]);
	    let endPoint = new cv.Point(lines.data32S[i * 4 + 2], lines.data32S[i * 4 + 3]);
	    var angle = Math.atan2( endPoint.y - startPoint.y, endPoint.x - startPoint.x ) ;
	    LinesArray.push({"startPoint":startPoint,"endPoint":endPoint,"angle":angle});
	    cv.line(dst, startPoint, endPoint, color);
	}
	blockAnalysis();
	cv.imshow('out', dst);
	//src.delete();
	//dst.delete();
	//lines.delete();
}

//譜表領域検出 LSD方式
function lineDetectLSD(){
	progressUpdate({status: '譜表領域検出'});

	let canvas = getInputCanvas2();
	let src = cv.imread(canvas);
	cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
	var context = canvas.getContext('2d');
	 const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
	 const detector = new LSD();
	 const lines = detector.detect(imageData);
	 console.log('lines: ' + lines.length.toString());

	// draw lines
	LinesArray = new Array();
	//for (var L of lines) {
	for (var i in lines) {var L = lines[i];
	    var startPoint = {'x':Math.floor(L.x1), 'y':Math.floor(L.y1)};
	    var endPoint = {'x':Math.floor(L.x2), 'y':Math.floor(L.y2)};
	    var angle = Math.atan2( endPoint.y - startPoint.y, endPoint.x - startPoint.x ) ;
	    var length = Math.sqrt( Math.pow( L.x2-L.x1, 2 ) + Math.pow( L.y2-L.y1, 2 ) ) ;
	    LinesArray.push({"startPoint":startPoint,"endPoint":endPoint,"angle":angle,'length':length});
	}

	out.width = canvas.width;
	out.height = canvas.height;
	blockAnalysis();
	//detector.drawSegments(out_ctx, lines);
}

const DIFF = 0.055; //傾き許容範囲-約3度
const HORIZON = Math.PI;
const VERTICAL_1 = 90 * TO_RAD;
const VERTICAL_2 = 270 * TO_RAD;

function isHorizon(angle){
	var a = Math.abs(angle);
	return (0 < a && a < DIFF) || (HORIZON-DIFF < a && a < HORIZON+DIFF);
}
function isVertical(angle){
	var a = Math.abs(angle);
	return  (VERTICAL_1-DIFF < a && a < VERTICAL_1+DIFF)
		|| (VERTICAL_2-DIFF < a && a < VERTICAL_2+DIFF);
}

function calcTiltAngle(angle){
	var tiltAngle;
	if (-DIFF < angle && angle < DIFF){
		tiltAngle = 0 + angle;
	} else if (HORIZON-DIFF < angle && angle < HORIZON+DIFF){
		tiltAngle = angle - Math.PI;
	} else if (0-HORIZON-DIFF < angle && angle < DIFF-HORIZON){
		tiltAngle = angle + Math.PI;
	}
	return tiltAngle;
}

function drawLine(x1,y1,x2,y2){
	out_ctx.strokeStyle = 'red';
	out_ctx.beginPath();
	out_ctx.moveTo(x1,y1);
	out_ctx.lineTo(x2,y2);
	out_ctx.stroke();
}

//譜表ブロック解析
function blockAnalysis() {
	var x1_Array = new Array();
	var x2_Array = new Array();
	var center = VISIBLE_WIDTH / 2;
	var center_v = VISIBLE_HEIGHT / 2;

	var hMap_Array = new Array(); //横線Map
	var vMap_Array = new Array(); //縦線Map
	var sumAngle=0;
	var sumAngleN=0;

	//for (L of LinesArray){
	for (var i in LinesArray){var L =  LinesArray[i];
		if(L.length > 0.02*VISIBLE_WIDTH){
		if(isHorizon(L.angle)){

//横線端点検出方式
			/*
			var s = L.startPoint.x
			var e = L.endPoint.x
			if( s < center ) x1_Array.push(s)
			if( e > center ) x2_Array.push(e)
			*/

//合計長さ集計方式
			//横線合計長さ集計
			var y = L.startPoint.y;
			var d = parseInt(L.length);

			//横線傾き角度集計
			if(L.length>0.2*VISIBLE_WIDTH){
				sumAngle = sumAngle + calcTiltAngle(L.angle);
				//drawLine(L.startPoint.x,L.startPoint.y,L.endPoint.x,L.endPoint.y);
				//out_ctx.closePath();
				horizontal_lines.push({'length':L.length,'angle':L.angle,'TiltAngle':calcTiltAngle(L.angle)*TO_DEG});
				sumAngleN++;
			}

				if(hMap_Array[y])
					hMap_Array[y] += d;
				else
					hMap_Array[y] = d;

		} else if (isVertical(L.angle)){
				//縦線合計長さ集計
				var x = L.startPoint.x;
				var d = parseInt(L.length);

					if(vMap_Array[x])
						vMap_Array[x] += d;
					else
						vMap_Array[x] = d;
			}

		}
	}
    //mathematics = new Mathematics();
	//var left = Math.min.apply(null, mathematics.mode(x1_Array));
	//var right = Math.max.apply(null, mathematics.mode(x2_Array));
	var threshold = VISIBLE_HEIGHT*0.3;
	var threshold_H = VISIBLE_WIDTH*0.3;
	var left = findEdge(vMap_Array,0,VISIBLE_WIDTH,threshold);
	var right = findEdge(vMap_Array,VISIBLE_WIDTH,VISIBLE_WIDTH/3,threshold);
	var top_v = findEdge(hMap_Array,1,center_v,threshold_H);
	var bot_v = findEdge(hMap_Array,VISIBLE_HEIGHT,center_v,threshold_H);
	var vAngle_radians = sumAngle / sumAngleN;
	var vAngle_degree = vAngle_radians * TO_DEG;

	console.log('横線平均角度 :', vAngle_degree);
	console.log('横線角度Map :', horizontal_lines);
	console.log('横線Map :', hMap_Array);
	console.log('縦線Map :', vMap_Array);
	console.log('左側縦線Map最大値 :', left);
	console.log('右側縦線Map最大値 :', right);
	console.log('上側横線Map最大値 :', top_v);
	console.log('下側横線Map最大値 :', bot_v);

	Tilt_Correction.value = -vAngle_degree;

	if(Math.abs(vAngle_degree) < 0.4 ) {
		rangeInput_L.value = left;
		rangeInput_R.value = right;
		rangeXChange(1,rangeInput_L.value);
		rangeXChange(2,rangeInput_R.value);
		divbox.className = 'edgeBox';
		divbox.draw(rangeInput_L.value,top_v,(right-left),(bot_v-top_v));
	} else {
		//傾き補正
		rotatImage(-vAngle_radians);
		tiltCorrected = true;
	}

	progressUpdate({status: '譜表領域検出完了'});
}

/**
* 画像を回転
* @param {object} canvas - canvasオブジェクト
* @param {number} angle - 回転する角度[Rad]
*/
function rotatImage(angle) {
	var context = cvs.getContext('2d');
	context.save();
	context.translate(cvs.width/2, cvs.height/2);
	context.rotate(angle);
	context.drawImage(img, -(img.width/2), -(img.height/2));
	context.restore();
}
function rotatImageByDegree(value) {
	rotatImage(value*Math.PI/180);
}

function maxIndex(a,start,end) {
	var index = 0;
	var value = -1;

	var increase = start<end ? 1 : -1 ;
	for (var i=start;!(start<end^i<end);i=i+increase) {
		if (value < a[i]) {	value = a[i]; index = i	}
	}
	return index;
}

function findEdge(a,start,end,threshold) {
	var index = 0;
	var increase = start<end ? 1 : -1 ;
	for (var i=start;!(start<end^i<end);i=i+increase) {
		if (a[i] && a[i]>threshold) {index = i;break;}
	}
	return index;
}

function fixWord(text){
	var fix = text;
	switch(text) {
		case 'Yo': fix = 'Vo';
		case 'Yo.': fix = 'Vo.';
	}
	return fix;
}

//以降、ES2017必須
async function startOCR(){
	//譜表領域検出
	//await lineDetectLSD();


	if(!worker){
		//CDN worker
		worker = new Tesseract.createWorker({
			  logger: progressUpdate
			});

		//Local worker
		/*
	 	const worker = new Tesseract.createWorker({
			workerPath: './file/tesseract/worker.min.js',
			langPath: './file/traineddata/',
			corePath: './file/tesseract/tesseract-core.wasm.js',
			logger: progressUpdate
		});
		*/
	}

	var input = getInputCanvas();
	await worker.load();
	await worker.loadLanguage(language);
	await worker.initialize(language);
	await worker.setParameters({
	    tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.{()'
	  });
	const {data} = await worker.recognize(input);
	result(data);
}
