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
    $('body').css('background', rgb);
}

$(function () {
    var audio = new Audio();
    //audio.src='test.mp3';
    audio.src = '/stream';
    //audio.src = 'http://a.files.bbci.co.uk/media/live/manifesto/audio/simulcast/hls/uk/sbr_high/ak/bbc_radio_one.m3u8';
    //audio.src = 'http://bbcmedia.ic.llnwd.net/stream/bbcmedia_radio1_mf_p';
    audio.controls = true;
    //audio.autoplay = true;
    audio.type = "audio/mpeg";
    document.body.appendChild(audio);

    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();

    var analyser = context.createAnalyser();
    analyser.smoothingTimeConstant = 0.3;
    analyser.fftSize = 1024;

    nodes.push(analyser);

    var procNode = context.createScriptProcessor(2048, 1, 1);
    procNode.onaudioprocess = function (audioProcessingEvent) {
        var array =  new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        var average = getAverageVolume(array)
        //console.log(average);
        setTimeout(function () {
            setBackground(parseInt(average / 2.0, 10));
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

    //var gainNode = context.createGain();

    var source = context.createMediaElementSource(audio);
    nodes.push(source);
    source.connect(analyser);
    analyser.connect(procNode);
    procNode.connect(context.destination);
    //source.connect(gainNode);
    //gainNode.connect(context.destination);
    //gainNode.gain.value = 0.1;
});
