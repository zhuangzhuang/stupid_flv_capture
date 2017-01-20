/// <reference path="../node_modules/flv.js/d.ts/flv.d.ts" />


class Capture {
    constructor(public flvPlayer: FlvJs.FlvPlayer,
                public videoElement: HTMLVideoElement){
    }
    capture(seek: number, canvas:HTMLCanvasElement, cb: Function){
        var flvPlayer = this.flvPlayer,
            videoElement = this.videoElement;

        flvPlayer.currentTime = seek;
        flvPlayer.play();
        var tempFun = function(){
            flvPlayer.pause();
            videoElement.removeEventListener('playing', tempFun);
            var ctx = canvas.getContext('2d');
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            cb();
        };
        videoElement.addEventListener('playing', tempFun);
    }
}

interface ICaptureElement {
    seek: number;
    canvas: HTMLCanvasElement;
}

class CaptureCanvasManage {    
    constructor(public start: number, 
                public stop: number,
                public step: number,
                public width: number,
                public height: number){
    }
    toArray(){
        var width = this.width, height = this.height;

        var res: Array<ICaptureElement> = [];        
        for(var n = this.start; n <= this.stop; n+= this.step){
            var canvas = <HTMLCanvasElement>document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            res.push({
                seek: n,
                canvas: canvas
            });
        }
        return res;
    }
}

class CaptureManager {
    private capture: Capture = null;
    constructor(flvPlayer: FlvJs.FlvPlayer, videoElement:HTMLVideoElement) {
        this.capture = new Capture(flvPlayer, videoElement);
    }
    step(seek: number, canvas: HTMLCanvasElement, cb: Function){
        this.capture.capture(seek, canvas, cb);
    }

    prepare(){
        console.log('before capture!')
    }

    done(){
        console.log('after capture!')
    }
    run(elements: Array<ICaptureElement>){
        this.prepare();
        var self = this;        
        var n = 0;
        let fn = function(idx){
            if(idx > elements.length-1){
                self.done();
            }else{
                var element = elements[idx];
                self.step(element.seek, element.canvas, () => fn(idx+1));
            }
        }
        fn(0)
    }
}

$(() => {
    $('#video_src').val('res/hello.flv');
    $('#seek_start').val('10');
    $('#seek_end').val('15');

    const STEP = 0.1;

    var videoElement = <HTMLVideoElement>document.getElementById('dummy_video');

    $('#btn-capture').click((ev) => {
        ev.preventDefault();
        var source_url = $('#video_src').val();
        var seek_start = parseFloat($('#seek_start').val());
        var seek_end = parseFloat($('#seek_end').val());

        if(flvjs.isSupported()){
            var flvPlayer = flvjs.createPlayer({
                type: 'flv',
                url: source_url
            });
            flvPlayer.attachMediaElement(videoElement);
            flvPlayer.load();
            flvPlayer.on(flvjs.Events.MEDIA_INFO, (info) => {
                videoElement.width = info.width;
                videoElement.height = info.height;                
            });
                       
            var tmpFun = function(){
                flvPlayer.off(flvjs.Events.LOADING_COMPLETE, tmpFun);
                var captureManager = new CaptureManager(flvPlayer, videoElement);
                var captureCanvas = new CaptureCanvasManage(seek_start, seek_end, 0.1, videoElement.width, videoElement.height);
                var canvasElements = captureCanvas.toArray();
                $('#output').empty();

                var ulElement = document.getElementById('output');                
                canvasElements.forEach(item => {
                    var liElement = document.createElement('li');
                    liElement.appendChild(item.canvas);
                    ulElement.appendChild(liElement);
                });

                setTimeout(() => {
                    var canvasElement = <HTMLCanvasElement>document.getElementById('canvas');
                    captureManager.run(canvasElements);
                }, 0);            
            }
            flvPlayer.on(flvjs.Events.LOADING_COMPLETE, tmpFun);
        }else{
            console.log("not support flvjs");
        }
    });
});