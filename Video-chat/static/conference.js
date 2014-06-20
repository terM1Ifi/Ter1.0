//Ici, on gère l'envoi des éléments nécessaires à l'interconnexion des pairs via les sockets
var conference = function(config) {
    // Chaque pair a un identifiant unique qu'on définit de manière aléatoire via la méthode uniqueToken
    var self = {
        userToken: uniqueToken()
    };
    var channels = '--', isbroadcaster;
    var isGetNewRoom = true;
    var sockets = [];
    var defaultSocket = { };
    // Ouverture d'une socket par défaut
    function openDefaultSocket() {
        defaultSocket = config.openSocket({
            onmessage: onDefaultSocketResponse,
            callback: function(socket) {
                defaultSocket = socket;
            }
        });
    }

    function onDefaultSocketResponse(response) {
        if (response.userToken == self.userToken) return;

        if (isGetNewRoom && response.roomToken && response.broadcaster) config.onRoomFound(response);

        if (response.newParticipant && self.joinedARoom && self.broadcasterid == response.userToken) onNewParticipant(response.newParticipant);

        if (response.userToken && response.joinUser == self.userToken && response.participant && channels.indexOf(response.userToken) == -1) {
            channels += response.userToken + '--';
            openSubSocket({
                isofferer: true,
                channel: response.channel || response.userToken
            });
        }

        // to make sure room is unlisted if owner leaves		
        if (response.left && config.onRoomClosed) {
            config.onRoomClosed(response);
        }
    }
    // Ouverture d'une sous socket
    function openSubSocket(_config) {
        if (!_config.channel) return;
        // objet socketConfig
        var socketConfig = {
            // 2 attributs: le canal et le message reçu
            channel: _config.channel,
            onmessage: socketResponse,
            onopen: function() {
                // Si c'est un offreur et que ce n'est pas un pair, on l'initialise
                if (isofferer && !peer) initPeer();
                //on stocke la socket dans le tableau de sockets
                sockets[sockets.length] = socket;
            }
        };

        socketConfig.callback = function(_socket) {
            socket = _socket;
            this.onopen();
        };

        var socket = config.openSocket(socketConfig),
            isofferer = _config.isofferer,
            gotstream,
            video = document.createElement('video'),
            inner = { },
            peer;
        //Objet peerConfig
       
        var peerConfig = {
            //Stream du client qu'on a besoin de partager avec un autre pair
            attachStream: config.attachStream,
             //quand on a un candidat ICE, on envoie son identifiant ainsi que ses paramètres réseaux
            onICE: function(candidate) {
                socket.send({
                    userToken: self.userToken,
                    candidate: {
                        sdpMLineIndex: candidate.sdpMLineIndex,
                        candidate: JSON.stringify(candidate.candidate)
                    }
                });
            },
            // quand le flux vidéo distant arrive
            onRemoteStream: function(stream) {
                if (!stream) return;

                video[moz ? 'mozSrcObject' : 'src'] = moz ? stream : webkitURL.createObjectURL(stream);
                video.play();

                _config.stream = stream;
                onRemoteStreamStartsFlowing();
            },
            onRemoteStreamEnded: function(stream) {
                if (config.onRemoteStreamEnded)
                    config.onRemoteStreamEnded(stream, video);
            }
        };
        //Initialisation du pair 
        function initPeer(offerSDP) {
            // Si ce n'est pas un offreur, on envoie la réponse 
            if (!offerSDP) {
                peerConfig.onOfferSDP = sendsdp;
            } else {
                peerConfig.offerSDP = offerSDP;
                peerConfig.onAnswerSDP = sendsdp;
            }

            peer = RTCPeerConnection(peerConfig);
        }

        function onRemoteStreamStartsFlowing() {
            if (!(video.readyState <= HTMLMediaElement.HAVE_CURRENT_DATA || video.paused || video.currentTime <= 0)) {
                gotstream = true;

                if (config.onRemoteStream)
                    config.onRemoteStream({
                        video: video,
                        stream: _config.stream
                    });

                if (isbroadcaster && channels.split('--').length > 3) {
                    /* broadcasting newly connected participant for video-conferencing! */
                    defaultSocket.send({
                        newParticipant: socket.channel,
                        userToken: self.userToken
                    });
                }

            } else setTimeout(onRemoteStreamStartsFlowing, 50);
        }
        //Envoie l'identifiant unique du pair ainsi que le paramètre d'initialisation média (sdp) au format JSON
        function sendsdp(sdp) {
            socket.send({
                userToken: self.userToken,
                sdp: JSON.stringify(sdp)
            });
        }
        // Fonction appelée une fois qu'on a les paramètres SDP ainsi que les paramètres réseaux du candidat
        function socketResponse(response) {
            if (response.userToken == self.userToken) return;
            // Quand on reçoit la réponse sdp , on appelle la méthode selfInvoker() qui permet au pair 
            //ayant déposer l'offre de l'ajouter 
            if (response.sdp) {
                inner.sdp = JSON.parse(response.sdp);
                selfInvoker();
            }
            // Quand on reçoit les paramètres réseaux du candidat
            if (response.candidate && !gotstream) {
                if (!peer) console.error('missed an ice', response.candidate);
                //on ajoute les paramètres réseaux du candidat
                else
                    peer.addICE({
                        sdpMLineIndex: response.candidate.sdpMLineIndex,
                        candidate: JSON.parse(response.candidate.candidate)
                    });
            }

            if (response.left) {
                if (peer && peer.peer) {
                    peer.peer.close();
                    peer.peer = null;
                }
            }
        }

        var invokedOnce = false;

        function selfInvoker() {
            if (invokedOnce) return;

            invokedOnce = true;
            //Si c'est un offreur, on ajoute la réponse sinon, on initialise le pair
            if (isofferer) peer.addAnswerSDP(inner.sdp);
            else initPeer(inner.sdp);
        }
    }
    // si la personne quitte la session, on supprime la socket qui lui correspond
    function leave() {
        var length = sockets.length;
        for (var i = 0; i < length; i++) {
            var socket = sockets[i];
            if (socket) {
                socket.send({
                    left: true,
                    userToken: self.userToken
                });
                delete sockets[i];
            }
        }

        // if owner leaves; try to remove his room from all other users side
        if (isbroadcaster) {
            defaultSocket.send({
                left: true,
                userToken: self.userToken,
                roomToken: self.roomToken
            });
        }

        if (config.attachStream) config.attachStream.stop();
    }
    // Quand un utilisateur quitte la page
    window.onbeforeunload = function() {
        leave();
    };

    window.onkeyup = function(e) {
        if (e.keyCode == 116) leave();
    };

    function startBroadcasting() {
        defaultSocket && defaultSocket.send({
            roomToken: self.roomToken,
            roomName: self.roomName,
            broadcaster: self.userToken
        });
        setTimeout(startBroadcasting, 3000);
    }
    //Etablissement d' un nouveau canal pour un nouveau participant
    function onNewParticipant(channel) {
        if (!channel || channels.indexOf(channel) != -1 || channel == self.userToken) return;
        channels += channel + '--';

        var new_channel = uniqueToken();
        openSubSocket({
            channel: new_channel
        });

        defaultSocket.send({
            participant: true,
            userToken: self.userToken,
            joinUser: channel,
            channel: new_channel
        });
    }
    //Identifiant unique générée de façon aléatoire
    function uniqueToken() {
        var s4 = function() {
            return Math.floor(Math.random() * 0x10000).toString(16);
        };
        return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
    }

    openDefaultSocket();
    return {
        createRoom: function(_config) {
            self.roomName = _config.roomName || 'Anonymous';
            self.roomToken = uniqueToken();

            isbroadcaster = true;
            isGetNewRoom = false;
            startBroadcasting();
        },
        joinRoom: function(_config) {
            self.roomToken = _config.roomToken;
            isGetNewRoom = false;

            self.joinedARoom = true;
            self.broadcasterid = _config.joinUser;

            openSubSocket({
                channel: self.userToken
            });

            defaultSocket.send({
                participant: true,
                userToken: self.userToken,
                joinUser: _config.joinUser
            });
        },
        leaveRoom: leave
    };
};
