//Band Score Split (c) 2019~2020 by kitami.hibiki. licensed by CC BY-NC-SA 4.0
"use strict";
const VISIBLE_WIDTH = 708; //画像表示サイズ幅
const VISIBLE_HEIGHT = 1000; //画像表示サイズ幅
const ASPECT_R = Math.SQRT2; //出力用紙アスペクト比
var trimHeight = VISIBLE_HEIGHT * 0.1; //トリミング枠縦幅(初期値)
var topMargin = VISIBLE_HEIGHT * 0.05; //描画開始位置X（上部余白）
var titleHeight = 0;
var selectingID = '';
var tiltCorrected = false,autoTrimFlg=false;
var worker, guideL, guideR;
var source;
var maxLength = 0; 

//HTMLElement
const inCanvas = document.getElementById('in'); //inエリアcanvas
const outCanvas = document.getElementById('out'); //outエリアcanvas
const inContext = inCanvas.getContext('2d');
const outContext = outCanvas.getContext('2d');
const rangeL = document.getElementById('rangeL');
const rangeR = document.getElementById('rangeR');
const inputFile = document.getElementById("inputFile");
const tabNav = document.getElementById('tabNav');
const inputDiv = document.getElementById('inputDiv');
const inputFileInfo = document.getElementById('inputFileInfo');
const F = document.F;
const FileList = document.getElementById('inputFileList');

//HTMLCollection
const trimBoxList = document.getElementsByClassName('trimBox');
const ocrTextList = document.getElementsByClassName('OCRText');

//File input
var reader, file,
    fileIndex = 0,
    zindexNo = 100,
    fileType = '',
    fileName = '',
    img = new Image();

inputFile.addEventListener("change", function (evt) {
    if (evt && evt.target.files) {
        file = evt.target.files;
        fileIndex = 0;
        reader = new FileReader();
        clearTab();
        for (var i = 0; i < file.length; i++) {
            fileName = file[i].name;
            fileType = getExt(fileName);
			maxLength++;
			addPage(i,fileName);
        }
        selectTab(0);
    }
}, false);

async function loadFile(dataUrl) {
    progressUpdate({ status: 'Loading' });
    OCRInit();
    if (fileType == 'pdf') {
        await loadPdf(dataUrl);
    } else {
        await loadImage(dataUrl);
    }
    progressUpdate({ status: 'done' });
    //if (F.EdgeDetect.checked) { startBatch(); }
}

function setInputFileInfo(page,maxPage,w,h){
    inputFileInfo.innerHTML = page + ' / ' + maxPage + ' 解像度: ' + w + 'x' + h;
}

function addPage(fileId,name) {
	var optHtml = '<option value='+fileId+'>'+name+'</option>';
	FileList.innerHTML += optHtml;
}

function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
        img.src = dataUrl;
        img.onload = () => {
            inCanvas.width = img.width;
            inCanvas.height = img.width * ASPECT_R;
            inContext.fillStyle = 'white';
            inContext.fillRect(0, 0, inCanvas.width, inCanvas.height);
            inContext.drawImage(img, 0, 0, img.width, img.height);
            var fileNo = parseInt(fileIndex) + 1;
            setInputFileInfo(fileNo,file.length,img.width,img.height);
            source = img;
            if (F.EdgeDetect.checked) { startBatch(); }
            resolve(img);
        }
    })
}

var pageNo = 1, viewingPage = 1,
    pdfName = '', pdfDoc = null,
    pageRendering = false,
    pageNumPending = null,
    //pdfCanvas,
    scale = 2;
pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.3.200/pdf.worker.js';

// dataUrl:arrayBuffer
function loadPdf(dataUrl) {
    return new Promise((resolve, reject) => {
        if (pdfName == fileName) {
            if (pageNo != viewingPage)
                openPage(pageNo);
        } else {
            var typedarray = new Uint8Array(dataUrl);
            pdfjsLib.getDocument(typedarray).then(function (pdf) {
                pdfName = fileName;
                pdfDoc = pdf;
                pdfjsLib.disableStream = true;
                var endTabID = "tab_" + fileIndex + "_" + pdf.numPages;
                if (pdf.numPages > 1 && !document.getElementById(endTabID)) {
                    addPdfTabs(fileIndex, pdf.numPages);
                }
                openPage(pageNo);
            });
        }
    });
}

/**
 * Get page info from document, resize canvas accordingly, and render page.
 * @param num Page number.
 */
