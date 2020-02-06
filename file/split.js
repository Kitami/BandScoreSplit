//Band Score Split.js
//Copyright © 2019 kitami.hibiki. All rights reserved.
"use strict";
const VISIBLE_WIDTH = 708; //画像表示サイズ幅
const VISIBLE_HEIGHT = 1000; //画像表示サイズ幅
const ASPECT_R =Math.SQRT2; //出力用紙アスペクト比
const PX = 'px';

var Guide_L = VISIBLE_WIDTH * 0.05; //左側ガイド線位置(初期値)
var Guide_R = VISIBLE_WIDTH - Guide_L; //右側ガイド線位置(初期値)
var trim_H = VISIBLE_HEIGHT * 0.1; //トリミング枠縦幅(初期値)
var offset_Y_rem = 0;

var Top_margin = VISIBLE_HEIGHT * 0.05; //描画開始位置X（上部余白）
var Title_h = 0;
var ParaNo = 1; //出力領域段落カウント
var selectingID = '';
var seleTabIndex = 0;
var tiltCorrected = false;

var tboxNum,worker,g_L,g_R;
const cvs = document.getElementById('in'); //inエリアcanvas
const out = document.getElementById('out'); //outエリアcanvas
const in_ctx = cvs.getContext('2d');
const out_ctx = out.getContext('2d');
const rangeInput_L = document.getElementById('rangeInput_L');
const rangeInput_R = document.getElementById('rangeInput_R');
const trimBoxList = document.getElementsByClassName('trimBox');
const OCRTextList = document.getElementsByClassName('OCRText');
const inputFile_nav = document.getElementById('inputFile_nav');
const Tilt_Correction = document.getElementById('Tilt_Correction');
const inputDiv = document.getElementById('inputDiv');
const inputFileInfo = document.getElementById('inputFileInfo');
const outputFileInfo = document.getElementById('outputFileInfo');
const LeftSpace = document.getElementById('LeftSpace');  //譜表左側のスペース
const RightSpace = document.getElementById('RightSpace');  //譜表右側のスペース
const objFile = document.getElementById("selectFile");
const Para_i = document.getElementById('Para_interval'); //段落間隔

const widthLock = document.getElementById('widthLock');
const EdgeDetect = document.getElementById("EdgeDetect");
const searchText = document.getElementById("searchText");
const withOCR = document.getElementById("withOCR");
const offset_Y = document.getElementById("offset_Y");
const autoTrim = document.getElementById("autoTrim");
const TitleText = document.getElementById("titleText");

//File input
var reader,file,
	fileIndex = 0,
	zindexNo = 100,
	fileType = '',fileName = '',
	img = new Image(),
	outFileName = 'download.png';

objFile.addEventListener("change", function(evt) {
	if(evt && evt.target.files){
		file = evt.target.files;
		fileIndex = 0;
		reader = new FileReader();
		zindexNo = file.length;
		clearTab();
		for (var i=0 ;i < file.length; i++){
			fileName = file[i].name;
			fileType = getExt(fileName);
			if (i > 0) addTab();
			var tabElem = inputFile_nav.children[i];
			tabElem.innerHTML= fileName;
		}
		setTabZindex(inputFile_nav.children,0);
		selectTab(inputFile_nav.children[0]);
		reader.onload = function() {
			Load_file(reader.result)
		};
	}
}, false);

async function Load_file(dataUrl) {
	clearOCRTextBox();
	if(fileType=='pdf'){
		if(pdfName == fileName) {
				openPage(pageNo);
			} else {
				//console.log('Load Pdf');
				var typedarray = new Uint8Array(dataUrl); // pdf:arrayBuffer
				pdfjsLib.getDocument(typedarray).then(function (pdf) {
					// do stuff
					console.log('PDFJS load');
					pdfName = fileName;
					pdfDoc = pdf;
					pdfjsLib.disableStream = true;
					var endTabID = "tab_"+fileIndex+"_"+pdf.numPages;
					if(pdf.numPages>1 && !document.getElementById(endTabID)){
						addPdfTabs(fileIndex,pdf.numPages);
					}
					openPage(pageNo);
				});
			}
	} else {
		// 画像の読み込み img.src = dataUrl;
		await LoadImage(dataUrl);
	}
}
function LoadImage(dataUrl) {
    return new Promise((resolve, reject) => {
    	img.src = dataUrl;
    	img.onload = () => {
        	cvs.width = img.width;
        	cvs.height = img.width*ASPECT_R;
        	in_ctx.fillStyle = 'white';
        	in_ctx.fillRect(0, 0, cvs.width, cvs.height);
        	in_ctx.drawImage(img,0,0,img.width,img.height);
        	var fileNo = parseInt(fileIndex) + 1;
        	inputFileInfo.innerHTML= fileNo + ' / ' +file.length+' 解像度: '+img.width+'x'+img.height;
            resolve(img);
        	if(EdgeDetect.checked) {startAutoTrim();}
        }
    })
}
var pdfPages = 0,
	pageNo = 1,
	pageRendering = false,
	pageNumPending = null,
	pdfCanvas,
	scale = 2,
	pdfName = '',pdfDoc = null;
	pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.3.200/pdf.worker.js';

