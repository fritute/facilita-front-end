// WebRTC Manager - Gerenciamento de chamadas de voz e vídeo
import { Socket } from 'socket.io-client';

export interface CallInitiateData {
  servicoId: string | number;
  callerId: string | number;
  callerName: string;
  targetUserId: string | number;
  callType: 'video' | 'audio';
}

export interface CallAcceptData {
  servicoId: string | number;
  callId: string;
  callerId: string | number;
  answer: RTCSessionDescriptionInit;
}

export interface IncomingCallData {
  servicoId: string;
  callerId: string;
  callerName: string;
  callType: 'video' | 'audio';
  callId: string;
  timestamp: string;
}

export interface CallAcceptedData {
  servicoId: string;
  callId: string;
  answererId: string;
  answererName: string;
  answer: RTCSessionDescriptionInit;
  timestamp: string;
}

export interface CallEndedData {
  servicoId: string;
  callId: string;
  endedBy: string;
  reason: string;
  duration?: number;
  timestamp: string;
}

export interface IceCandidateData {
  servicoId: string;
  candidate: RTCIceCandidateInit;
  callId: string;
  timestamp: string;
}

export interface MediaToggleData {
  servicoId: string;
  callId: string;
  mediaType: 'video' | 'audio';
  enabled: boolean;
  timestamp: string;
}

export type CallEventCallback = (data: any) => void;

