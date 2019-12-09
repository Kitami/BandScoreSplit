//Band Score Split.js
//Copyright © 2019 kitami.hibiki. All rights reserved.
const vWidth = 708; //画像表示サイズ幅
const vHeight = 1000; //画像表示サイズ幅
var proportion =Math.SQRT2;
var rate = 1; //画面位置to実際位置座標変換係数
var scale = 1.0 // 拡大率(初期値)

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
let out = document.getElementById('out'); //outエリアcanvas
const ctx_in = cvs.getContext('2d');
const ctx_out = out.getContext('2d');

var rangeInput_X1 = document.getElementById('rangeInput_X1');
var rangeInput_X2 = document.getElementById('rangeInput_X2');
var rangeInput_Y = document.getElementById('rangeInput_Y1');
var trimBoxList = document.getElementsByClassName('trimBox');
var OCRTextList = document.getElementsByClassName('OCRText');
var tboxNum = document.getElementById('trimboxNum'); //トリミング枠数
var selectingID = '';

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
function Input_Clear(){
	clearTrimBox();
	clearOCRTextBox();
	ctx_in.clearRect(0, 0, cvs.width, cvs.height)
	objFile.value = '';
}

window.onload = function() {
	rangeInput_X1.max = vWidth/2;
	rangeInput_X2.min = vWidth/2;
	rangeInput_X2.max = vWidth;

	rangeInput_X1.value = guide_L;
	rangeInput_X2.value = guide_R;

	document.getElementById('tboxX').value = 0;
	document.getElementById('tboxY').value = 0;
	document.getElementById('tvWidth').value = tvWidth;
    document.getElementById('tvHeight').value = tvHeight;
    tboxNum.value = 0;

    document.getElementById('Para_interval').value = Para_interval;
    document.getElementById('title_text').value = 'タイトル';
    load_img('./image/demo.jpg'); //DEBUG用
    //drawTrimBox('tbox_0',vHeight*0.1);
    drawGuideLine('guide_left','v',guide_L + 5);
    drawGuideLine('guide_right','v',guide_R - 5);
}

img.onload = function(_ev) {
    // 画像が読み込まれた
    //scale = cvs.width / img.width;
	scale = 1;
	cvs.width = img.width;
	cvs.height = img.width*proportion;

    draw_canvas();
    // 画像更新
    //console.log("load complete, scaling:"+ scale);
}

function load_img(dataUrl) {
	// 画像の読み込み
	clearOCRTextBox()
	img.src = dataUrl
}

