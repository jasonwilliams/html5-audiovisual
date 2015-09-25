function getAverageVolume(array) {
    var values = 0;
    var average;

    var length = array.length;

    // get all the frequency amplitudes
    for (var i = 0; i < length; i++) {
        values += array[i];
    }

    average = values / length;
    return average;
}

$(function () {

    var audio = new Audio();
    //audio.src = 'http://holodisc.org.uk/stream';
    audio.src = 'test.mp3';
    audio.controls = true;
    audio.autoplay = true;
    document.body.appendChild(audio);

    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();

    var analyser = context.createAnalyser();
    analyser.smoothingTimeConstant = 0.3;
    analyser.fftSize = 1024;

    var procNode = context.createScriptProcessor(2048, 1, 1);
    procNode.onaudioprocess = function () {
        var array =  new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        var average = getAverageVolume(array)
        console.log(average);
    };

    //var gainNode = context.createGain();

    var source = context.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(procNode);
    procNode.connect(context.destination);
    //source.connect(gainNode);
    //gainNode.connect(context.destination);
    //gainNode.gain.value = 0.1;
});