class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private currentCallId: string | null = null;
  private targetUserId: string | null = null;
  private isVideoEnabled: boolean = true;
  private isAudioEnabled: boolean = true;

  // Callbacks para eventos
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onLocalStreamCallback?: (stream: MediaStream) => void;
  private onCallEndedCallback?: (data: CallEndedData) => void;
  private onIncomingCallCallback?: (data: IncomingCallData) => void;
  private onCallAcceptedCallback?: (data: CallAcceptedData) => void;
  private onCallFailedCallback?: (data: any) => void;
  private onCallRejectedCallback?: (data: any) => void;
  private onCallCancelledCallback?: (data: any) => void;
  private onMediaToggledCallback?: (data: MediaToggleData) => void;

  constructor(
    private socket: Socket, 
    private servicoId: string, 
    private userId: string,
    private userName: string
  ) {
    this.setupSocketListeners();
    console.log('🎥 WebRTCManager inicializado para serviço:', servicoId);
  }

  private setupSocketListeners() {
    console.log('🔌 Configurando listeners WebRTC...');

    // Chamada iniciada (para quem iniciou)
    this.socket.on('call:initiated', (data: { callId: string; targetUserId: string; targetOnline: boolean }) => {
      console.log('📞 Chamada iniciada:', data);
      this.currentCallId = data.callId;
      this.targetUserId = data.targetUserId;
    });

    // Chamada recebida (para quem recebe)
    this.socket.on('call:incoming', (data: IncomingCallData) => {
      console.log('📞 Chamada recebida:', data);
      this.onIncomingCallCallback?.(data);
    });

    // Chamada aceita
    this.socket.on('call:accepted', (data: CallAcceptedData) => {
      console.log('✅ Chamada aceita:', data);
      this.handleCallAccepted(data);
      this.onCallAcceptedCallback?.(data);
    });

    // ICE Candidate recebido
    this.socket.on('call:ice-candidate', (data: IceCandidateData) => {
      console.log('🧊 ICE Candidate recebido:', data);
      this.handleIceCandidate(data);
    });

    // Chamada encerrada
    this.socket.on('call:ended', (data: CallEndedData) => {
      console.log('📞 Chamada encerrada:', data);
      this.handleCallEnded(data);
      this.onCallEndedCallback?.(data);
    });

    // Mídia alternada (vídeo/áudio ligado/desligado)
    this.socket.on('call:media-toggled', (data: MediaToggleData) => {
      console.log('🎛️ Mídia alternada:', data);
      this.onMediaToggledCallback?.(data);
    });

    // Chamada falhou
    this.socket.on('call:failed', (data: any) => {
      console.log('❌ Chamada falhou:', data);
      this.onCallFailedCallback?.(data);
    });

    // Chamada rejeitada
    this.socket.on('call:rejected', (data: any) => {
      console.log('❌ Chamada rejeitada:', data);
      this.onCallRejectedCallback?.(data);
    });

    // Chamada cancelada
    this.socket.on('call:cancelled', (data: any) => {
      console.log('❌ Chamada cancelada:', data);
      this.onCallCancelledCallback?.(data);
    });
  }

  /**
   * Iniciar uma chamada
   */
  async startCall(targetUserId: string, callType: 'video' | 'audio'): Promise<boolean> {
    try {
      console.log(`🎥 Iniciando chamada ${callType} para usuário:`, targetUserId);

      // Obter stream local
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });

      console.log('📹 Stream local obtido:', this.localStream);
      this.onLocalStreamCallback?.(this.localStream);

      // Criar peer connection
      this.createPeerConnection();

      // Adicionar tracks locais
      this.localStream.getTracks().forEach(track => {
        console.log('➕ Adicionando track:', track.kind);
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      // Criar oferta
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      console.log('📤 Enviando oferta via WebSocket...');

      // Enviar para backend
      this.socket.emit('call:initiate', {
        servicoId: this.servicoId,
        callerId: this.userId,
        callerName: this.userName,
        targetUserId,
        callType
      });

      this.targetUserId = targetUserId;
      return true;

    } catch (error) {
      console.error('❌ Erro ao iniciar chamada:', error);
      this.cleanup();
      return false;
    }
  }

  /**
   * Aceitar uma chamada recebida
   */
  async acceptCall(callData: IncomingCallData): Promise<boolean> {
    try {
      console.log('✅ Aceitando chamada:', callData);

      this.currentCallId = callData.callId;
      this.targetUserId = callData.callerId;

      // Obter stream local
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: callData.callType === 'video',
        audio: true
      });

      console.log('📹 Stream local obtido para aceitar chamada');
      this.onLocalStreamCallback?.(this.localStream);

      // Criar peer connection
      this.createPeerConnection();

      // Adicionar tracks locais
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      // Criar resposta
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      console.log('📤 Enviando resposta via WebSocket...');

      // Enviar resposta para backend
      this.socket.emit('call:accept', {
        servicoId: callData.servicoId,
        callId: callData.callId,
        callerId: callData.callerId,
        answer: answer
      });

      return true;

    } catch (error) {
      console.error('❌ Erro ao aceitar chamada:', error);
      this.cleanup();
      return false;
    }
  }

  /**
   * Rejeitar uma chamada
   */
  rejectCall(callId: string, reason: string = 'user_rejected') {
    console.log('❌ Rejeitando chamada:', callId);
    this.socket.emit('call:reject', {
      servicoId: this.servicoId,
      callId,
      reason
    });
  }

  /**
   * Encerrar chamada atual
   */
  endCall(reason: string = 'user_ended') {
    console.log('📞 Encerrando chamada:', this.currentCallId);
    
    if (this.currentCallId && this.targetUserId) {
      this.socket.emit('call:end', {
        servicoId: this.servicoId,
        callId: this.currentCallId,
        targetUserId: this.targetUserId,
        reason
      });
    }
    
    this.cleanup();
  }

  /**
   * Alternar vídeo
   */
  toggleVideo(): boolean {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      this.isVideoEnabled = !this.isVideoEnabled;
      videoTrack.enabled = this.isVideoEnabled;

      // Notificar o outro usuário
      if (this.currentCallId && this.targetUserId) {
        this.socket.emit('call:toggle-media', {
          servicoId: this.servicoId,
          targetUserId: this.targetUserId,
          mediaType: 'video',
          enabled: this.isVideoEnabled,
          callId: this.currentCallId
        });
      }

      console.log('📹 Vídeo alternado:', this.isVideoEnabled);
      return this.isVideoEnabled;
    }
    return false;
  }

  /**
   * Alternar áudio
   */
  toggleAudio(): boolean {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      this.isAudioEnabled = !this.isAudioEnabled;
      audioTrack.enabled = this.isAudioEnabled;

      // Notificar o outro usuário
      if (this.currentCallId && this.targetUserId) {
        this.socket.emit('call:toggle-media', {
          servicoId: this.servicoId,
          targetUserId: this.targetUserId,
          mediaType: 'audio',
          enabled: this.isAudioEnabled,
          callId: this.currentCallId
        });
      }

      console.log('🎤 Áudio alternado:', this.isAudioEnabled);
      return this.isAudioEnabled;
    }
    return false;
  }

  private createPeerConnection() {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
        // Adicione servidores TURN se necessário para produção
      ]
    };

    this.peerConnection = new RTCPeerConnection(configuration);
    console.log('🔗 Peer connection criada');

    // Handler para stream remoto
    this.peerConnection.ontrack = (event) => {
      console.log('📹 Stream remoto recebido:', event.streams[0]);
      this.remoteStream = event.streams[0];
      this.onRemoteStreamCallback?.(this.remoteStream);
    };

    // Handler para ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.currentCallId && this.targetUserId) {
        console.log('🧊 Enviando ICE candidate');
        this.socket.emit('call:ice-candidate', {
          servicoId: this.servicoId,
          targetUserId: this.targetUserId,
          candidate: event.candidate,
          callId: this.currentCallId
        });
      }
    };

    // Handler para mudanças de estado da conexão
    this.peerConnection.onconnectionstatechange = () => {
      console.log('🔗 Estado da conexão:', this.peerConnection?.connectionState);
      
      if (this.peerConnection?.connectionState === 'failed') {
        console.log('❌ Conexão falhou, tentando reconectar...');
        // Implementar lógica de reconexão se necessário
      }
    };
  }

  private async handleCallAccepted(data: CallAcceptedData) {
    try {
      console.log('✅ Processando aceitação da chamada...');
      
      if (this.peerConnection && data.answer) {
        await this.peerConnection.setRemoteDescription(data.answer);
        console.log('🔗 Remote description configurada');
      }
    } catch (error) {
      console.error('❌ Erro ao processar aceitação:', error);
    }
  }

  private async handleIceCandidate(data: IceCandidateData) {
    try {
      if (this.peerConnection && data.candidate) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log('🧊 ICE candidate adicionado');
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar ICE candidate:', error);
    }
  }

  private handleCallEnded(data: CallEndedData) {
    console.log('📞 Limpando recursos da chamada encerrada:', data.reason);
    this.cleanup();
  }

  private cleanup() {
    console.log('🧹 Limpando recursos WebRTC...');

    // Parar todas as tracks locais
    this.localStream?.getTracks().forEach(track => {
      track.stop();
      console.log('⏹️ Track parada:', track.kind);
    });

    // Fechar peer connection
    this.peerConnection?.close();

    // Resetar estado
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.currentCallId = null;
    this.targetUserId = null;
    this.isVideoEnabled = true;
    this.isAudioEnabled = true;

    console.log('✅ Recursos limpos');
  }

  // Getters para estado atual
  get isInCall(): boolean {
    return this.currentCallId !== null;
  }

  get isVideoActive(): boolean {
    return this.isVideoEnabled;
  }

  get isAudioActive(): boolean {
    return this.isAudioEnabled;
  }

  get localMediaStream(): MediaStream | null {
    return this.localStream;
  }

  get remoteMediaStream(): MediaStream | null {
    return this.remoteStream;
  }

  // Métodos para definir callbacks
  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
  }

  onLocalStream(callback: (stream: MediaStream) => void) {
    this.onLocalStreamCallback = callback;
  }

  onCallEnded(callback: (data: CallEndedData) => void) {
    this.onCallEndedCallback = callback;
  }

  onIncomingCall(callback: (data: IncomingCallData) => void) {
    this.onIncomingCallCallback = callback;
  }

  onCallAccepted(callback: (data: CallAcceptedData) => void) {
    this.onCallAcceptedCallback = callback;
  }

  onCallFailed(callback: (data: any) => void) {
    this.onCallFailedCallback = callback;
  }

  onCallRejected(callback: (data: any) => void) {
    this.onCallRejectedCallback = callback;
  }

  onCallCancelled(callback: (data: any) => void) {
    this.onCallCancelledCallback = callback;
  }

  onMediaToggled(callback: (data: MediaToggleData) => void) {
    this.onMediaToggledCallback = callback;
  }

  /**
   * Destruir o manager e limpar todos os recursos
   */
  destroy() {
    console.log('💥 Destruindo WebRTCManager...');
    
    // Remover todos os listeners
    this.socket.off('call:initiated');
    this.socket.off('call:incoming');
    this.socket.off('call:accepted');
    this.socket.off('call:ice-candidate');
    this.socket.off('call:ended');
    this.socket.off('call:media-toggled');
    this.socket.off('call:failed');
    this.socket.off('call:rejected');
    this.socket.off('call:cancelled');

    // Limpar recursos
    this.cleanup();

    console.log('✅ WebRTCManager destruído');
  }
}

export default WebRTCManager;
