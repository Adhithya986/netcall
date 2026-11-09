import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { SOCKET_EVENTS, CallType, CallStatus } from '@netcall/shared';
import { socketService } from '../services/socket';
import { api } from '../services/api';
import { soundFX } from '../hooks/useSound';
import { useAuth } from './AuthContext';

export type CallUIState = 'IDLE' | 'OUTGOING_RINGING' | 'INCOMING_RINGING' | 'CONNECTED' | 'ENDED';

export interface ActiveCallData {
  callId: string;
  callType: CallType;
  peerId?: string;
  peerName: string;
  peerUsername?: string;
  destinationNumber?: string;
  isMock?: boolean;
}

interface CallContextType {
  callState: CallUIState;
  currentCall: ActiveCallData | null;
  isMuted: boolean;
  isSpeakerOn: boolean;
  durationSeconds: number;
  peerMuted: boolean;
  error: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (params: {
    callType: CallType;
    targetUserId?: string;
    targetUsername?: string;
    targetFullName?: string;
    destinationNumber?: string;
  }) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: (reason?: string) => Promise<void>;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  clearError: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshWallet } = useAuth();
  const [callState, setCallState] = useState<CallUIState>('IDLE');
  const [currentCall, setCurrentCall] = useState<ActiveCallData | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [peerMuted, setPeerMuted] = useState<boolean>(false);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);
  const iceServersRef = useRef<RTCIceServer[]>([
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]);

  // Audio elements for remote playback
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Remote Audio Element in DOM
  useEffect(() => {
    if (!remoteAudioRef.current && typeof document !== 'undefined') {
      const audio = document.createElement('audio');
      audio.autoplay = true;
      audio.id = 'netcall-remote-audio';
      document.body.appendChild(audio);
      remoteAudioRef.current = audio;
    }

    return () => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.remove();
        remoteAudioRef.current = null;
      }
    };
  }, []);

  // Fetch STUN/TURN servers
  useEffect(() => {
    api.getIceServers().then(res => {
      if (res.data?.iceServers?.length) {
        iceServersRef.current = res.data.iceServers;
      }
    }).catch(e => console.warn('Using default public STUN servers'));
  }, []);

  // Timer runner
  useEffect(() => {
    if (callState === 'CONNECTED') {
      setDurationSeconds(0);
      timerRef.current = setInterval(() => {
        setDurationSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Socket event subscriptions
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Incoming Call Handler
    socket.on(SOCKET_EVENTS.CALL_INCOMING, (data: { callId: string; caller: any; callType: CallType }) => {
      console.log('[CallContext] Incoming call received:', data);
      setCurrentCall({
        callId: data.callId,
        callType: data.callType,
        peerId: data.caller.id,
        peerName: data.caller.fullName,
        peerUsername: data.caller.username
      });
      setCallState('INCOMING_RINGING');
      soundFX.startRinging();
    });

    // Callee Accepted
    socket.on(SOCKET_EVENTS.CALL_ACCEPTED, async (data: { callId: string }) => {
      console.log('[CallContext] Call accepted by peer:', data);
      soundFX.stopRinging();
      soundFX.playConnectedTone();
      setCallState('CONNECTED');

      // Caller creates offer
      if (currentCall && peerConnectionRef.current) {
        try {
          const offer = await peerConnectionRef.current.createOffer({
            offerToReceiveAudio: true
          });
          await peerConnectionRef.current.setLocalDescription(offer);
          socket.emit(SOCKET_EVENTS.CALL_OFFER, {
            callId: data.callId,
            sdp: offer
          });
        } catch (err: any) {
          console.error('[WebRTC] Error creating offer:', err);
        }
      }
    });

    // Callee Rejected
    socket.on(SOCKET_EVENTS.CALL_REJECTED, (data: { callId: string; reason?: string }) => {
      soundFX.stopRinging();
      soundFX.playEndTone();
      setError('Call was declined');
      cleanupCallSession();
    });

    // Callee Unavailable / Offline
    socket.on(SOCKET_EVENTS.CALL_UNAVAILABLE, (data: { reason: string; message: string }) => {
      soundFX.stopRinging();
      soundFX.playEndTone();
      setError(data.message || 'User is unavailable');
      cleanupCallSession();
    });

    // WebRTC Offer received (on receiver side)
    socket.on(SOCKET_EVENTS.CALL_OFFER, async (data: { callId: string; sdp: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] Offer received:', data.callId);
      if (!peerConnectionRef.current) {
        await setupPeerConnection(data.callId);
      }

      try {
        await peerConnectionRef.current!.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await peerConnectionRef.current!.createAnswer();
        await peerConnectionRef.current!.setLocalDescription(answer);

        socket.emit(SOCKET_EVENTS.CALL_ANSWER, {
          callId: data.callId,
          sdp: answer
        });
      } catch (err: any) {
        console.error('[WebRTC] Error handling offer:', err);
      }
    });

    // WebRTC Answer received (on caller side)
    socket.on(SOCKET_EVENTS.CALL_ANSWER, async (data: { callId: string; sdp: RTCSessionDescriptionInit }) => {
      console.log('[WebRTC] Answer received:', data.callId);
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
        } catch (err: any) {
          console.error('[WebRTC] Error setting remote description answer:', err);
        }
      }
    });

    // WebRTC ICE Candidate received
    socket.on(SOCKET_EVENTS.CALL_ICE_CANDIDATE, async (data: { callId: string; candidate: RTCIceCandidateInit }) => {
      if (peerConnectionRef.current && data.candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('[WebRTC] Error adding ICE candidate:', err);
        }
      }
    });

    // Peer Mute Toggled
    socket.on(SOCKET_EVENTS.CALL_PEER_MUTED, (data: { isMuted: boolean }) => {
      setPeerMuted(data.isMuted);
    });

    // Call Ended
    socket.on(SOCKET_EVENTS.CALL_ENDED, (data: { callId: string; reason?: string }) => {
      soundFX.stopRinging();
      soundFX.playEndTone();
      cleanupCallSession();
      refreshWallet();
    });

    // Call Error
    socket.on(SOCKET_EVENTS.CALL_ERROR, (data: { message: string }) => {
      soundFX.stopRinging();
      setError(data.message);
      cleanupCallSession();
    });

    return () => {
      socket.off(SOCKET_EVENTS.CALL_INCOMING);
      socket.off(SOCKET_EVENTS.CALL_ACCEPTED);
      socket.off(SOCKET_EVENTS.CALL_REJECTED);
      socket.off(SOCKET_EVENTS.CALL_UNAVAILABLE);
      socket.off(SOCKET_EVENTS.CALL_OFFER);
      socket.off(SOCKET_EVENTS.CALL_ANSWER);
      socket.off(SOCKET_EVENTS.CALL_ICE_CANDIDATE);
      socket.off(SOCKET_EVENTS.CALL_PEER_MUTED);
      socket.off(SOCKET_EVENTS.CALL_ENDED);
      socket.off(SOCKET_EVENTS.CALL_ERROR);
    };
  }, [currentCall]);

  const acquireMicrophone = async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err: any) {
      console.error('[WebRTC] Microphone access denied:', err);
      throw new Error('Microphone access is required to place or receive voice calls. Please allow microphone permissions.');
    }
  };

  const setupPeerConnection = async (callId: string): Promise<RTCPeerConnection> => {
    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current
    });
    peerConnectionRef.current = pc;

    // Attach local audio tracks
    let stream = localStreamRef.current;
    if (!stream) {
      stream = await acquireMicrophone();
    }
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream!);
    });

    // Handle remote track
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote audio stream track');
      const stream = event.streams[0];
      setRemoteStream(stream);
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch(e => console.warn('Audio play error:', e));
      }
    };

    // Handle ICE Candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = socketService.getSocket();
        if (socket) {
          socket.emit(SOCKET_EVENTS.CALL_ICE_CANDIDATE, {
            callId,
            candidate: event.candidate
          });
        }
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] PeerConnection State:', pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.warn('[WebRTC] Connection interrupted');
      }
    };

    return pc;
  };

  const startCall = async (params: {
    callType: CallType;
    targetUserId?: string;
    targetUsername?: string;
    targetFullName?: string;
    destinationNumber?: string;
  }) => {
    setError(null);
    const { callType, targetUserId, targetUsername, targetFullName, destinationNumber } = params;

    if (callType === 'INTERNET_WEBRTC') {
      try {
        const stream = await acquireMicrophone();
        const socket = socketService.getSocket();
        if (!socket || !socket.connected) {
          throw new Error('Signaling server is not connected. Please check your network.');
        }

        setCurrentCall({
          callId: '',
          callType: 'INTERNET_WEBRTC',
          peerId: targetUserId,
          peerName: targetFullName || targetUsername || 'User',
          peerUsername: targetUsername
        });
        setCallState('OUTGOING_RINGING');
        soundFX.startRinging();

        socket.emit(SOCKET_EVENTS.CALL_INITIATE, {
          callType: 'INTERNET_WEBRTC',
          targetUserId,
          targetUsername
        });

        // Listen for call ringing confirmation
        socket.once(SOCKET_EVENTS.CALL_RINGING, async (res: { callId: string; targetUser: any }) => {
          setCurrentCall(prev => prev ? { ...prev, callId: res.callId } : null);
          await setupPeerConnection(res.callId);
        });
      } catch (err: any) {
        soundFX.stopRinging();
        setError(err.message || 'Failed to initiate call');
        setCallState('IDLE');
      }
    } else if (callType === 'TELECOM_PSTN') {
      // PSTN Telecom Call
      try {
        setCurrentCall({
          callId: '',
          callType: 'TELECOM_PSTN',
          peerName: destinationNumber || 'Indian Mobile Number',
          destinationNumber,
          isMock: true
        });
        setCallState('OUTGOING_RINGING');
        soundFX.startRinging();

        const res = await api.initiateCall({
          callType: 'TELECOM_PSTN',
          destinationNumber
        });

        const callRecord = res.data.callRecord;
        const telecomResult = res.data.telecomResult;

        setCurrentCall(prev => prev ? {
          ...prev,
          callId: callRecord.callId,
          isMock: telecomResult.isMock
        } : null);

        // In Mock Sandbox mode, simulate receiver answering after 3.5 seconds
        setTimeout(async () => {
          soundFX.stopRinging();
          soundFX.playConnectedTone();
          setCallState('CONNECTED');
          await api.simulateSandboxEvent(callRecord.callId, 'answered');
        }, 3500);

      } catch (err: any) {
        soundFX.stopRinging();
        setError(err.message || 'PSTN call failed');
        setCallState('IDLE');
      }
    }
  };

  const acceptCall = async () => {
    if (!currentCall) return;
    soundFX.stopRinging();

    try {
      await acquireMicrophone();
      const socket = socketService.getSocket();
      if (!socket) return;

      await setupPeerConnection(currentCall.callId);

      socket.emit(SOCKET_EVENTS.CALL_ACCEPT, {
        callId: currentCall.callId
      });

      setCallState('CONNECTED');
      soundFX.playConnectedTone();
    } catch (err: any) {
      soundFX.stopRinging();
      setError(err.message || 'Failed to accept call');
      rejectCall();
    }
  };

  const rejectCall = () => {
    if (!currentCall) return;
    soundFX.stopRinging();
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit(SOCKET_EVENTS.CALL_REJECT, {
        callId: currentCall.callId
      });
    }
    cleanupCallSession();
  };

  const endCall = async (reason?: string) => {
    soundFX.stopRinging();
    soundFX.playEndTone();

    if (currentCall?.callId) {
      const socket = socketService.getSocket();
      if (socket) {
        socket.emit(SOCKET_EVENTS.CALL_HANGUP, {
          callId: currentCall.callId,
          reason
        });
      }

      try {
        await api.endCall(currentCall.callId, reason);
      } catch (e) {
        // Continue cleanup
      }
    }

    cleanupCallSession();
    await refreshWallet();
  };

  const cleanupCallSession = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    setRemoteStream(null);
    setIsMuted(false);
    setPeerMuted(false);
    setCallState('ENDED');

    setTimeout(() => {
      setCallState('IDLE');
      setCurrentCall(null);
    }, 1200);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const nextMuted = !isMuted;
        audioTrack.enabled = !nextMuted;
        setIsMuted(nextMuted);

        const socket = socketService.getSocket();
        if (socket && currentCall?.callId) {
          socket.emit(SOCKET_EVENTS.CALL_MUTE_TOGGLE, {
            callId: currentCall.callId,
            isMuted: nextMuted
          });
        }
      }
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(prev => {
      const next = !prev;
      if (remoteAudioRef.current) {
        remoteAudioRef.current.volume = next ? 1.0 : 0.2;
      }
      return next;
    });
  };

  const clearError = () => setError(null);

  return (
    <CallContext.Provider
      value={{
        callState,
        currentCall,
        isMuted,
        isSpeakerOn,
        durationSeconds,
        peerMuted,
        error,
        localStream,
        remoteStream,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleSpeaker,
        clearError
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

