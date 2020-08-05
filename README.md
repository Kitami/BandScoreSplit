# BandScoreSplit  
BandScoreSplit is a tool for dividing band scores(Or orchestra score, etc.) into parts scores. that is built with HTML5 Canvas. only use for image(JPG,PNG) or PDF files. Files will not be sent to the server, all processing is completed locally. (OCR function needs to go through HTTP server, or use the Online demo)  

BandScoreSplitは画像形式のバンドスコア(またはオーケストラスコアなど)をパート譜に抽出するためのツールです。HTML5のCanvasを使用して構築したものです。処理できるのは画像（JPG,PNG）とPDF。処理するファイルはサーバーに転送されることはありません、全部処理はローカルで完結します。(OCR機能を使用するにはHTTPサーバ経由か、下方のOnline demoのリンクから使用してください)  

BandScoreSplit是使用HTML5 Canvas構建的用於將樂譜（樂團樂譜等）劃分為單獨樂器的樂譜的工具，僅用於圖像（JPG，PNG）或PDF文件，文件不會發送到服務器，所有處理在本地完成。(OCR功能需要構建網頁伺服器，或使用下方的線上鏡像)  

## Online demo:  
+ English https://kitami.github.io/BandScoreSplit/main_en.html  
+ 日本語版 https://kitami.github.io/BandScoreSplit/main.html  
+ 中文版 https://kitami.github.io/BandScoreSplit/main_cn.html  

## What can it do  
1.Automatically identify staff border  
2.Automatically corrects the tilt of scanned images  
3.After trimming once, perform the same trimming process (at the relative position to the staff border,or Part name position) on other images  
4.Automatically output image when page is full  
5.OCR the instrument name on left   

できること:  
1.自動的に譜表の外枠を特定  
2.スキャンした画像の傾きを自動補正  
3.一度トリミングした後、他の画像に対して同じ位置(外枠に対する相対位置、または楽器名の位置)のトリミング処理を行う  
4.ページがいっぱいになったら自動的に画像を出力する  
5.ガイド線左側の楽器名に対してOCR（文字認識）を行う  

主要功能:  
1.自動識別譜表邊界  
2.自動校正掃描圖像的傾斜  
3.修剪一次後，在其他圖像上執行相同的修剪過程（根據到上側邊界的相對位置，或使用樂器名的位置）  
4.頁面填滿時自動輸出圖像  
5.處理左側有樂器名稱的樂譜時，可以使用OCR(光學文字識別)功能定位譜表位置  

## Using module or sources  
利用しているモジュール/使用的模組
+ [wellflat/Line Segment Detector(LSD) module (MIT License)](https://github.com/wellflat/imageprocessing-labs/tree/master/cv/lsd)
+ [naptha/tesseract.js](https://github.com/naptha/tesseract.js)
+ [mozilla/pdf.js](https://github.com/mozilla/pdf.js)

## Using Guide  
1.Load an image or PDF file by selecting a file button.  
2.adding a trim box, and adjust the position and height, or use the Part Name OCR.  
3.The results will be displayed in the output-area.  

batch processing  
click "Batch start" button. 

使い方:  
1.ファイル選択で画像ファイルを読み込ませる  
2.トリミング枠を追加して、位置と縦幅を調整する、または楽器名OCRを使う  
3.結果は右側のエリアに表示される  
  
自動化処理  
「処理開始」ボタンをクリックする  

使用方法:  
1.選擇一個或多個圖像文件  
2.按下「追加」按鈕用來追加剪切框，調節左上角的參數以及按住拖動剪切框到想要剪切的譜表的位置，或使用樂器名OCR  
3.剪切結果會在右側輸出圖像區域表示  
  
自動化處理  
點擊「處理開始」按鈕  

## Questions  
質問  
File an issue:
+ https://github.com/Kitami/BandScoreSplit/issues/new

Follow twitter: @KitamiHibiki
+ https://twitter.com/KitamiHibiki