/**
 * Get page info from document, resize canvas accordingly, and render page.
 * @param num Page number.
 */
function openPage(num) {
  pageRendering = true;
  // Using promise to fetch the page
  pdfDoc.getPage(num).then(function(page) {
    var viewport = page.getViewport({scale: scale});
    cvs.height = viewport.height;
    cvs.width = viewport.width;

    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: in_ctx,
      viewport: viewport
    };
    var renderTask = page.render(renderContext);

    // Wait for rendering to finish
    renderTask.promise.then(function() {
      pageRendering = false;
      if (pageNumPending !== null) {
        // New page rendering is pending
        renderPage(pageNumPending);
        pageNumPending = null;
      }
      getPdfCanvas();
  	if(EdgeDetect.checked) {startAutoTrim();}
    });
  });
  // Update page counters
  //document.getElementById('page_num').textContent = num;
  return Promise.resolve(1);
}

function getPdfCanvas() {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = cvs.width;
    canvas.height = cvs.height;
    ctx.drawImage(cvs,0,0);
    pdfCanvas = canvas;
}

function addPdfTabs(TabNo,Pags) {
	var firstPage = inputFile_nav.children[TabNo];
	firstPage.id += "_1";
	firstPage.innerHTML += "_1";

	for (var i = 1 ;i < Pags; i++) {
		var N = i+1;
		var tabID = "tab_"+fileIndex+"_"+N;
		var newPageTab = addTab();
		newPageTab.innerHTML= fileName+"_"+N;
		newPageTab.id = tabID;
	}
	setTabZindex(inputFile_nav.children,0);
	selectTab(inputFile_nav.children[0]);
}

//img.onload = function(_ev) {
//	// 画像が読み込まれた
//	cvs.width = img.width;
//	cvs.height = img.width*ASPECT_R;
//	in_ctx.fillStyle = 'white';
//	in_ctx.fillRect(0, 0, cvs.width, cvs.height);
//	in_ctx.drawImage(img,0,0,img.width,img.height);
//	var fileNo = parseInt(fileIndex) + 1;
//	inputFileInfo.innerHTML= fileNo + ' / ' +file.length+' 解像度: '+img.width+'x'+img.height;
//};

function Load_Pre() {
	var tabList = inputFile_nav.children;
    if (tabList.length > 0 && seleTabIndex - 1>=0) {
        selectTab(inputFile_nav.children[seleTabIndex-1]);
    }
}

function Load_Next() {
	var tabList = inputFile_nav.children;
    if (tabList.length > 0 && seleTabIndex + 1< tabList.length) {
    	return selectTab(inputFile_nav.children[seleTabIndex+1]);
    }
}

window.onload = function() {
	rangeInput_L.max = parseInt(VISIBLE_WIDTH/2)-5;
	rangeInput_R.min = parseInt(VISIBLE_WIDTH/2)+5;
	rangeInput_R.max = VISIBLE_WIDTH-6;
	rangeInput_L.value = Guide_L;
	rangeInput_R.value = Guide_R;
    tboxNum = 0;
    out.width = VISIBLE_WIDTH;
    out.height = VISIBLE_HEIGHT;

    document.getElementById('trim_H').value = trim_H;
    g_L = drawGuideLine('guide_left','v',Guide_L);
    g_R = drawGuideLine('guide_right','v',Guide_R);
    //Load_Image('./img/demo.jpg'); //DEBUG用
}