async function openPage(num) {
    pageRendering = true;
    // Using promise to fetch the page
    pdfDoc.getPage(num).then(function (page) {
        var viewport = page.getViewport({ scale: scale });
        inCanvas.height = viewport.height;
        inCanvas.width = viewport.width;
        setInputFileInfo(num,pdfDoc.numPages,viewport.width,viewport.height);

        // Render PDF page into canvas context
        var renderContext = { canvasContext: inContext, viewport: viewport };
        var renderTask = page.render(renderContext);

        // Wait for rendering to finish
        renderTask.promise.then(function () {
            pageRendering = false;
            if (pageNumPending !== null) {
                // New page rendering is pending
                renderPage(pageNumPending);
                pageNumPending = null;
            }
            source = getPdfCanvas();
            viewingPage = num;
            if (F.EdgeDetect.checked) { startBatch(); }
        });
    });
}

function getPdfCanvas() {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = inCanvas.width;
    canvas.height = inCanvas.height;
    ctx.drawImage(inCanvas, 0, 0);
    //pdfCanvas = canvas;
    return canvas;
}

function addPdfTabs(fileNo, Pags) {
    var firstPage = FileList.childNodes[fileNo];
	firstPage.value += "_1";
    firstPage.innerHTML += "_1";

    for (var i = 1; i < Pags; i++) {
		var fileNo = fileIndex,pageNo = i+1;
        var fileId = fileNo+"_"+pageNo;
		var pageName = fileName+"_"+pageNo;
		addPage(fileId,pageName);
		maxLength++;
    }
    selectTab(0);
}

var seleTabIndex = 0;

//前ページ
function loadPre() {
	var FileNodeList = FileList.childNodes;
    if (maxLength > 0 && seleTabIndex - 1 >= 0) {
		var fileId = FileNodeList[seleTabIndex - 1].value;
		seleTabIndex--;
        selectTab(fileId);
    }
}
//次ページ
function loadNext() {
	var FileNodeList = FileList.childNodes;
	if(seleTabIndex+1== maxLength){
        autoTrimFlg=false;
    }
    if (maxLength > 0 && seleTabIndex + 1 < maxLength) {
		var fileId = FileNodeList[seleTabIndex + 1].value;
		seleTabIndex++;
		return selectTab(fileId);
    }
    return Promise.resolve(1);
}

var L_before,R_before;
window.onload = function () {
    rangeL.min = 7;
    rangeL.max = parseInt(VISIBLE_WIDTH / 2) - 7;
    rangeR.min = parseInt(VISIBLE_WIDTH / 2) + 7;
    rangeR.max = VISIBLE_WIDTH - 7;
    L_before=rangeL.value = parseInt(VISIBLE_WIDTH * 0.05);
    R_before=rangeR.value = parseInt(VISIBLE_WIDTH * 0.95);
    outCanvas.width = VISIBLE_WIDTH;
    outCanvas.height = VISIBLE_HEIGHT;
    F.TrimH.value = trimHeight;
    guideL = drawGuideLine('guide_left', L_before);
    guideR = drawGuideLine('guide_right', R_before);
    drawInit();
}

function drawDivBox(id = '', className = '', x, y, width, height) {
    var elem = document.createElement('div');
    elem.id = id;
    elem.className = className;
    elem.style.left = x + 'px';
    elem.style.top = y + 'px';
    elem.style.width = width + 'px';
    elem.style.height = height + 'px';
    if (className == 'trimBox') {
        elem.addEventListener('click', selectTrimBox, false);
        elem.addEventListener('mousedown', initMove, false);
        elem.addEventListener('touchstart', initMove, false);
        elem.addEventListener('touchend', selectTrimBox, false);
    }
    inputDiv.appendChild(elem);
    return elem;
}

function selectTrimBox(e) {
    //前選択した要素のclassを解除
    if (selectingID) {
        var selectedElem = document.getElementById(selectingID);
        if (selectedElem && selectedElem.classList.contains('selecting')) {
            selectedElem.classList.remove('selecting');
        }
    }
    //現在選択した要素のclassを追加
    selectingID = e.target.id;
    document.getElementById(selectingID).classList.add('selecting');
}

var moveElem, move_start_y;

function initMove(e) {
    move_start_y = e.clientY;
    moveElem = event.target;

    if (e.type == 'touchstart') {
        //モバイル対応
        event.preventDefault();
        var touchObject = e.changedTouches[0];
        move_start_y = touchObject.pageY;
        window.addEventListener('touchmove', move, false);
        window.addEventListener('touchend', stopMove, false);
    } else {
        window.addEventListener('mousemove', move, false);
        window.addEventListener('mouseup', stopMove, false);
    }
}

