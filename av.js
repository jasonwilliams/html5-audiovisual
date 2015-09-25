// XXX: Workaround for Audio API GC bug, maybe not needed.
var nodes = [];

function getAverageVolume(array) {
    var values = 0;
    var average;
    //console.log(array.length);

    var length = array.length;

    for (var i = 0; i < length; i++) {
        values += array[i];
    }

    average = values / length;
    return average;
}

function setBackground(val) {
    if (val < 0) {
        val = 0;
    }
    if (val > 255) {
        val = 255;
    }

    var rgb = 'rgb(' + val + ',' + val + ',' + val + ')';
    $('#canvas').css('background', rgb);
}

$(function () {
    var audio = new Audio();
    audio.src = '/stream';
    audio.controls = true;
    audio.autoplay = true;
    audio.type = "audio/mpeg";
    audio.setAttribute('id', 'audioElem');
    document.body.appendChild(audio);

    var context = new AudioContext();
    var audioBuffer;
    var sourceNode;
    var analyser;
    var javascriptNode;
    
    // canvas
    var ctx = $("#canvas").get()[0].getContext("2d");
    
    // create gradient
    var gradient = ctx.createLinearGradient(0,0,0,500);
    gradient.addColorStop(1,'#000000');
    gradient.addColorStop(0.75,'#ff0000');
    gradient.addColorStop(0.25,'#ffff00');
    gradient.addColorStop(0,'#ffffff');
    
    // load the sound
    setupAudioNodes();

    // push nodes to analyser
    nodes.push(analyser);
    
    function setupAudioNodes()
    {
        javascriptNode = context.createScriptProcessor(2048, 1, 1);
        javascriptNode.connect(context.destination);
        
        // setup a analyzer
        analyser = context.createAnalyser();
        analyser.smoothingTimeConstant = 0;
        analyser.fftSize = 1024;
        
        // create a buffer source node
        sourceNode = context.createBufferSource();
        sourceNode.connect(analyser);
        analyser.connect(javascriptNode);
        sourceNode.connect(context.destination);
    }

    var procNode = context.createScriptProcessor(2048, 1, 1);

    var smoothAvg = 0.0;
    var smoothing = 0.85;
    procNode.onaudioprocess = function (audioProcessingEvent) {
        var array =  new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        var average = getAverageVolume(array)
        smoothAvg = (1 - smoothing) * average + smoothing * smoothAvg;
        //console.log(average);
        setTimeout(function () {
            setBackground(parseInt(smoothAvg * 0.75, 10));
        }, 0);

        var inputBuffer = audioProcessingEvent.inputBuffer;
        var outputBuffer = audioProcessingEvent.outputBuffer;

        for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
            var inputData = inputBuffer.getChannelData(channel);
            var outputData = outputBuffer.getChannelData(channel);
            for (var sample = 0; sample < inputBuffer.length; sample++) {
                outputData[sample] = inputData[sample];
            }
        }
    };

    nodes.push(procNode);
    
    var source = context.createMediaElementSource(audio);
    nodes.push(source);

    var lpf = context.createBiquadFilter();
    nodes.push(lpf);
    lpf.type = 'lowpass';
    lpf.frequency.value = 50.0;

    source.connect(analyser);
    analyser.connect(procNode);
    procNode.connect(lpf);
    lpf.connect(context.destination);
    
    javascriptNode.onaudioprocess = function()
    {
        var array =  new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        
        ctx.clearRect(0, 0, 1000, 325);
        ctx.fillStyle=gradient;
        
        drawSpectrum(array);
    }
    function drawSpectrum(array) {
        for ( var i = 0; i < (array.length); i++ ){
            var value = array[i];
            ctx.fillRect(i*5,325-value,3,325);
        }
    };

    $('#lpfSlider').slider({
        slide: function (event, ui) {
            var val = Math.log(ui.value) / Math.log(10) * 10000;
            lpf.frequency.value = val;
        }
    });
});