function drawDivBox(id,className,x,y,width,height) {
		var elem = document.createElement('div');
		if(id) elem.id = id;
		if(className) elem.className = className;

		elem.style.left = x + PX;
		elem.style.top = y + PX;
		elem.style.width = width + PX;
		elem.style.height = height + PX;

		if(className == 'trimBox') {
			elem.addEventListener('click', selectTrimBox, false);
			elem.addEventListener('mousedown', initMove, false);
			elem.addEventListener('touchstart', initMove, false);
			elem.addEventListener('touchend', selectTrimBox, false);
			var referenceElement = (function(){
			//for (e of trimBoxList){ if(y < parseInt(e.style.top)) return e } })();
			for (var i=0;i<trimBoxList.length;i++){var e=trimBoxList[i]; if(y<parseInt(e.style.top)) return e; } })();
			document.getElementById('inputDiv').insertBefore(elem, referenceElement);
		} else {
			document.getElementById('inputDiv').appendChild(elem);
		}
		return elem;
}

function selectTrimBox(e) {
	console.log("selectTrimBox:"+ e.target.id);
	//前選択した要素のclassを解除
	if(selectingID){
		var selectedElem = document.getElementById(selectingID);
		if(selectedElem && selectedElem.classList.contains('selecting')){
			selectedElem.classList.remove('selecting');
		}
	}
	//現在選択した要素のclassを追加
	selectingID = e.target.id;
	document.getElementById(selectingID).classList.add('selecting');
}

var moveElem,move_start_y;
function initMove(e) {
   move_start_y = e.clientY;
   moveElem = event.target;

   if(e.type=='touchstart'){
	   //モバイル対応
	   event.preventDefault();
	   var touchObject = e.changedTouches[0] ;
	   move_start_y = touchObject.pageY;
	   window.addEventListener('touchmove', move, false);
	   window.addEventListener('touchend', stopMove, false);
   }else{
	   window.addEventListener('mousemove', move, false);
	   window.addEventListener('mouseup', stopMove, false);
   }
}
function move(e) {
	var topVal = parseInt(moveElem.style.top);
	var moveLength = Math.round(e.clientY - move_start_y);
	if(e.type=='touchmove'){
		event.preventDefault();
		var touchObject = e.changedTouches[0] ;
		moveLength = Math.round(touchObject.pageY - move_start_y);
	}

	moveElem.style.top = (parseInt(topVal) + moveLength) + "px";

	if (e.type=='touchmove')
	    move_start_y = touchObject.pageY;
	else
	    move_start_y = e.clientY;
}
function stopMove(e) {
    if(e.type=='touchend'){
		//モバイル対応
		window.removeEventListener('touchmove', move, false);
		window.removeEventListener('touchend', stopMove, false);
    }else{
        window.removeEventListener('mousemove', move, false);
        window.removeEventListener('mouseup', stopMove, false);
    }
}

//g_L.addEventListener('mousedown', initMove, false);
//g_R.addEventListener('mousedown', initMove, false);

//トリミング領域追加
function addTrimBox() {
	drawTrimBox('trimBox_'+ tboxNum,	inputDiv.scrollTop);
}
 //トリミング領域描画
function drawTrimBox(id,top) {
	var L = parseFloat(g_L.style.left);
	var R = parseFloat(g_R.style.left);
	var left = L - LeftSpace.valueAsNumber;
	var width =  R - L + LeftSpace.valueAsNumber + RightSpace.valueAsNumber;
	drawDivBox(id,'trimBox',left,top,width,trim_H);
	selectingID = id;
	tboxNum ++;
}

//ガイド線描画
function drawGuideLine(id,type,positon) {
	var className = 'guide ' + type;
	if (type == 'h')
		return drawDivBox(id,className,0,positon,VISIBLE_WIDTH,0);
	else
		return drawDivBox(id,className,positon,0,0,VISIBLE_HEIGHT);
}

 //トリミング領域削除
function removeTrimBox(elemID) {
	if(!elemID)
		elemID = selectingID;
	var elem = document.getElementById(elemID);
	if(elem){
		elem.parentNode.removeChild(elem);
		if(tboxNum>0)
			tboxNum--;
		if(selectingID==elemID)
			selectingID = '';
	}
}
//出力領域初期化
function drawInit(){
	out.width = cvs.width;
	out.height = cvs.width*ASPECT_R;
    // 背景
    out_ctx.fillStyle = 'white';  //DEBUG用 '#f1f1f1'
    out_ctx.fillRect(0, 0, cvs.width, cvs.height);
}
//タイトル書込み
function drawTitle(){
	var titleText = TitleText.value;
	var toOrigin = out.width / VISIBLE_WIDTH;
	var clearHeight = Top_margin + Title_h + Para_i.valueAsNumber;
	if (titleText.length > 0) {
		var font_size = out.width / 25;
		out_ctx.font = font_size + "px serif";
        out_ctx.fillStyle = 'black';
		var textWidth = out_ctx.measureText(titleText).width;
		var textHeight = textWidth/titleText.length;
		var x = (out.width - textWidth)/2;
		var y = Top_margin * toOrigin;
        out_ctx.clearRect(0,0,out.width,clearHeight);
        out_ctx.fillText(titleText,x,y);
        Title_h = textHeight*0.5;
	} else  {
		out_ctx.clearRect(0,0,out.width,clearHeight);
	}
}
 //画像トリミング
