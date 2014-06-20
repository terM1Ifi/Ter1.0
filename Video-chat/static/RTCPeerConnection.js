window.moz = !!navigator.mozGetUserMedia;
var chromeVersion = !!navigator.mozGetUserMedia ? 0 : parseInt(navigator.userAgent.match( /Chrom(e|ium)\/([0-9]+)\./ )[2]);

function RTCPeerConnection(options) {
    var w = window,
    //Ouverture d'une peer connection
        PeerConnection = w.mozRTCPeerConnection || w.webkitRTCPeerConnection,
        SessionDescription = w.mozRTCSessionDescription || w.RTCSessionDescription,
        IceCandidate = w.mozRTCIceCandidate || w.RTCIceCandidate;
    // On définit un tableau de serveurs ice selon les différentes versions des navigateurs
    var iceServers = [];
    //MOZILLA
    if (moz) {
        iceServers.push({
            url: 'stun:23.21.150.121'
        });

        iceServers.push({
            url: 'stun:stun.services.mozilla.com'
        });
    }
    //NON MOZILLA
    if (!moz) {
        iceServers.push({
            url: 'stun:stun.l.google.com:19302'
        });

        iceServers.push({
            url: 'stun:stun.anyfirewall.com:3478'
        });
    }
    //NON MOZILLA ET CHROME INFERIEUR A 28
    if (!moz && chromeVersion < 28) {
        iceServers.push({
            url: 'turn:homeo@turn.bistri.com:80',
            credential: 'homeo'
        });
    }
    //NON MOZILLA ET CHROME >=28
    if (!moz && chromeVersion >= 28) {
        iceServers.push({
            url: 'turn:turn.bistri.com:80',
            credential: 'homeo',
            username: 'homeo'
        });

        iceServers.push({
            url: 'turn:turn.anyfirewall.com:443?transport=tcp',
            credential: 'webrtc',
            username: 'webrtc'
        });
    }

    if (options.iceServers) iceServers = options.iceServers;

    iceServers = {
        iceServers: iceServers
    };

    console.debug('ice-servers', JSON.stringify(iceServers.iceServers, null, '\t'));

    var optional = {
        optional: []
    };
    
    if (!moz) {
        optional.optional = [{
            DtlsSrtpKeyAgreement: true
        }];

        if (options.onChannelMessage)
            optional.optional = [{
                RtpDataChannels: true
            }];
    }

    console.debug('optional-arguments', JSON.stringify(optional.optional, null, '\t'));
    // Création d'une peer Connection avec comme paramètres ICE Servers(STUN ou TURN) et RtpDataChannels
    var peer = new PeerConnection(iceServers, optional);

    //openOffererChannel();
    // Retourne localement les candidat ICE qu'on pourra passer aux autres pairs à partir des  sockets 
    peer.onicecandidate = function(event) {
        if (event.candidate)
            options.onICE(event.candidate);
    };

    // attachStream = MediaStream;
    if (options.attachStream) peer.addStream(options.attachStream);

    // attachStreams[0] = audio-stream;
    // attachStreams[1] = video-stream;
    // attachStreams[2] = screen-capturing-stream;
    if (options.attachStreams && options.attachStream.length) {
        var streams = options.attachStreams;
        for (var i = 0; i < streams.length; i++) {
            //Attache la vidéo locale et le microphone aux autres pairs
            peer.addStream(streams[i]);
        }
    }
    // Retourne la vidéo et le microphone des autres pairs 
    peer.onaddstream = function(event) {
        var remoteMediaStream = event.stream;

        // onRemoteStreamEnded(MediaStream)
        remoteMediaStream.onended = function() {
            if (options.onRemoteStreamEnded) options.onRemoteStreamEnded(remoteMediaStream);
        };

        // onRemoteStream(MediaStream)
        if (options.onRemoteStream) options.onRemoteStream(remoteMediaStream);

        console.debug('on:add:stream', remoteMediaStream);
    };
    // Contraintes sur les médias
    var constraints = options.constraints || {
        optional: [],
        mandatory: {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true
        }
    };

    console.debug('sdp-constraints', JSON.stringify(constraints.mandatory, null, '\t'));

    // onOfferSDP(RTCSessionDescription)
    // Fonction pour envoyer une offre SDP à un navigateur (format de description des paramètres d'initialisation du media streaming)
    // Avant d'envoyer une offre SDP,les pairs doivent être présents avec une video streaming local
    function createOffer() {
        if (!options.onOfferSDP) return;

        peer.createOffer(function(sessionDescription) {
            sessionDescription.sdp = setBandwidth(sessionDescription.sdp);
            peer.setLocalDescription(sessionDescription);
            options.onOfferSDP(sessionDescription);

            console.debug('offer-sdp', sessionDescription.sdp);
        }, onSdpError, constraints);
    }

    // onAnswerSDP(RTCSessionDescription)
    //Fonction pour répondre à une offre SDP
    function createAnswer() {
        if (!options.onAnswerSDP) return;

        //options.offerSDP.sdp = addStereo(options.offerSDP.sdp);
        console.debug('offer-sdp', options.offerSDP.sdp);
        peer.setRemoteDescription(new SessionDescription(options.offerSDP), onSdpSuccess, onSdpError);
        peer.createAnswer(function(sessionDescription) {
            sessionDescription.sdp = setBandwidth(sessionDescription.sdp);
            peer.setLocalDescription(sessionDescription);
            options.onAnswerSDP(sessionDescription);
            console.debug('answer-sdp', sessionDescription.sdp);
        }, onSdpError, constraints);
    }

    // if Mozilla Firefox & DataChannel; offer/answer will be created later
    if ((options.onChannelMessage && !moz) || !options.onChannelMessage) {
        createOffer();
        createAnswer();
    }

    // options.bandwidth = { audio: 50, video: 256, data: 30 * 1000 * 1000 }
    var bandwidth = options.bandwidth;
    // Le maximum de bande passante pouvant -être utilisé par chaque port RTP peut-être contrôlé en utilisant"b=AS"
    //Cette fonction permet de défini la bande passante
    function setBandwidth(sdp) {
        if (moz || !bandwidth /* || navigator.userAgent.match( /Android|iPhone|iPad|iPod|BlackBerry|IEMobile/i ) */) return sdp;

        // remove existing bandwidth lines
        sdp = sdp.replace( /b=AS([^\r\n]+\r\n)/g , '');
        // définit la bande passante pour l'audio
        if (bandwidth.audio) {
            sdp = sdp.replace( /a=mid:audio\r\n/g , 'a=mid:audio\r\nb=AS:' + bandwidth.audio + '\r\n');
        }
        // définit la bande passante pour la vidéo
        if (bandwidth.video) {
            sdp = sdp.replace( /a=mid:video\r\n/g , 'a=mid:video\r\nb=AS:' + bandwidth.video + '\r\n');
        }

        if (bandwidth.data) {
            sdp = sdp.replace( /a=mid:data\r\n/g , 'a=mid:data\r\nb=AS:' + bandwidth.data + '\r\n');
        }

        return sdp;
    }

   
   
    // fake:true is also available on chrome under a flag!

    function useless() {
        console.error('Error in fake:true');
    }

    function onSdpSuccess() {
    }
    // Une erreur avec SDP
    function onSdpError(e) {
        var message = JSON.stringify(e, null, '\t');

        if (message.indexOf('RTP/SAVPF Expects at least 4 fields') != -1) {
            message = 'It seems that you are trying to interop RTP-datachannels with SCTP. It is not supported!';
        }

        console.error('onSdpError:', message);
    }

    return {
        // LA REPONSE SDP qu'on renvoie à celui qui crée l'offre
        addAnswerSDP: function(sdp) {
            console.debug('adding answer-sdp', sdp.sdp);
            peer.setRemoteDescription(new SessionDescription(sdp), onSdpSuccess, onSdpError);
        },
        // Ajout d'un candidat ICE  envoyé par un autre pair
        addICE: function(candidate) {
            peer.addIceCandidate(new IceCandidate({
                sdpMLineIndex: candidate.sdpMLineIndex,
                candidate: candidate.candidate
            }));

            console.debug('adding-ice', candidate.candidate);
        },

        peer: peer,
      
    };
}

// getUserMedia
// Demande à l'utilisateur la possibilité d'accéder aux médias
var video_constraints = {
    mandatory: { },
    optional: []
};

function getUserMedia(options) {
    var n = navigator,
        media;
    n.getMedia = n.webkitGetUserMedia || n.mozGetUserMedia;
    n.getMedia(options.constraints || {
            audio: true,
            video: video_constraints
        }, streaming, options.onerror || function(e) {
            console.error(e);
        });

    function streaming(stream) {
        var video = options.video;
        if (video) {
            video[moz ? 'mozSrcObject' : 'src'] = moz ? stream : window.webkitURL.createObjectURL(stream);
            video.play();
        }
        options.onsuccess && options.onsuccess(stream);
        media = stream;
    }

    return media;
}