function draw_canvas() {
    // 画像更新
    ctx_in.fillStyle = 'rgb(255, 255, 255)'
    //inエリア背景
    ctx_in.fillRect(0, 0, cvs.width, cvs.height)
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
			if(this.className == 'trimBox') {
				elem.addEventListener('click', selectTrimBox, false);
				elem.addEventListener('mousedown', initMove, false);
			}
			referenceElement = (function(){
				for (e of trimBoxList){
					if(y < parseInt(e.style.top)) return e
				}
			})();
			//document.getElementById('inputDiv').appendChild(elem);
			document.getElementById('inputDiv').insertBefore(elem, referenceElement);
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

 //トリミング領域描画
function drawTrimBox(id,PositionY) {
	divbox.id = id
	divbox.className = 'trimBox'
	divbox.draw(guide_L-guideLeft,PositionY,tvWidth+guideLeft,tvHeight)
	selectingID = id;
	tboxNum.value ++;
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
function deleTrimBox(deleID) {
	if(!deleID)
		deleID = selectingID

	elem = document.getElementById(deleID)
	if(elem){
		elem.parentNode.removeChild(elem)
		tboxNum.value --

		if(selectingID==deleID)
			selectingID = ''
	}
}
function addTrimBox() {
	drawTrimBox('trimBox_'+ tboxNum.value,vHeight*0.1);
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
	const b64 = atob(dataURI.split(',')[1])
	const u8 = Uint8Array.from(b64.split(""), e => e.charCodeAt())
	return new Blob([u8], {type: "image/png"})
}

function download2(dataURI, filename){
	const blob = dataURItoBlob(dataURI)
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.download = filename
	a.href = url
	a.click()

	// ダウンロードの時間がわからないので多めに 最低 3s,  1MiB / sec として
	// 終わった頃に revoke する
	setTimeout(() => {
		URL.revokeObjectURL(url)
	}, Math.max(5000, 1000 * dataURI.length / 1024 * 1024))
}

 //画像トリミング
function doTrim() {
	out.width = img.width;
	out.height = img.width*proportion;
	rate = img.width / vWidth; //画面位置to実際位置座標変換係数

    if (outParaNum == 1) {
        // 背景
        ctx_out.fillStyle = 'white';
		//ctx_out.fillStyle = '#f1f1f1' //DEBUG用
        ctx_out.fillRect(0, 0, cvs.width, cvs.height);
        // 表題
        var titleText = document.getElementById('title_text').value;
        if (titleText.length > 0) {
            ctx_out.font = cvs.width / 25 + "px serif";
            ctx_out.fillStyle = 'black';
            var textWidth = ctx_out.measureText(titleText).width;
            ctx_out.fillText(titleText, (cvs.width - textWidth) / 2, Top_margin * rate);
            title_h = 20;
		} else {
			title_h = 0;
		}
    }

    for (var elem of trimBoxList) {
        //console.log("描画回数:" + outParaNum);
        var nextY = paraY1(outParaNum) + tvHeight;
        if (nextY > vHeight) {
            window.alert('ページ末尾に到達しました');
            break;
        }


        //入力部
        sx = parseInt(elem.style.left) * rate;
        sy = parseInt(elem.style.top) * rate;
        sWidth = parseInt(elem.style.width) * rate;
        sHeight = parseInt(elem.style.height) * rate;
        //出力部
        dx = (vWidth-tvWidth-guideLeft) / 2 * rate;
        dy = paraY1(outParaNum) * rate;
        dWidth = sWidth;
        dHeight = sHeight;

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

	for (var elem of trimBoxList) {
        //左端変更時
        if(Xn==1){
            guide_L = parseInt(val);
            elem.style.left = guide_L + 'px';
            if(widthLock){
				guide_R = guide_L+tvWidth;
				document.getElementById('rangeInput_X2').value = guide_R;
            } else {
				tvWidth = guide_R - guide_L;
				elem.style.width = tvWidth + 'px';
				guideLeft = 0;
			}
        }
      //右端変更時
        if (Xn == 2) {
            guide_R = parseInt(val);
            if (widthLock) {
                guide_L = guide_R - tvWidth;
                elem.style.left = guide_L + 'px';
                document.getElementById('rangeInput_X1').value = guide_L;
            } else {
                tvWidth = guide_R - guide_L;
				realWidth = tvWidth + guideLeft
				elem.style.width = realWidth + 'px';
            }
        }
	}
}


function rangeYChange(val) {
	trimBoxList_now = document.querySelectorAll('.trimBox');
	for (var elem of trimBoxList_now) {
		// console.log("tboxElem:"+ elem.id);
	    var origin_Y = parseInt(elem.style.top) + offset_Y;
	    var topVal = origin_Y - parseInt(val);
	    elem.style.top = topVal + 'px';
	}
	offset_Y = parseInt(val);
}

function tvHeightChange(val) {
	trimBoxList_now = document.querySelectorAll('.trimBox');
	for (var elem of trimBoxList_now) {
		var topVal = parseInt(elem.style.top)
        var hChange = parseInt(val - tvHeight) / 2;
		elem.style.height = parseInt(val) + 'px';
		elem.style.top = topVal-hChange + 'px';
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
    ctx_out.clearRect(0, 0, out.width, out.height)
    outParaNum = 1
	title_h = 0
}
 //トリミング枠全削除
function clearTrimBox() {
	trimBoxList_now = document.querySelectorAll('.trimBox');
	for (var elem of trimBoxList_now) {
		elem.parentNode.removeChild(elem);
	}
	tboxNum.value = 0;


}
//OCR識別枠全削除
function clearOCRTextBox() {
	resultArea.innerHTML='認識結果:';
	OCRTextList_now = document.querySelectorAll('.OCRText');
	for (var elem of OCRTextList_now) {
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
		tboxId = 'trimBox_instNo_'+ instNo
		drawTrimBox(tboxId,y)
		checkedList.push(instNo)
	}
	if(!elem.checked && checkedList.includes(instNo)){
		index = checkedList.indexOf(instNo)
		checkedList.splice(index,1)
		tboxId = 'trimBox_instNo_'+ instNo
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
	//譜表領域検出
	//await lineDetectLSD();

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
function fixWord(text){
	var fix = text
	switch(text) {
		case 'Yo': fix = 'Vo';
		case 'Yo.': fix = 'Vo.';
	}
	return fix;
}
resultArea = document.getElementById('result');
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
			instList.push(fixWord(w.text))
			divbox.className = 'OCRText'
			index++

			imgToView = vWidth/img.width;
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

//以下傾き補正関連
//radian = degree * ( Math.PI / 180 ) 計算用係数
const TO_RADIANS = Math.PI/180;
/**
 * 回転させた画像を表示する
 * @param {object} image - Imageオブジェクト
 * @param {number} x - 画像の中心となるX座標
 * @param {number} y - 画像の中心となるY座標
 * @param {number} angle - 回転する角度[度]
 */
const drawRotatedImage = (image, x, y, angle) => {
    // コンテキストを保存する
    context.save();
    // 回転の中心に原点を移動する
    context.translate(x, y);
    // canvasを回転する
    context.rotate(angle * TO_RADIANS);
    // 画像サイズの半分だけずらして画像を描画する
    context.drawImage(image, -(image.width/2), -(image.height/2));
    // コンテキストを元に戻す
    context.restore();
}

function getInputCanvas2() {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.id
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img,0,0,img.width,img.height);
    //document.getElementById('outputDiv').appendChild(canvas);
    return canvas;
}
var LinesArray = new Array();
//openCV
function lineDetect(){
	progressUpdate({status: '譜表領域検出'});

	let src = cv.imread(getInputCanvas2());
	let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
	let lines = new cv.Mat();
	let color = new cv.Scalar(255, 0, 0);
	cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
	//cv.threshold(src, dst, 177, 200, cv.THRESH_BINARY);
	//cv.imshow('out', dst);
	cv.Canny(src, src, 50, 200, 3);
	//HoughLinesP
	rho = 2 * parseInt(img.width / vWidth);
	theta = Math.PI / 180;
	threshold = parseInt(img.width / 10);
	minLineLength = parseInt(img.width / 10);
	maxLineGap = parseInt(img.width / 200);
	cv.HoughLinesP(src, lines, rho, theta, threshold, minLineLength, maxLineGap);
	// draw lines
	for (let i = 0; i < lines.rows; ++i) {
	    let startPoint = new cv.Point(lines.data32S[i * 4], lines.data32S[i * 4 + 1]);
	    let endPoint = new cv.Point(lines.data32S[i * 4 + 2], lines.data32S[i * 4 + 3]);
	    var angle = Math.atan2( endPoint.y - startPoint.y, endPoint.x - startPoint.x ) ;
	    LinesArray.push({"startPoint":startPoint,"endPoint":endPoint,"angle":angle});
	    cv.line(dst, startPoint, endPoint, color);
	}
	findLeftStart();

	cv.imshow('out', dst);
	src.delete();
	dst.delete();
	lines.delete();
}

//import LSD from './lsd.js';
function lineDetectLSD(){
	//譜表領域検出 LSD方式
	progressUpdate({status: '譜表領域検出'});

	let canvas = getInputCanvas2();
	let src = cv.imread(canvas);
	cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
	var context = canvas.getContext('2d');
	 const imageData = context.getImageData(0, 0, img.width, img.height);
	 const detector = new LSD();
	 const lines = detector.detect(imageData);
	 console.log('lines: ' + lines.length.toString());

	// draw lines
	for (var L of lines) {
	    var startPoint = {'x':Math.floor(L.x1), 'y':Math.floor(L.y1)};
	    var endPoint = {'x':Math.floor(L.x2), 'y':Math.floor(L.y2)};
	    var angle = Math.atan2( endPoint.y - startPoint.y, endPoint.x - startPoint.x ) ;
	    var distance = Math.sqrt( Math.pow( L.x2-L.x1, 2 ) + Math.pow( L.y2-L.y1, 2 ) ) ;
	    LinesArray.push({"startPoint":startPoint,"endPoint":endPoint,"angle":angle,'distance':distance});
	}
	findLeftStart();
	out.width = img.width;
	out.height = img.height;
	//detector.drawSegments(ctx_out, lines);
}

function isHLine(angle){
	return (-0.1 < angle && angle < 0.1)
}
function isVLine(angle){
	return (1.5 < angle && angle < 1.6)
}

function findLeftStart() {
	var x1_Array = new Array();
	var x2_Array = new Array();
	var center = img.width / 2;
	var center_v = img.height / 2;

	var hMap_Array = new Array(); //横線Map
	var hMap_Array_B = new Array(); //横線Map 下部
	var vMap_Array = new Array(); //縦線Map
	var vMap_Array_R = new Array(); //縦線Map 右部
	var sumAngle=0;
	var sumAngleL=0;

	for (L of LinesArray){
		if(L.distance > img.width/100+10){
		if(isHLine(L.angle)){
			//横線端点検出方式
			/*
			var s = L.startPoint.x
			var e = L.endPoint.x
			if( s < center ) x1_Array.push(s)
			if( e > center ) x2_Array.push(e)
			*/
			//横線合計長さ集計
			var y = L.startPoint.y
			var d = parseInt(L.distance)

			if(d>=img.width*0.3){
				sumAngle = sumAngle + L.angle;
				sumAngleL++;
			}

			if(y < center_v) {  //上側
				if(hMap_Array[y])
					hMap_Array[y] += d;
				else
					hMap_Array[y] = d;
			}
			if(y > center_v) {  //下側
				if(hMap_Array_B[y])
					hMap_Array_B[y] += d;
				else
					hMap_Array_B[y] = d;
			}
		} else if (isVLine(L.angle)){
				//縦線合計長さ集計
				var x = L.startPoint.x
				var d = parseInt(L.distance)
				if(x < center) {  //左側
					if(vMap_Array[x])
						vMap_Array[x] += d;
					else
						vMap_Array[x] = d;
				}
				if(x > center) {  //右側
					if(vMap_Array_R[x])
						vMap_Array_R[x] += d;
					else
						vMap_Array_R[x] = d;
				}
			}

		}
	}
	var vAngle = sumAngle / sumAngleL;
	console.log('横線平均角度 :', vAngle);
    //mathematics = new Mathematics();
	//var left = Math.min.apply(null, mathematics.mode(x1_Array));
	//var right = Math.max.apply(null, mathematics.mode(x2_Array));
	var threshold = img.height*0.3

	var left = maxIndex(vMap_Array)
	var right = maxIndex(vMap_Array_R)
	var top_v = findEdge(hMap_Array,1,center_v,threshold)
	var bot_v = findEdge(hMap_Array_B,img.height,center_v,threshold)

	//console.log('LinesArray was:', LinesArray)
	console.log('上側横線Map :', hMap_Array);
	console.log('縦線Map :', vMap_Array);
	//console.log('縦線Map2 :', vMap_Array_R);
	console.log('左側縦線Map最大値 :', left)
	console.log('右側縦線Map最大値 :', right)
	console.log('上側横線Map最大値 :', top_v)
	console.log('下側横線Map最大値 :', bot_v)

    imgToView = vWidth/img.width;
	rangeInput_X1.value = left*imgToView-3
	rangeInput_X2.value = right*imgToView + 5
	rangeXChange(1,rangeInput_X1.value)
	rangeXChange(2,rangeInput_X2.value)
	divbox.id = 'edgeBox';
	divbox.className = 'edgeBox';
	progressUpdate({status: '譜表領域検出完了'});
	//divbox.draw(rangeInput_X1.value,top_v*imgToView,(right-left)*imgToView,(bot_v-top_v)*imgToView)
}
function maxIndex(a) {
	let index = 0
	let value = -Infinity
	for (i in a) {
		if (value < a[i]) {	value = a[i]; index = i	}
	}
	return index
}
function findEdge(a,From,To,threshold) {
	let index = 0
	if(From<To){
		for (var i=From;i<To;i++) {
			if (a[i] && a[i]>threshold) {index = i;break;}
		}
	} else {
		for (var i=From;i>To;i--) {
			if (a[i] && a[i]>threshold) {index = i;break;}
		}
	}
	return index
}
