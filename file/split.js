//Band Score Split.js
//Copyright © 2019 kitami.hibiki. All rights reserved.
const vWidth = 708; //画像表示サイズ幅
const vHeight = 1000; //画像表示サイズ幅
const cWidth = 4248; //画像処理時サイズ幅
const cHeight = 6000; //画像処理時サイズ高
const cvRatio = cHeight / vHeight; //cavasサイズ/表示サイズ係数

const cvs = document.getElementById('in'); //inエリアcanvas
cvs.width = cWidth;
cvs.height = cHeight;
let out = document.getElementById('out'); //outエリアcanvas
out.width = cWidth;
out.height = cHeight;

const ctx_in = cvs.getContext('2d')
const ctx_out = out.getContext('2d')

var scale = 1.0 // 拡大率(初期値)

var para = 2 //トリミング枠数
var tvHeight = vHeight * 0.1 //トリミング枠縦幅(初期値)
var tvWidth = vWidth * 0.8 //トリミング枠横幅(描画値、初期値)
var tvStartX = vWidth * 0.1; //トリミング開始位置X(初期値)
var tvEndX = vWidth - tvStartX; //トリミング終了位置X(初期値)
var trimboxY1List = new Array(); //トリミング開始位置Yリスト
trimboxY1List[0] = vHeight * 0.1 //トリミング開始位置Y1(初期値)
trimboxY1List[1] = vHeight * 0.6 //2個目トリミング開始位置Y2(初期値)
var widthLock = false; //横幅ロックフラグ

var Top_margin = vHeight * 0.05; //描画開始位置X（上部余白）

var title_h = 0;
var Para_interval = 15; //段落間隔
var Para_num = 1; //段落カウント

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
    document.getElementById('rangeInput_X1').value = tvStartX;
    document.getElementById('rangeInput_X2').value = tvEndX;
    document.getElementById('rangeInput_Y1').value = vHeight - trimboxY1List[0] - tvHeight / 2;
    document.getElementById('rangeInput_Y2').value = vHeight - trimboxY1List[1] - tvHeight / 2;
    document.getElementById('tvHeight').value = tvHeight;
    document.getElementById('Para_interval').value = Para_interval;
    document.getElementById('title_text').value = 'タイトル';
    load_img('./image/001.png'); //DEBUG用
    drawTrimArea();
}

img.onload = function(_ev) {
    // 画像が読み込まれた
    scale = parseInt(cWidth / img.width)
    draw_canvas()
    // 画像更新
    //console.log("load complete, scaling:"+ scale);
}

function load_img(dataUrl) {
    // 画像の読み込み
    img.src = dataUrl
}

function draw_canvas() {
    // 画像更新
    ctx_in.fillStyle = 'rgb(255, 255, 255)'
    //inエリア背景
    ctx_in.fillRect(0, 0, cWidth, cHeight)
    // 背景を塗る
    ctx_in.drawImage(img, 0, 0, img.width, img.height, 0, 0, img.width * scale, img.height * scale)
    ctx_in.lineWidth = 2;
}
 //トリミング領域描画
function drawTrimArea() {
    for (var i in trimboxY1List) {
        var elem = document.createElement('div');
        elem.className = 'trimArea';
        elem.style.left = tvStartX + 'px';
        elem.style.width = tvWidth + 'px';
        elem.style.height = tvHeight + 'px';
        elem.style.top = trimboxY1List[i] + 'px';
        document.getElementById('inputDiv').appendChild(elem);
    }
}

 //トリミング領域削除/追加
function delTrimArea() {//TO-DO
}
function addTrimArea() {//TO-DO
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
    if (Para_num == 1) {
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
            //title_h = ctx_out.measureText( titleText ).height +10;
            title_h = 20;
        }
    }

    for (var i = 0; i < para; i++) {
        console.log("描画回数:" + Para_num);
        // console.log("scale:" + scale);
        // console.log("cvRatio:" + cvRatio);

        var nextY = paraY1(Para_num) + tvHeight;
        if (nextY > vHeight) {
            window.alert('ページ末尾に到達しました');
            break;
        }
        ;
        //画面位置to実際位置座標変換係数　
        rate = 1 / scale * cvRatio;
		//rate = scale_vi;
        //入力部
        sx = tvStartX * rate;
        sy = trimboxY1List[(Para_num - 1) % 2] * rate;
        sWidth = tvWidth * rate;
        sHeight = tvHeight * rate;
        //出力部
        dx = (vWidth - tvWidth) / 2 * cvRatio;
        dy = paraY1(Para_num) * cvRatio;
        dWidth = sWidth * scale;
        dHeight = sHeight * scale;

        ctx_out.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        Para_num++;
    }
}
 //n段目から描画位置Y1を計算