function move(e) {
    var topVal = parseInt(moveElem.style.top);
    var moveLength = Math.round(e.clientY - move_start_y);
    if (e.type == 'touchmove') {
        event.preventDefault();
        var touchObject = e.changedTouches[0];
        moveLength = Math.round(touchObject.pageY - move_start_y);
    }

    moveElem.style.top = (parseInt(topVal) + moveLength) + "px";

    if (e.type == 'touchmove')
        move_start_y = touchObject.pageY;
    else
        move_start_y = e.clientY;
    
    if(F.autoReTrim.checked) {reTrim();}
}

function stopMove(e) {
    if (e.type == 'touchend') {
        //モバイル対応
        window.removeEventListener('touchmove', move, false);
        window.removeEventListener('touchend', stopMove, false);
    } else {
        window.removeEventListener('mousemove', move, false);
        window.removeEventListener('mouseup', stopMove, false);
    }
}
//トリミング領域追加
function addTrimBox() {
    var n = trimBoxList.length + 1;
    drawTrimBox('trimBox_' + n, inputDiv.scrollTop);
    if(F.autoReTrim.checked) {reTrim();}
}
//トリミング領域描画
function drawTrimBox(id, top) {
    var guideLPos = parseInt(guideL.style.left);
    var guideRPos = parseInt(guideR.style.left);
    var left = guideLPos - F.LeftSp.valueAsNumber;
    var width = guideRPos - guideLPos + F.LeftSp.valueAsNumber + F.RightSp.valueAsNumber;
    drawDivBox(id, 'trimBox', left, top, width, trimHeight);
    selectingID = id;
}
//ガイド線描画
function drawGuideLine(id, positon) {
    var className = 'guide v';
    // return drawDivBox(id, className, 0, positon, VISIBLE_WIDTH, 0);
    return drawDivBox(id, className, positon, 0, 0, VISIBLE_HEIGHT);
}
//トリミング領域削除
function removeTrimBox(elemID) {
    if (!elemID)
        elemID = selectingID;
    var elem = document.getElementById(elemID);
    if (elem) {
        elem.parentNode.removeChild(elem);
        if (selectingID == elemID)
            selectingID = '';
    }
}
//出力領域初期化
function drawInit() {
    paraList = [];
    outCanvas.width = (inputFile.value) ? inCanvas.width : VISIBLE_WIDTH;
    outCanvas.height =(inputFile.value) ? inCanvas.width * ASPECT_R : VISIBLE_HEIGHT;
    // 背景
    outContext.fillStyle = 'white';
    outContext.fillRect(0, 0, outCanvas.width, outCanvas.height);
}
//タイトル書込み
function drawTitle() {
    var t = F.TitleText.value;
    var toOrigin = outCanvas.width / VISIBLE_WIDTH;
    var clearHeight = (topMargin + titleHeight) * toOrigin;
    if (t.length > 0) {
        var font_size = outCanvas.width / 25;
        outContext.font = font_size + "px serif";
        var textWidth = outContext.measureText(t).width;
        var textHeight = textWidth / t.length;
        var x = (outCanvas.width - textWidth) / 2;
        var y = topMargin * toOrigin;
        outContext.fillStyle = 'white';
        outContext.fillRect(0, 0, outCanvas.width, clearHeight);
        outContext.fillStyle = 'black';
        outContext.fillText(t, x, y);
        titleHeight = textHeight / toOrigin;
    } else if (titleHeight > 0) {
        outContext.fillStyle = 'white';
        outContext.fillRect(0, 0, outCanvas.width, clearHeight);
        titleHeight = 0;
    }
}
//画像トリミング
var paraList = [];
async function doTrim() {
    var toOrigin = inCanvas.width / VISIBLE_WIDTH; //画面位置to出力位置変換係数
    if (paraList.length == 0) {
        drawInit(); // 初期化
        drawTitle(); // タイトル書込み
    }
    var trimBoxList_now = document.querySelectorAll('.trimBox');
    var trimBoxListArray = Array.from(trimBoxList_now); // 配列に変換
    //trimBoxListArray.sort(function (a, b) { return parseInt(a.style.top) - parseInt(b.style.top); })
    for (var elem of trimBoxListArray) {
        var paraEnd = getParaTop(paraList.length) + trimHeight;
        if (paraEnd > VISIBLE_HEIGHT) {
            if(!autoTrimFlg) { alert('ページ末尾に到達した'); removeTrimBox(elem.id); return; }
            await download();
            drawInit();
            F.TitleText.value = '';
        }
        //入力部
        var sx = parseInt(parseInt(elem.style.left) * toOrigin);
        var sy = parseInt(parseInt(elem.style.top) * toOrigin);
        var sWidth = parseInt(parseInt(elem.style.width) * toOrigin);
        var sHeight = parseInt(parseInt(elem.style.height) * toOrigin);
        //出力部
        var dx = parseInt((VISIBLE_WIDTH - parseInt(elem.style.width)) / 2 * toOrigin);
        var dy = parseInt(getParaTop(paraList.length) * toOrigin);
        var dWidth = sWidth;
        var dHeight = sHeight;
        outContext.drawImage(inCanvas, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        var a = { x: dx, y: dy, w: dWidth, h: dHeight };
        paraList.push(a);
    }
    if (seleTabIndex + 1 == maxLength) {
        autoTrimFlg = false;
        progressUpdate({ status: 'Trim done' });
    }
}
//反映ボタン
function reTrim(){
    if(inputFile.value){
        drawInit();
        doTrim();
    }
}
//1段落削除
function cancel() {
    if (paraList.length > 0) {
        var a = paraList.pop();
        outContext.fillStyle = 'white';
        outContext.fillRect(a.x, a.y, a.w, a.h);
    }
}
//n段目から描画位置Topを計算
function getParaTop(n) {
    return topMargin + titleHeight + n * F.ParaInterval.valueAsNumber + n * trimHeight;
}
//全trimboxに対する操作
function changeTrimBox(func) {
    for (var elem of trimBoxList) { func(elem); }
    if(F.autoReTrim.checked) {reTrim();}
}
//ガイド線移動
function rangeChange(id) {
    if (F.widthLock.checked) {
        rangeChangeFixWidth(id)
    } else {
        if (id == rangeL.id) {
            guideL.style.left = rangeL.value + 'px';
        } else if (id == rangeR.id) {
            guideR.style.left = rangeR.value + 'px';
        }
        var width = parseInt(rangeR.value - rangeL.value) + F.LeftSp.valueAsNumber + F.RightSp.valueAsNumber;
        var left = rangeL.valueAsNumber - F.LeftSp.valueAsNumber;
        var change;
        if (id == rangeR.id || id == F.RightSp.id) //右端変更時
            change = function (e) { e.style.width = width + 'px'; }
        else if (id == rangeL.id || id == F.LeftSp.id) //左端変更時
            change = function (e) { e.style.left = left + 'px'; e.style.width = width + 'px'; }
        //変更適用
        changeTrimBox(change);
    }
}
//ガイド線移動-幅固定時
function rangeChangeFixWidth(id) {
    if (id == rangeL.id) {
        var L_before = parseInt(guideL.style.left);
        rangeR.value = rangeR.valueAsNumber + (rangeL.valueAsNumber - L_before);
    } else if (id == rangeR.id) {
        var R_before = parseInt(guideR.style.left);
        rangeL.value = rangeL.valueAsNumber + (rangeR.valueAsNumber - R_before);
    }
    guideL.style.left = rangeL.value + 'px';
    guideR.style.left = rangeR.value + 'px';
    var left = rangeL.valueAsNumber - F.LeftSp.valueAsNumber;
    //変更適用
    changeTrimBox(function (e) { e.style.left = left + 'px'; });
}
//トリミング枠offset_Y変更
var offsetTemp = 0;
function offsetYChange(val) {
    changeTrimBox(function (e) {
        var topBefore = parseInt(e.style.top) + offsetTemp;
        var topAfter = topBefore - parseInt(val);
        e.style.top = topAfter + 'px';
    });
    F.OffsetY.value = offsetTemp = parseInt(val);
}
//トリミング枠縦幅変更
function trimHeightChange(val) {
    var heightChange = parseInt(val - trimHeight) / 2;
    changeTrimBox(function (e) {
        var topVal = parseInt(e.style.top);
        e.style.height = parseInt(val) + 'px';
        e.style.top = topVal - heightChange + 'px';
    });
    trimHeight = parseInt(val);
}
//入力領域クリア
function inputClear() {
    clearTrimBox();
    inContext.clearRect(0, 0, inCanvas.width, inCanvas.height);
    OCRInit();
    clearTab();
    inputFileInfo.innerHTML = '';
    inputFile.value = '';
    fileType = pdfName = '';
    pdfDoc = null;
    refeEdge = null;
}

//トリミング枠全削除
function clearTrimBox() {
    removeByClassName('trimBox');
    F.OffsetY.value = offsetTemp = 0;
    if(OCRDone) {
        for(var i in instList) { document.getElementById('ckbox_' + i).checked = false; }
    }
}
//ClassNameで要素削除
function removeByClassName(ClassName) {
    var elemList = document.querySelectorAll('.' + ClassName);
    for (var elem of elemList) {
        elem.parentNode.removeChild(elem);
    }
}
//tab関連要素
const tabCSS = document.getElementById('tabCSS');
const newTab = document.getElementById('newTab');

//tab追加
function addTab(Container) {
    var tab = newTab.cloneNode(true);

    if (!Container)
        Container = tabNav;

    var tabCount = Container.children.length;
    tab.id = 'tab_' + tabCount;
    tab.style.cssText = 'width: 100px;';

    Container.appendChild(tab);
    return tab;
}
//tab全削除
function clearTab() {
    FileList.innerHTML = '';
    fileIndex = 0;
}

//tab選択
function selectTab(fileId) {
	FileList.options[fileId].selected = true;
    return new Promise((resolve, reject) => {
        //ファイル読み込み
			if (file[0]) {
			fileId = ''+fileId;
			fileIndex = parseInt(fileId.split('_')[0]);
            fileName = file[fileIndex].name;
            fileType = getExt(fileName);

            if (fileType == 'pdf') {
                pageNo = fileId.split('_').length > 1 ? parseInt(fileId.split('_')[1]) : 1;
                reader.readAsArrayBuffer(file[fileIndex]);
            } else {
                reader.readAsDataURL(file[fileIndex]);
            }
            reader.onload = function () {
                loadFile(reader.result);
                resolve();
            };
        }
    })
}

//以下、OCR関連
var language = "eng";
var instList = []; //楽器リスト
var checkedList = [];
var LinesArray = [];
const resultArea = document.getElementById('result');
var refeEdge = null;
var blockAnalyzeDone = false,
    OCRDone = false;

//OCR関連初期化
function OCRInit() {
    resultArea.innerHTML = '';
    F.TiltDeg.value = '';
    removeByClassName('OCRText');
    removeByClassName('edgeBox');
    blockAnalyzeDone = OCRDone = tiltCorrected = false;
    instList = [];
    checkedList = [];
}

//楽器を選択
function selectInst(elem) {
    var instNo = elem.value;
    var instElem = document.getElementById('instList_' + instNo);
    var tboxId = 'trimBox_instNo_' + instNo;

    if (elem.checked && !checkedList.includes(instNo)) {
        var y = parseInt(instElem.style.top) + parseInt(instElem.style.height) / 2 - trimHeight / 2 - F.OffsetY.valueAsNumber;
        drawTrimBox(tboxId, y)
        checkedList.push(instNo)
    }
    if (!elem.checked && checkedList.includes(instNo)) {
        var index = checkedList.indexOf(instNo)
        checkedList.splice(index, 1)
        removeTrimBox(tboxId)
    }
}
//参照用外枠情報取得
function setRefeEdge() {
    var edgeElem = document.getElementById("edgeBox");
    var top = parseInt(edgeElem.style.top);
    var left = parseInt(edgeElem.style.left);
    var width = parseInt(edgeElem.style.width);
    var height = parseInt(edgeElem.style.height);
    refeEdge = { top: top, left: left, width: width, height: height };
    //位置保存
    console.log(refeEdge);
}

function getInputCanvas() {
    var canvas = document.createElement('canvas');
	var ctx = canvas.getContext('2d');

	var useWidth = img.width * rangeL.valueAsNumber / VISIBLE_WIDTH;
	var useHeight = img.height;

	if (fileType == 'pdf') {
		useWidth = source.width * rangeL.valueAsNumber / VISIBLE_WIDTH;
		useHeight = source.height;
	}

	canvas.width = useWidth;
	canvas.height = useHeight;
	
	if (fileType == 'pdf')
		ctx.drawImage(source, 0, 0, useWidth, useHeight, 0, 0, useWidth, useHeight);
	else
		ctx.drawImage(img, 0, 0, useWidth, useHeight, 0, 0, useWidth, useHeight);
	
    //90度回転文字時
    if(F.verticalText.checked){
        canvas=rightAngleRotat(canvas);
    }
    //document.body.appendChild(canvas);
    return canvas;
}

function rightAngleRotat(canvas){
    //canvas rotation
    var tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = canvas.height;
    tmpCanvas.height = canvas.height;
    rotatCanvas(tmpCanvas,90*Math.PI/180,canvas);
    //margin remove
    var newCanvas = document.createElement('canvas');
    newCanvas.width = canvas.height;
    newCanvas.height = canvas.width;
    var ctx = newCanvas.getContext('2d');
    var sy=(canvas.height-canvas.width)/2;
    ctx.drawImage(tmpCanvas, 0, sy, newCanvas.width, newCanvas.height, 0, 0, newCanvas.width, newCanvas.height);
    //document.body.appendChild(newCanvas);
    return newCanvas;
}

function result(res) {
    console.log('result was:', res);
    progressUpdate({ status: 'OCR done' });

    //結果配列から単語単位で取り出す
    instList = [];
    var index = 0;
    res.words.forEach(function (w) {
        var divId = '';
        var b = w.bbox;
        var isWord = w.text.match(/[a-z]/gi);
        if (isWord) {
            divId = "instList_" + index;
            instList.push(w.text);
            index++;

            var imgToView = VISIBLE_WIDTH / source.width;
            var x = (b.x0) * imgToView;
            var y = (b.y0) * imgToView;
            var width = (b.x1 - b.x0) * imgToView;
            var height = (b.y1 - b.y0) * imgToView;

            //90度回転文字時
            if (F.verticalText.checked){
                x = (b.y0) * imgToView;
                y = (source.height - b.x1) * imgToView;
                width =  (b.y1 - b.y0) * imgToView;
                height = (b.x1 - b.x0) * imgToView;
            } 
            
            if (F.LeftSp.valueAsNumber < width) {
                F.LeftSp.value = width;
            }
            
            drawDivBox(divId, 'OCRText', x, y, width, height);
        }
    })
    //checkbox設置
    if (instList.length > 0) {
        resultArea.innerHTML = '認識結果:';
        instList.forEach(
            function (value, index) {
                var chkboxstr = '<input type="checkbox" oninput="selectInst(this)" value="' + index + '" id="ckbox_' + index + '">' +
                    '<label>' + value + '</label>';
                resultArea.insertAdjacentHTML('beforeend', chkboxstr);
                }
        );
    }
    OCRDone = true;
    if(F.searchWord.value){ searchInst(); }
}

//楽器を検索
async function searchInst(){
    if (!OCRDone) {
        await startOCR();
    }
    var keyWord = F.searchWord.value;
    if(keyWord){
        instList.forEach(function (value, index) {
            if (value.includes(keyWord)) {
            var e = document.getElementById('ckbox_' + index);
                        e.checked = true;
                        selectInst(e);
            }
        });
    }
}

var statusText = document.getElementById('statusText');

function progressUpdate(packet) {
    var progressbar = document.getElementById('progressbar');
    var log = document.getElementById('log');

    statusText.innerHTML = packet.status;
    if ('progress' in packet) {
        progressbar.value = packet.progress;
    }
    /* if(packet.status == 'done'){} */
}

/*
 * 以下傾き補正関連
 */
var horizontal_lines = [];
const TO_DEG = 1 / Math.PI * 180; //計算用係数
const TO_RAD = Math.PI / 180; //計算用係数

function getInputCanvas2() {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var input = (tiltCorrected || fileType == 'pdf') ? inCanvas : img;
    var Ratio = VISIBLE_WIDTH / input.width;
    canvas.width = input.width * Ratio;
    canvas.height = input.height * Ratio;
    ctx.drawImage(input, 0, 0, input.width, input.height, 0, 0, input.width * Ratio, input.height * Ratio);
    return canvas;
}

//譜表領域検出 LSD方式
function lineDetectLSD() {
    progressUpdate({ status: 'line Detecting' });

    let canvas = getInputCanvas2();
    var context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const detector = new LSD();
    const lines = detector.detect(imageData);

    LinesArray = new Array();
    for (var L of lines) {
        var angle = Math.atan2(L.y1 - L.y2, L.x1 - L.x2);
        var length = Math.sqrt(Math.pow(L.x2 - L.x1, 2) + Math.pow(L.y2 - L.y1, 2));
        LinesArray.push({
            'x1': Math.trunc(L.x1), 'y1': Math.trunc(L.y1), 'x2': Math.trunc(L.x2), 'y2': Math.trunc(L.y2),
            'angle': angle,
            'length': length
        });
    }

    //draw lines
    //drawInit();
    //detector.drawSegments(outContext, lines);

    //ブロック解析
    return blockAnalysis();
}

const DIFF = 0.055; //傾き許容範囲-約3度
const HORIZON = Math.PI;
const VERTICAL_1 = 90 * TO_RAD;
const VERTICAL_2 = 270 * TO_RAD;

function isHorizon(angle) {
    var a = Math.abs(angle);
    return (0 < a && a < DIFF) || (HORIZON - DIFF < a && a < HORIZON + DIFF);
}

function isVertical(angle) {
    var a = Math.abs(angle);
    return (VERTICAL_1 - DIFF < a && a < VERTICAL_1 + DIFF) ||
        (VERTICAL_2 - DIFF < a && a < VERTICAL_2 + DIFF);
}

function calcTiltAngle(a) {
    var tilt;
    if (-DIFF < a && a < DIFF) {
        tilt = a;
    } else if (HORIZON - DIFF < a && a < HORIZON + DIFF) {
        tilt = a - Math.PI;
    } else if (0 - HORIZON - DIFF < a && a < 0 - HORIZON + DIFF) {
        tilt = a + Math.PI;
    }
    return tilt;
}

function drawLine(x1, y1, x2, y2) {
    outContext.strokeStyle = 'red';
    outContext.beginPath();
    outContext.moveTo(x1, y1);
    outContext.lineTo(x2, y2);
    outContext.stroke();
    outContext.closePath();
}

function increase(array,i,e) {
    if (array[i])
        array[i] += e;
    else
        array[i] = e;
}

//譜表ブロック解析
var edge_L, edge_R, edge_T, edge_B;
function blockAnalysis() {
    progressUpdate({ status: 'block Analysis' });
    var hMap_Array = [], vMap_Array = [];

    //傾き補正実行判断
    if (F.AutoTiltCorrect.checked && !tiltCorrected)
        tiltCorrection();

    for (var L of LinesArray) {
        if (L.length > 0.02 * VISIBLE_WIDTH) {
            if (isHorizon(L.angle)) {
                increase(hMap_Array, L.y1, L.length); //横線合計長さ集計
            } else if (isVertical(L.angle)) {
                increase(vMap_Array, L.x1, L.length); //縦線合計長さ集計
            }
        }
    }
    edge_L = findEdge(vMap_Array, 0, VISIBLE_WIDTH / 2);
    edge_R = findEdge(vMap_Array, VISIBLE_WIDTH, VISIBLE_WIDTH * 0.85);
    edge_T = findEdge(hMap_Array, 1, VISIBLE_HEIGHT / 2);
    edge_B = findEdge(hMap_Array, VISIBLE_HEIGHT, VISIBLE_HEIGHT / 2);

    //検出した範囲でエッジBox作成
    rangeL.value = edge_L;
    rangeR.value = edge_R;
    rangeChange(rangeL.id);
    rangeChange(rangeR.id);
    var edgeW = edge_R - edge_L;
    var edgeH = edge_B - edge_T;

    //エッジBox描画
    drawDivBox('edgeBox', 'edgeBox', edge_L, edge_T, edgeW, edgeH);

    progressUpdate({ status: 'block Analysis done' });
    blockAnalyzeDone = true;
    return Promise.resolve(1);
}

//傾き補正
function tiltCorrection() {
    progressUpdate({ status: 'tilt Correction start' });
    var sumTiltAngle = 0, count = 0;
    for (var L of LinesArray) {
        if (L.length > 0.2 * VISIBLE_WIDTH && isHorizon(L.angle)) {
            sumTiltAngle += calcTiltAngle(L.angle);
            count++;
            //drawLine(L.x1,L.y1,L.x2,L.y2);
        }
    }
    var vAngle_radians = sumTiltAngle / count;
    var vAngle_degree = vAngle_radians * TO_DEG;
    if (Math.abs(vAngle_degree) < 0.4) {
        if (!tiltCorrected)
            F.TiltDeg.value = -vAngle_degree;
    } else if (!tiltCorrected && vAngle_degree) {
        //傾き補正
        F.TiltDeg.value = -vAngle_degree;
        rotatImage(-vAngle_radians);
        tiltCorrected = true;
    }
    progressUpdate({ status: 'tilt Correction done' });
}

/**
 * Canvasを回転
 * @param {object} canvas - canvasオブジェクト
 * @param {number} angle - 回転する角度[Rad]
 * @param {object} source - 描画する画像ソース
 */
 function rotatCanvas(canvas,angle,src) {
    var context = canvas.getContext('2d');
    context.save();
    if(canvas==inCanvas)
        context.translate(src.width / 2, src.height / 2);
    else
        context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(angle);
    context.drawImage(src, -(src.width / 2), -(src.height / 2));
    context.restore();
}

function rotatImage(angle) {
    rotatCanvas(inCanvas,angle,source);
}

function rotatImageByDegree(value) {
    rotatImage(value*Math.PI/180);
}

function maxIndex(a, start, end) {
    var index = 0,
        value = -1;
    var increase = start < end ? 1 : -1;
    for (var i = start; !(start < end ^ i < end); i = i + increase) {
        if (value < a[i]) {
            value = a[i];
            index = i
        }
    }
    return index;
}

function notNullLength(arr) {
    var notNullLength = 0;
    arr.forEach(function (item) { if (item) notNullLength++; });
    return notNullLength;
}

function topN(arr, N = 0.5) {
    var arr_new = [];
    arr.forEach(function (item) { if (item) arr_new.push(item); });
    var target = parseInt(arr_new.length * N);
    var temp = arr_new.sort(function (a, b) { return a < b ? 1 : -1 });
    return temp[target];
}

function findEdge(a, start, end) {
    var calc_a = a.slice();
    var index = 0;

    if (start < end)
        calc_a.forEach(function (e, i) { if (e && i > end) calc_a[i] = 0; });
    else
        calc_a.forEach(function (e, i) { if (e && i < end) calc_a[i] = 0; });

    var threshold = topN(calc_a, 0.5);

    var increase = start < end ? 1 : -1;
    for (var i = start; !(start < end ^ i < end); i += increase) {
        if (calc_a[i] && calc_a[i] >= threshold) { index = i; break; }
    }
    return index;
}

//ファイル名から拡張子を取得する関数
function getExt(filename) {
    var pos = filename.lastIndexOf('.');
    if (pos === -1) return '';
    return filename.slice(pos + 1);
}

//画像出力
var outFileName = '01.png';
var outFileNo = 1;

function download() {
    progressUpdate({ status: 'Image downloading' });
    var downloadLink = document.getElementById('hiddenLink');
    if (outCanvas.msToBlob) {
        var blob = outCanvas.msToBlob();
        window.navigator.msSaveBlob(blob, outFileName);
    } else {
        var dataURI = outCanvas.toDataURL('img/png');
        const blob = dataURItoBlob(dataURI);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.download = outFileName;
        a.href = url;
        a.click();
        setTimeout(function () { URL.revokeObjectURL(url); }, Math.max(3000, 1000 * dataURI.length / 1024 * 1024));
    }
    progressUpdate({ status: 'Image download done' });
    creatNextFileName();
    return Promise.resolve(1);
}

function creatNextFileName() {
    outFileNo++;
    if (outFileNo < 10)
        outFileName = '0' + outFileNo + '.png';
    else
        outFileName = outFileNo + '.png';
}

function dataURItoBlob(dataURI) {
    const b64 = atob(dataURI.split(',')[1]);
    const u8 = Uint8Array.from(b64.split(""), e => e.charCodeAt());
    return new Blob([u8], { type: "img/png" });
}

//自動処理開始
function startAutoTrim() {
    autoTrimFlg=true;
    F.autoReTrim.checked=false;
    startBatch();
}
async function startBatch() {
    progressUpdate({ status: 'batch processing' });
    //譜表領域検出
    if (!blockAnalyzeDone)
        await lineDetectLSD();

    //楽器名OCR選択時
    if (F.withOCR.checked ) {
        clearTrimBox();
        await startOCR();
    }
    //相対位置方式選択時
    else if (refeEdge) {
        var offset = refeEdge.top - edge_T;
        offsetYChange(offset);
    } else {
        setRefeEdge();
    }
    //自動処理時
    if (autoTrimFlg) {
        await doTrim();
        await loadNext();
    }
    progressUpdate({ status: 'batch processing done' });
}

async function startOCR() {
    if (!worker) {
        //CDN worker
		worker = new Tesseract.createWorker({
            logger: progressUpdate
		});
        //Local worker
/*		worker = new Tesseract.createWorker({
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
    const { data } = await worker.recognize(input);
    result(data);
}