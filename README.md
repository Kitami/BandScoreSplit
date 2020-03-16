# BandScoreSplit  

BandScoreSplit is a tool for dividing band scores(Or orchestra score, etc.) into parts scores. that is built with HTML5 Canvas. only use for image(JPG,PNG) or PDF files. Files will not be sent to the server, all processing is completed locally.  

BandScoreSplitは画像形式のバンドスコア(またはオーケストラスコアなど)をパート譜に抽出するためのツールです。HTML5のCanvasを使用して構築したものです。処理できるのは画像（JPG,PNG）とPDF。処理するファイルはサーバーに転送されることはありません、全部処理はローカルで完結します。  

BandScoreSplit是使用HTML5 Canvas構建的用於將樂譜（樂團樂譜等）劃分為單獨樂器的樂譜的工具，僅用於圖像（JPG，PNG）或PDF文件，文件不會發送到服務器，所有處理在本地完成。

## Online demo:  
+ English https://kitami.github.io/BandScoreSplit/main_en.html  
+ 日本語版 https://kitami.github.io/BandScoreSplit/main.html  
+ 中文版 https://kitami.github.io/BandScoreSplit/main_cn.html  

## What can it do  
1.Automatically identify staff border  
2.Automatically corrects the tilt of scanned images  
3.After trimming once, perform the same trimming process (at the relative position to the staff border) on other images  
4.Automatically output image when page is full  
5.OCR the instrument name on left   

できること:  
1.自動的に譜表の外枠を特定  
2.スキャンした画像の傾きを自動補正  
3.一度トリミングした後、他の画像に対して同じ(外枠に対する相対位置で)トリミング処理を行う  
4.ページがいっぱいになったら自動的に画像を出力する  
5.ガイド線左側の楽器名に対してOCR（文字認識）を行う  

主要功能:  
1.自動識別譜表邊界  
2.自動校正掃描圖像的傾斜  
3.修剪一次後，在其他圖像上執行相同的修剪過程（根據到上側邊界的相對位置）  
4.頁面填滿時自動輸出圖像  
5.處理左側有樂器名稱的樂譜時，可以使用OCR(光學文字識別)功能定位譜表位置  

## Using module or sources  
利用しているモジュール/使用的模組
+ [wellflat/Line Segment Detector(LSD) module (MIT License)](https://github.com/wellflat/imageprocessing-labs/tree/master/cv/lsd)
+ [naptha/tesseract.js](https://github.com/naptha/tesseract.js)
+ [mozilla/pdf.js](https://github.com/mozilla/pdf.js)

## Using Guide  
1.Load an image or PDF file by selecting a file button.  
2.adding a trim box, and adjust the position and height (you can use OCR button to locate it accurately)  
3.cilck trim button or "Batch start" button, The results will be displayed in the output-area and will be downloaded automatically when one page is done.  

使い方:  
1.ファイル選択で画像ファイルを読み込ませる  
2.トリミング枠を追加して、位置と縦幅を調整する (OCRを実行すると結果は位置特定に使える)  
3.トリミングボタン、または「後続ページ処理」ボタンを押す、結果は右側のエリアに表示されて、1ページが使い終わったら自動的ダウンロードされる  

使用方法:  
1.選擇一個或多個圖像文件  
2.按下「追加」按鈕用來追加剪切框，調節左上角的參數以及按住拖動剪切框到想要剪切的譜表的位置 (Part名OCR可以用來確定剪切框縱軸位置)    
3.按下「剪切」按鈕、或者「自動化處理」按鈕，剪切結果會在右側輸出圖像區域表示、輸出圖像區域使用到末尾的時候會自動保存圖片，自動化處理時會自動切換到輸入圖像的下一頁進行相同的操作（會根據到譜表上側的邊緣相對位置來剪切，而不是絕對位置，所以掃描的樂譜即使有輕微偏移也可以正確輸出圖像）  

## Questions  
質問  
File an issue:
+ https://github.com/Kitami/BandScoreSplit/issues/new

Follow twitter: @KitamiHibiki
+ https://twitter.com/KitamiHibiki