function paraY1(n) {
    if (n == 1)
        return Top_margin + title_h
    else
        return Top_margin + title_h + n*Para_interval + (n - 1) * tvHeight
}

var TrimAreaList = document.getElementsByClassName('trimArea');

function rangeXChange(Xn,val) {
    for (var i in TrimAreaList) {
        if (isNaN(i))
            break;
        //左端変更時
        if(Xn==1){
            tvStartX = parseInt(val);
			tvEndX = tvStartX+tvWidth;
            TrimAreaList[i].style.left = tvStartX + 'px';
            if(!widthLock){
                tvWidth = (tvEndX - val);
                TrimAreaList[i].style.width = tvWidth + 'px';
            } else {
				document.getElementById('rangeInput_X2').value = tvEndX;
			}
        }
        //右端変更時
        if(Xn==2){
            tvEndX = parseInt(val);
            if(widthLock){
                TrimAreaList[i].style.left = (tvEndX - tvWidth) + 'px';
            } else {
                tvWidth = (val - tvStartX);
                TrimAreaList[i].style.width = tvWidth + 'px';
            }
        }
    }
}

function rangeYChange(trimAreaNo, val) {
    var index = trimAreaNo - 1;
    trimboxY1List[index] = vHeight - val - tvHeight / 2;
    TrimAreaList[index].style.top = trimboxY1List[index] + 'px';
}
function tvHeightChange(val) {
    for (var i in TrimAreaList) {
        if (isNaN(i))
            break;
        var hChange = parseInt(val - tvHeight) / 2;

        trimboxY1List[i] = trimboxY1List[i] - hChange;

        TrimAreaList[i].style.height = parseInt(val) + 'px';
        TrimAreaList[i].style.top = trimboxY1List[i] + 'px';
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
 //出力区域クリア
function clean_img() {
    ctx_out.clearRect(0, 0, cWidth, cHeight)
    Para_num = 1
	title_h = 0
}

//以下、OCR関連
var language = "eng";
var worker = new Tesseract.createWorker({
  logger: progressUpdate,
});

function getInputCanvas() {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
	var useWidth = img.Width / 2;
    canvas.width = useWidth;
    canvas.height = img.height;
    ctx.drawImage(img,0, 0, useWidth, img.height);
    return canvas;
}

async function startOCR(){
	//var input = ctx_in.getImageData(0, 0, tvStartX*cvRatio, img.height*scale);
	var input = getInputCanvas();

	//demo_instructions.style.display = 'none'
	//output_text.style.display = 'block'
	//output_text.innerHTML = ''

	await worker.load();
	await worker.loadLanguage(language);
	await worker.initialize(language);
	const { data } = await worker.recognize(cvs);
	result(data);
}

var divbox = {
	borderWidth : 0,
    borderColor : 'red',
	className : 'divbox',

	draw: function(x,y,width,height) {
	var elem = document.createElement('div');
			elem.className = this.className;
			elem.style.left = x/cvRatio + 'px';
			elem.style.top = y/cvRatio + 'px';
			elem.style.width = width/cvRatio + 'px';
			elem.style.height = height/cvRatio + 'px';
			elem.style.border = this.borderWidth+'px solid '+this.borderColor;
			document.getElementById('inputDiv').appendChild(elem);
	}
}

function result(res){
	console.log('result was:', res)

	progressUpdate({ status: 'done', data: res })

	//結果配列から単語単位で取り出す
	res.words.forEach(function(w){
		var b = w.bbox;

		divbox.borderWidth = 2
		divbox.borderColor = 'red'
		divbox.className = 'ocrText'
		divbox.draw(b.x0, b.y0, b.x1-b.x0, b.y1-b.y0)

		//ioctx.beginPath()
		//ioctx.moveTo(w.baseline.x0, w.baseline.y0)
		//ioctx.lineTo(w.baseline.x1, w.baseline.y1)
		// ioctx.strokeStyle = 'green'
		// ioctx.stroke()
	})
}

function progressUpdate(packet){
	var log = document.getElementById('log');

	if(log.firstChild && log.firstChild.status === packet.status){
		if('progress' in packet){
			var progress = log.firstChild.querySelector('progress')
			progress.value = packet.progress
		}
	}else{
		var line = document.createElement('div');
		line.status = packet.status;
		var status = document.createElement('div')
		status.className = 'status'
		status.appendChild(document.createTextNode(packet.status))
		line.appendChild(status)

		if('progress' in packet){
			var progress = document.createElement('progress')
			progress.value = packet.progress
			progress.max = 1
			line.appendChild(progress)
		}


		if(packet.status == 'done'){
			var pre = document.createElement('pre')
			pre.appendChild(document.createTextNode(packet.data.text))
			line.innerHTML = ''
			line.appendChild(pre)
		}

		log.insertBefore(line, log.firstChild)
	}
}