var ParaList = new Array();
async function doTrim() {
	var toOrigin = cvs.width / VISIBLE_WIDTH; //画面位置to出力位置変換係数

    if (ParaNo == 1) {
    	drawInit();// 初期化
    	drawTitle();// 表題
    }

	var trimBoxList_now = document.querySelectorAll('.trimBox');
	var trimBoxListArray = Array.from( trimBoxList_now ) ;// 配列に変換
	trimBoxListArray.sort(function (a,b){ return parseInt(a.style.top) - parseInt(b.style.top); })

    //for (var elem of trimBoxList) {
	for (var i=0;i<trimBoxListArray.length;i++){
		var elem = trimBoxListArray[i];
        var paraStart = getParaTop(ParaNo) + trim_H;

        if (paraStart > VISIBLE_HEIGHT) {
            if(!autoTrim.checked){
            	window.alert('ページ末尾に到達しました');
            	break;
            } else {
            	await download();
            	clean_img();
            	TitleText.value = '';
            }
        }

        //入力部
        var sx = parseFloat(elem.style.left) * toOrigin;
        var sy = parseFloat(elem.style.top) * toOrigin;
        var sWidth = parseFloat(elem.style.width) * toOrigin;
        var sHeight = parseFloat(elem.style.height) * toOrigin;
        //出力部
        var dx = (VISIBLE_WIDTH - parseFloat(elem.style.width) ) / 2 * toOrigin;
        var dy = getParaTop(ParaNo) * toOrigin;
        var dWidth = sWidth;
        var dHeight = sHeight;

        out_ctx.drawImage(cvs, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        var drawArea = {x:dx,y:dy,w:dWidth,h:dHeight};
        ParaList.push(drawArea);
        ParaNo++;
    }

	if(autoTriming && seleTabIndex == inputFile_nav.children.length){
		autoTriming = autoTrim.checked = false;
	}
}

function cancel(){
    if(ParaList.length>0){
    	var a = ParaList.pop();
    	out_ctx.clearRect(a.x, a.y, a.w, a.h);
    	ParaNo--;
    }
}

 //n段目から描画位置Topを計算
function getParaTop(n) {
        return Top_margin + Title_h + (n-1)*Para_i.valueAsNumber + (n-1) * trim_H;
}
//全trimboxに対する操作
function changeTrimBox(func) {
	for (var i=0;i < trimBoxList.length;i++){func(trimBoxList[i]);}
}

//ガイド線移動
function rangeChange(id) {
	var L_before = parseFloat(g_L.style.left);
	var R_before = parseFloat(g_R.style.left);
	var L= rangeInput_L.valueAsNumber;
	var R= rangeInput_R.valueAsNumber;

	if (id=='rangeInput_L'){
		g_L.style.left = L + 'px';
		if (widthLock.checked){
			rangeInput_R.value = R + (L-L_before);
			g_R.style.left = R + 'px';
		}
	} else if (id=='rangeInput_R') {
		g_R.style.left = R + 'px';
		if (widthLock.checked) {
			rangeInput_L.value = L + (R-R_before);
			g_L.style.left = L + 'px';
		}
	}

	var width = parseFloat(R-L)+LeftSpace.valueAsNumber+RightSpace.valueAsNumber;
	var left = L-LeftSpace.valueAsNumber;
	var change;

	  if ( (id=='rangeInput_R' && !widthLock.checked) ||  id=='RightSpace' ) //右端変更、幅固定しない時
		  change =  function(e){e.style.width = width + 'px';}

	 else if (!widthLock.checked ||  id=='LeftSpace') //左端変更時&幅固定しない
		  change =  function(e){e.style.left =left+'px'; e.style.width = width + 'px';}

	 else if (widthLock.checked || id=='LeftSpace') //右端変更、幅固定時
		  change =  function(e){e.style.left =left+'px';}

	 //変更適用
	 changeTrimBox(change);
}
//トリミング枠offset_Y変更
function offsetYChange(val) {
	changeTrimBox(function(e){
	    var before_Y = parseInt(e.style.top) + offset_Y_rem;
	    var topVal = before_Y - parseInt(val);
	    e.style.top = topVal + 'px';
    });
	offset_Y.value = offset_Y_rem = parseInt(val);
}
//トリミング枠縦幅変更
function trimHeightChange(val) {
	var hChange = parseInt(val - trim_H) / 2;
	changeTrimBox(function(e){
		var topVal = parseInt(e.style.top);
		e.style.height = parseInt(val) + 'px';
		e.style.top = topVal-hChange + 'px';
	});
    trim_H = parseInt(val);
}

/*function paraIntervalChange(val) {
	Para_i = parseInt(val);
	clean_img();
	doTrim();
}*/

//入力領域クリア
function Input_Clear(){
	clearTrimBox();
	in_ctx.clearRect(0, 0, cvs.width, cvs.height);
	clearOCRTextBox();
	clearTab();
	inputFileInfo.innerHTML = '';
	objFile.value = '';
	pdfName = '';
	pdfDoc = null;
	refeEdge = null;
}
//OCR関連初期化
function clearOCRTextBox() {
	resultArea.innerHTML='';
	Tilt_Correction.value = '';
	removeByClassName('OCRText');
	removeByClassName('edgeBox');
	blockAnalyzeDone = OCRDone = tiltCorrected = false;
	//offset_Y.value = offset_Y_rem = 0;
}
 //出力領域クリア
function clean_img() {
    out_ctx.clearRect(0, 0, out.width, out.height)
    ParaNo = 1;
	Title_h = 0;
}
 //トリミング枠全削除
function clearTrimBox() {
	removeByClassName('trimBox');
	offset_Y.value = offset_Y_rem = 0;
	tboxNum = 0;
}


//ClassNameで要素削除
function removeByClassName(ClassName) {
	var elemList = document.querySelectorAll('.'+ClassName);
	for (var i=0;i < elemList.length; i++){
		var elem = elemList[i];
		elem.parentNode.removeChild(elem);
	}
}


const tabCSS = document.getElementById('tabCSS');
const newTab = document.getElementById('newTab');
//var zindexNo = file.length;

function addTab(Container){
	var tab = newTab.cloneNode(true);

	if (!Container) Container = inputFile_nav;
	var tabCount = Container.children.length;
	var tabList = Container.children;

	tab.id = 'tab_'+ tabCount;
	tab.style.cssText = 'width: 100px;';

	Container.appendChild(tab);
	return tab;
}

function clearTab() {
	inputFile_nav.innerHTML='';
	addTab();
	fileIndex = 0;
}

var refeEdge = null;
function setRefeEdge(){
	var edgeElem = document.getElementById("edgeBox");
	var T = parseInt(edgeElem.style.top);
	var L = parseInt(edgeElem.style.left);
	var W = parseInt(edgeElem.style.width);
	var H = parseInt(edgeElem.style.height);
	refeEdge = {top:T,left:L,width:W,height:H};
	//位置保存
	console.log(refeEdge);
}

var edgeBoxList = new Array();

function selectTab(elem) {
	return new Promise((resolve, reject) => {
	var navElem = elem.parentNode;
	var TabList = elem.parentNode.children;
	var eList = [].slice.call(TabList);
	seleTabIndex = eList.indexOf(elem);

	//前選択した要素の処理
	var selectedTab = navElem.getElementsByClassName("tab selected")[0];
	if(selectedTab) {
		selectedTab.classList.remove('selected');
		//z-index設定
		var selected_Locat = eList.indexOf(selectedTab);
		setTabZindex(TabList,seleTabIndex);
		selectedTab.style.width = '100px';
	}

	//現在の要素を選択
	elem.classList.add('selected');
	elem.style.cssText='z-index: '+TabList.length+';';
	elem.style.width='';

	//tabCSS設定
	setTabStyle(elem);

	//ファイル読み込み
	var result;
	if(file[0] && navElem.id=='inputFile_nav'){
		fileIndex = elem.id.split('_')[1];
		fileName = file[fileIndex].name;
		fileType = getExt(fileName);

		if(fileType == 'pdf' ){
			pageNo = elem.id.split('_').length>2 ? parseInt(elem.id.split('_')[2]) : 1;
			reader.readAsArrayBuffer(file[fileIndex]);
		} else {
			reader.readAsDataURL(file[fileIndex]);
		}
		reader.onload = function() {
			Load_file(reader.result);
			resolve(result);
		};
	}
	})
}

function setTabZindex(TabElemList,selectTabNo){
	for(var i=0 ;i<TabElemList.length;i++){
		var tabElem = TabElemList[i];
		var zindexVal = TabElemList.length - Math.abs(selectTabNo-i);
		tabElem.style.cssText += 'z-index: '+ zindexVal +';';
	}
}

function setTabStyle(elem){
	var style = window.getComputedStyle(elem);
	var len = elem.innerHTML.length;
	tabCSS.innerHTML='';
	if(elem.classList.contains('selected') && len > 12){
		var scaleY= parseInt(style.width)*-0.0004 + 1.03;
		var perspective= len*0.082 + 0.2535;
		tabCSS.innerHTML= '#'+ elem.id + '::before{transform: scaleY(' +scaleY+ ') perspective(' + perspective + 'em) rotateX(5deg);}'
	}
}

//以下、OCR関連
var language = "eng";
var instList = new Array();
var checkedList = new Array();
var LinesArray = new Array();
const resultArea = document.getElementById('result');

var blockAnalyzeDone = false, OCRDone = false;

function selectInst(elem){
	var instNo = elem.value;
	var instElem = document.getElementById('instList_'+instNo);
	var tboxId = 'trimBox_instNo_'+ instNo;

	if(elem.checked && !checkedList.includes(instNo)) {
		var y = parseInt(instElem.style.top) + parseInt(instElem.style.height)/2 - trim_H/2
		drawTrimBox(tboxId,y)
		checkedList.push(instNo)
	}
	if(!elem.checked && checkedList.includes(instNo)){
		var index = checkedList.indexOf(instNo)
		checkedList.splice(index,1)
		removeTrimBox(tboxId)
	}
}

function getInputCanvas() {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var useWidth = img.width * rangeInput_L.valueAsNumber / VISIBLE_WIDTH;
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
		var divId='';
		var b = w.bbox;
		var isWord = w.text.match(/[a-z]/gi);
		if(isWord){
			divId = "instList_" + index;
			instList.push(fixWord(w.text))
			index++;

			var imgToView = VISIBLE_WIDTH/img.width;
			var x =(b.x0)*imgToView;
			var y =(b.y0)*imgToView;
			var width = (b.x1-b.x0)*imgToView;
			var hieght = (b.y1-b.y0)*imgToView;

			if(LeftSpace.valueAsNumber<width){
				LeftSpace.value = width;
			}
			drawDivBox(divId,'OCRText',x, y, width, hieght)
		}
	})

	if(instList.length > 0){
		resultArea.innerHTML='認識結果:';
		instList.forEach(
				function (value, index){
				var chkboxstr = '<input type="checkbox" oninput="selectInst(this)" value="' + index + '" id="ckbox_' + index + '">'
				+ '<label>' + value + '</label>';
				resultArea.insertAdjacentHTML('beforeend',chkboxstr);

				if(searchText.value) {
					if( value.includes(searchText.value) ){
						var e = document.getElementById('ckbox_' + index);
						e.checked = true;
						selectInst(e);
					}
				}

						}
				);
	}
	OCRDone = true;
}

function progressUpdate(packet){
	var statusText = document.getElementById('statusText');
	var progressbar = document.getElementById('progressbar');
	var log = document.getElementById('log');

	statusText.innerHTML = packet.status;
	if('progress' in packet){
		progressbar.value = packet.progress;
	}

/* if(packet.status == 'done'){} */
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

    if(tiltCorrected || fileType == 'pdf'){
    	var Ratio = VISIBLE_WIDTH / cvs.width;
	    canvas.width = cvs.width*Ratio;
	    canvas.height = cvs.height*Ratio;
	    ctx.drawImage(cvs,0,0,cvs.width,cvs.height,0,0,cvs.width*Ratio,cvs.height*Ratio);
    } else {
        var Ratio = VISIBLE_WIDTH / img.width;
	    canvas.width = img.width*Ratio;
	    canvas.height = img.height*Ratio;
	    ctx.drawImage(img,0,0,img.width,img.height,0,0,img.width*Ratio,img.height*Ratio);
    }
    return canvas;
}

//openCV HoughLinesP
function HoughLinesP(){
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
	//let src = cv.imread(canvas);
	//cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
	var context = canvas.getContext('2d');
	 const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
	 const detector = new LSD();
	 const lines = detector.detect(imageData);
	 //console.log('lines: ' + lines.length.toString());

	// draw lines
	LinesArray = new Array();
	//for (var L of lines) {
	for (var i in lines) {
		var L = lines[i];
	    var angle = Math.atan2( L.y1 - L.y2, L.x1 - L.x2 ) ;
	    var length = Math.sqrt( Math.pow( L.x2-L.x1, 2 ) + Math.pow( L.y2-L.y1, 2 ) ) ;
	    LinesArray.push({
	    	 'x1':Math.floor(L.x1),
	    	 'y1':Math.floor(L.y1),
	    	 'x2':Math.floor(L.x2),
	    	 'y2':Math.floor(L.y2),
	    	 'angle':angle,
	    	 'length':length
	    	});
	}

	//ブロック解析
	blockAnalysis();

	//out.width = canvas.width;
	//out.height = canvas.height;
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

function calcTiltAngle(a){
	var tilt;
	if (-DIFF < a && a < DIFF){
		tilt = a;
	} else if (HORIZON-DIFF < a && a < HORIZON+DIFF){
		tilt = a - Math.PI;
	} else if (0 - HORIZON - DIFF < a && a < 0 - HORIZON +DIFF){
		tilt = a + Math.PI;
	}
	return tilt;
}

function drawLine(x1,y1,x2,y2){
	out_ctx.strokeStyle = 'red';
	out_ctx.beginPath();
	out_ctx.moveTo(x1,y1);
	out_ctx.lineTo(x2,y2);
	out_ctx.stroke();
}
Array.prototype.increase = function (i,e) {
	if(this[i])
		this[i] += e;
	else
		this[i] = e;
}

//譜表ブロック解析
	var edge_L=0,edge_R=0,edge_T=0,edge_B=0;
function blockAnalysis() {
	var hMap_Array = new Array(); //横線Map
	var vMap_Array = new Array(); //縦線Map
	var tiltAngle_Array = new Array(); //傾き角度集計用

	//for (var L of LinesArray){
	for (var i in LinesArray){
		var L =  LinesArray[i];
		var d = parseInt(L.length);
		if(L.length>0.02*VISIBLE_WIDTH) {
			if(isHorizon(L.angle)){
				hMap_Array.increase(L.y1,d); //横線合計長さ集計
				if(L.length>0.2*VISIBLE_WIDTH) {
					tiltAngle_Array.push(calcTiltAngle(L.angle)); //横線傾き角度集計
					//drawLine(L.x1,L.y1,L.x2,L.y2);out_ctx.closePath();
				}
			} else if (isVertical(L.angle)){
				vMap_Array.increase(L.x1,d); //縦線合計長さ集計
			}
		}
	}

	edge_L = findEdge(vMap_Array,  0, VISIBLE_WIDTH / 2);
	edge_R = findEdge(vMap_Array , VISIBLE_WIDTH, VISIBLE_WIDTH*0.85);
	edge_T = findEdge(hMap_Array, 1, VISIBLE_HEIGHT / 2);
	edge_B = findEdge(hMap_Array, VISIBLE_HEIGHT, VISIBLE_HEIGHT / 2 );

	var vAngle_radians = average(tiltAngle_Array);
	var vAngle_degree = vAngle_radians * TO_DEG;

//	console.log('横線平均角度 :', vAngle_degree);
//	console.log('横線角度Map :', horizontal_lines);
//	console.log('横線Map :', hMap_Array);
//	console.log('縦線Map :', vMap_Array);
//	console.log('左側縦線Map最大値 :', left , '縦線平均値 :', average(vMap_Array) ,'縦線中央値 :', topN(vMap_Array) ,'30%高さ :', VISIBLE_HEIGHT*0.3  );
//	console.log('右側縦線Map最大値 :', right);
//	console.log('上側横線Map最大値 :', top_v, '横線平均値 :', average(hMap_Array),'横線中央値 :', topN(hMap_Array)  ,'30%幅 :', VISIBLE_WIDTH*0.3  );
//	console.log('下側横線Map最大値 :', bot_v);

	if(Math.abs(vAngle_degree) < 0.4 ) {
		rangeInput_L.value = edge_L;
		rangeInput_R.value = edge_R;
		rangeChange(rangeInput_L.id,edge_L);
		rangeChange(rangeInput_R.id,edge_R);
		drawDivBox('edgeBox','edgeBox',edge_L,edge_T,(edge_R-edge_L),(edge_B-edge_T));

		if(!tiltCorrected)
			Tilt_Correction.value = -vAngle_degree;

		progressUpdate({status: '譜表領域検出完了'});
		blockAnalyzeDone = true;
	} else if (!tiltCorrected && vAngle_degree) {
		//傾き補正
		Tilt_Correction.value = -vAngle_degree;
		rotatImage(-vAngle_radians);
		tiltCorrected = true;
		progressUpdate({status: '傾き補正済み'});
		lineDetectLSD();
	}
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
	if(fileType=='pdf')
		context.drawImage(pdfCanvas, -(pdfCanvas.width/2), -(pdfCanvas.height/2));
	else
		context.drawImage(img, -(img.width/2), -(img.height/2));
	context.restore();
}
function rotatImageByDegree(value) {
	rotatImage(value*Math.PI/180);
}

function maxIndex(a,start,end) {
	var index = 0,value = -1;
	var increase = start<end ? 1 : -1 ;
	for (var i=start;!(start<end^i<end);i=i+increase) {
		if (value < a[i]) {	value = a[i]; index = i	}
	}
	return index;
}

function notNullLength(arr) {
	var notNullLength =0;
	arr.forEach(function(item) { if(item) notNullLength++;});
    return notNullLength;
}
var sum  = function(arr) {
	if(arr.length>0)
    return arr.reduce(function(prev, current, i, arr) {
        return prev+current;
    });
    else return 0;
};
var average = function(arr, fn) {
    return sum(arr, fn)/notNullLength(arr);
};

function topN(arr,N) {
	if (!N) N = 0.5;
	var arr_new = new Array();
	arr.forEach(function(item) { if(item) arr_new.push(item);});
    var target = parseInt(arr_new.length * N);
    var temp = arr_new.sort(function (a,b){return a<b ? 1 : -1});
    return temp[target];
};

function findEdge(a,start,end) {
	var calc_a = a.slice();
	var index = 0;

	if (start<end)
	    calc_a.forEach(function(e,i){if(e && i > end) calc_a[i] = 0;});
	else
	    calc_a.forEach(function(e,i){if(e && i < end) calc_a[i] = 0;});

	var threshold = topN(calc_a,0.5);

	var increase = start<end ? 1 : -1 ;
	for (var i=start;!(start<end^i<end);i += increase) {
		if (calc_a[i] && calc_a[i]>=threshold) {index = i;break;}
	}
	return index;
}

function fixWord(text){
	var fix = text;
	switch(text) {
		case 'Yo': fix = 'Vo';
		case 'Yo.': fix = 'Vo.';
		case 'Gl': fix = 'Gt';
	}
	return fix;
}

//ファイル名から拡張子を取得する関数
function getExt(filename)
{
	var pos = filename.lastIndexOf('.');
	if (pos === -1) return '';
	return filename.slice(pos + 1);
}

//画像出力
function download() {
    var downloadLink = document.getElementById('hiddenLink');
    if (out.msToBlob) {
        var blob = out.msToBlob();
        window.navigator.msSaveBlob(blob, outFileName);
    } else {
		//downloadLink.href = out.toDataURL('img/png');
		var dataURI = out.toDataURL('img/png');
		const blob = dataURItoBlob(dataURI);
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.download = outFileName;
		a.href = url;
		a.click();
		// ダウンロードの時間がわからないので多めに 最低 3s,  1MiB / sec として
		// 終わった頃に revoke する
		setTimeout(function (){URL.revokeObjectURL(url);}, Math.max(3000, 1000 * dataURI.length / 1024 * 1024));
    }
	return Promise.resolve(1);
}

//以降、ES2017必須
function dataURItoBlob(dataURI) {
	const b64 = atob(dataURI.split(',')[1]);
	const u8 = Uint8Array.from(b64.split(""), e => e.charCodeAt());
	return new Blob([u8], {type: "img/png"});
}

async function startAutoTrim(){
	//譜表領域検出
	if(!blockAnalyzeDone)
		await lineDetectLSD();

	if(refeEdge){
		var offset = refeEdge.top - edge_T;
		offsetYChange(offset);
	}
	if(autoTrim.checked){
		doTrim();
	}
}

async function startOCR(){
	if(!worker){
		//CDN worker
		worker = new Tesseract.createWorker({
			logger: progressUpdate
		});

		//Local worker
/*	 	worker = new Tesseract.createWorker({
			workerPath: './file/tesseract/worker.min.js',
			langPath: './file/traineddata/',
			corePath: './file/tesseract/tesseract-core.wasm.js',
			logger: progressUpdate
		});*/
	}

	var input = getInputCanvas();
	await worker.load();
	await worker.loadLanguage(language);
	await worker.initialize(language);
	await worker.setParameters({
	    tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.()'
	  });
	const {data} = await worker.recognize(input);
	result(data);
}

var autoTriming = false;
async function doStaff(){
	autoTrim.checked = autoTriming = true;
	doTrim();
	setRefeEdge();
	var tabList = inputFile_nav.children;
	while (seleTabIndex < tabList.length) {
		result = await Load_Next();
		seleTabIndex++;
	}
}
