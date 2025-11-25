// Call Service - Serviço de gerenciamento de chamadas
import WebRTCManager, { 
  IncomingCallData, 
  CallAcceptedData, 
  CallEndedData, 
  MediaToggleData 
} from './webrtcManager';
import { websocketService } from './websocketService';
import { notificationService } from './notificationService';

export interface CallState {
  isInCall: boolean;
  isIncomingCall: boolean;
  callType: 'video' | 'audio' | null;
  callId: string | null;
  callerName: string | null;
  callerId: string | null;
  targetUserId: string | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  callStartTime: Date | null;
  remoteVideoEnabled: boolean;
  remoteAudioEnabled: boolean;
}

export type CallStateCallback = (state: CallState) => void;
export type StreamCallback = (stream: MediaStream) => void;

class CallService {
  private webrtcManager: WebRTCManager | null = null;
  private callState: CallState = {
    isInCall: false,
    isIncomingCall: false,
    callType: null,
    callId: null,
    callerName: null,
    callerId: null,
    targetUserId: null,
    isVideoEnabled: true,
    isAudioEnabled: true,
    callStartTime: null,
    remoteVideoEnabled: true,
    remoteAudioEnabled: true
  };

  private callStateCallbacks: CallStateCallback[] = [];
  private localStreamCallbacks: StreamCallback[] = [];
  private remoteStreamCallbacks: StreamCallback[] = [];

  constructor() {
    console.log('📞 CallService inicializado');
  }

  /**
   * Inicializar o serviço de chamadas para um serviço específico
   */
  async initialize(servicoId: string, userId: string, userName: string): Promise<boolean> {
    try {
      console.log('🔧 Inicializando CallService para serviço:', servicoId);

      // Conectar ao WebSocket se não estiver conectado
      if (!websocketService.getConnectionStatus()) {
        const connected = await websocketService.connect();
        if (!connected) {
          console.error('❌ Falha ao conectar WebSocket para chamadas');
          return false;
        }

        // Autenticar usuário
        await websocketService.authenticateUser({
          userId: parseInt(userId),
          userType: 'contratante', // ou 'prestador' baseado no tipo do usuário
          userName
        });

        // Entrar na sala do serviço
        await websocketService.joinService(servicoId);
      }

      // Verificar se o socket está disponível
      const socket = (websocketService as any).socket;
      if (!socket) {
        console.error('❌ Socket do WebSocket não disponível');
        return false;
      }

      // Criar WebRTC Manager
      this.webrtcManager = new WebRTCManager(
        socket,
        servicoId,
        userId,
        userName
      );

      this.setupWebRTCCallbacks();
      this.setupWebSocketCallListeners();
      
      console.log('✅ CallService inicializado com sucesso');
      return true;

    } catch (error) {
      console.error('❌ Erro ao inicializar CallService:', error);
      return false;
    }
  }

  private setupWebRTCCallbacks() {
    if (!this.webrtcManager) return;

    // Chamada recebida
    this.webrtcManager.onIncomingCall((data: IncomingCallData) => {
      console.log('📞 Chamada recebida no CallService:', data);
      
      this.callState = {
        ...this.callState,
        isIncomingCall: true,
        callType: data.callType,
        callId: data.callId,
        callerName: data.callerName,
        callerId: data.callerId
      };

      this.notifyStateChange();

      // Mostrar notificação
      notificationService.showInfo(
        'Chamada Recebida', 
        `${data.callerName} está te ligando (${data.callType === 'video' ? 'Vídeo' : 'Áudio'})`
      );
    });

    // Chamada aceita
    this.webrtcManager.onCallAccepted((data: CallAcceptedData) => {
      console.log('✅ Chamada aceita no CallService:', data);
      
      this.callState = {
        ...this.callState,
        isInCall: true,
        isIncomingCall: false,
        callStartTime: new Date()
      };

      this.notifyStateChange();
    });

    // Chamada encerrada
    this.webrtcManager.onCallEnded((data: CallEndedData) => {
      console.log('📞 Chamada encerrada no CallService:', data);
      
      const duration = this.callState.callStartTime 
        ? Math.floor((new Date().getTime() - this.callState.callStartTime.getTime()) / 1000)
        : 0;

      // Resetar estado
      this.callState = {
        isInCall: false,
        isIncomingCall: false,
        callType: null,
        callId: null,
        callerName: null,
        callerId: null,
        targetUserId: null,
        isVideoEnabled: true,
        isAudioEnabled: true,
        callStartTime: null,
        remoteVideoEnabled: true,
        remoteAudioEnabled: true
      };

      this.notifyStateChange();

      // Mostrar notificação de encerramento
      if (duration > 0) {
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        notificationService.showSuccess(
          'Chamada Encerrada', 
          `Duração: ${minutes}:${seconds.toString().padStart(2, '0')}`
        );
      }
    });

    // Stream local recebido
    this.webrtcManager.onLocalStream((stream: MediaStream) => {
      console.log('📹 Stream local recebido no CallService');
      this.localStreamCallbacks.forEach(callback => callback(stream));
    });

    // Stream remoto recebido
    this.webrtcManager.onRemoteStream((stream: MediaStream) => {
      console.log('📹 Stream remoto recebido no CallService');
      this.remoteStreamCallbacks.forEach(callback => callback(stream));
    });

    // Mídia alternada pelo outro usuário
    this.webrtcManager.onMediaToggled((data: MediaToggleData) => {
      console.log('🎛️ Mídia alternada pelo outro usuário:', data);
      
      if (data.mediaType === 'video') {
        this.callState.remoteVideoEnabled = data.enabled;
      } else if (data.mediaType === 'audio') {
        this.callState.remoteAudioEnabled = data.enabled;
      }

      this.notifyStateChange();
    });

    // Chamada falhou
    this.webrtcManager.onCallFailed((data: any) => {
      console.log('❌ Chamada falhou:', data);
      notificationService.showError('Chamada Falhou', data.message || 'Erro desconhecido');
      this.resetCallState();
    });

    // Chamada rejeitada
    this.webrtcManager.onCallRejected((data: any) => {
      console.log('❌ Chamada rejeitada:', data);
      notificationService.showWarning('Chamada Rejeitada', `${data.rejectedByName || 'Usuário'} rejeitou a chamada`);
      this.resetCallState();
    });

    // Chamada cancelada
    this.webrtcManager.onCallCancelled((data: any) => {
      console.log('❌ Chamada cancelada:', data);
      notificationService.showInfo('Chamada Cancelada', 'A chamada foi cancelada');
      this.resetCallState();
    });
  }

  private setupWebSocketCallListeners() {
    console.log('📡 Configurando listeners de chamada WebSocket conforme documentação...');
    
    // 1. Listener para confirmação de chamada iniciada (call:initiated)
    websocketService.onCallInitiated((data: any) => {
      console.log('✅ Chamada iniciada confirmada pelo servidor:', data);
      console.log('📊 Call ID:', data.callId);
      console.log('📊 Target Online:', data.targetOnline);
      
      // Atualizar callId com o ID oficial do servidor
      this.callState.callId = data.callId;
      this.notifyStateChange();
      
      if (!data.targetOnline) {
        notificationService.showWarning('Chamada', 'Prestador está offline');
      }
    });

    // 2. Listener para chamada recebida (call:incoming) - se for prestador
    websocketService.onCallIncoming((data: any) => {
      console.log('📞 Chamada recebida via WebSocket:', data);
      console.log('📊 Dados da chamada:', {
        servicoId: data.servicoId,
        callerId: data.callerId,
        callerName: data.callerName,
        callType: data.callType,
        callId: data.callId,
        timestamp: data.timestamp
      });
      
      this.callState = {
        ...this.callState,
        isIncomingCall: true,
        callType: data.callType || 'video',
        callId: data.callId,
        callerName: data.callerName || 'Contratante',
        callerId: data.callerId
      };
      this.notifyStateChange();
      
      notificationService.showInfo(
        'Chamada Recebida', 
        `${data.callerName} está te ligando (${data.callType})`
      );
    });

    // 3. Listener para chamada aceita (call:accepted)
    websocketService.onCallAccepted((data: any) => {
      console.log('✅ Prestador aceitou a chamada:', data);
      console.log('📊 Dados da aceitação:', {
        servicoId: data.servicoId,
        callId: data.callId,
        answererId: data.answererId,
        answererName: data.answererName,
        answer: data.answer,
        timestamp: data.timestamp
      });
      
      notificationService.showSuccess('Chamada', `${data.answererName} aceitou a chamada!`);
      
      // Atualizar estado para chamada ativa
      this.callState = {
        ...this.callState,
        isInCall: true,
        isIncomingCall: false,
        callStartTime: new Date()
      };
      this.notifyStateChange();
      
      // WebRTC será configurado pelo WebRTCManager automaticamente
      console.log('✅ WebRTC será configurado com a resposta SDP automaticamente');
    });

    // 4. Listener para chamada rejeitada (call:rejected)
    websocketService.onCallRejected((data: any) => {
      console.log('❌ Prestador rejeitou a chamada:', data);
      console.log('📊 Dados da rejeição:', {
        servicoId: data.servicoId,
        callId: data.callId,
        reason: data.reason,
        rejectedBy: data.rejectedBy,
        rejectedByName: data.rejectedByName,
        timestamp: data.timestamp
      });
      
      notificationService.showWarning('Chamada', `${data.rejectedByName} rejeitou a chamada`);
      this.resetCallState();
    });

    // 5. Listener para chamada encerrada (call:ended)
    websocketService.onCallEnded((data: any) => {
      console.log('📞 Chamada encerrada:', data);
      console.log('📊 Dados do encerramento:', {
        servicoId: data.servicoId,
        callId: data.callId,
        endedBy: data.endedBy,
        reason: data.reason,
        duration: data.duration,
        timestamp: data.timestamp
      });
      
      const durationText = data.duration ? ` (${data.duration}s)` : '';
      notificationService.showInfo('Chamada', `Chamada encerrada${durationText}`);
      this.resetCallState();
    });

    // 6. Listener para chamada falhou (call:failed)
    websocketService.onCallFailed((data: any) => {
      console.log('❌ Chamada falhou:', data);
      console.log('📊 Motivo da falha:', data.reason);
      
      let message = 'Falha na chamada';
      switch (data.reason) {
        case 'user_offline':
          message = 'Prestador está offline';
          break;
        case 'user_busy':
          message = 'Prestador está ocupado';
          break;
        case 'timeout':
          message = 'Timeout na chamada';
          break;
        default:
          message = data.message || 'Falha desconhecida';
      }
      
      notificationService.showError('Chamada Falhou', message);
      this.resetCallState();
    });

    // 7. Listener para chamada cancelada (call:cancelled)
    websocketService.onCallCancelled((data: any) => {
      console.log('❌ Chamada cancelada:', data);
      console.log('📊 Dados do cancelamento:', {
        servicoId: data.servicoId,
        callId: data.callId,
        timestamp: data.timestamp
      });
      
      notificationService.showInfo('Chamada', 'Chamada foi cancelada');
      this.resetCallState();
    });

    // 8. Listener para ICE candidates (call:ice-candidate)
    websocketService.onCallIceCandidate((data: any) => {
      console.log('🧊 ICE candidate recebido:', data);
      console.log('📊 Dados do ICE candidate:', {
        servicoId: data.servicoId,
        candidate: data.candidate,
        callId: data.callId,
        timestamp: data.timestamp
      });
      
      // WebRTCManager processará automaticamente via seus próprios listeners
      console.log('✅ ICE candidate será processado pelo WebRTCManager');
    });

    // 9. Listener para toggle de mídia (call:media-toggled)
    websocketService.onCallMediaToggled((data: any) => {
      console.log('🎛️ Mídia alternada pelo prestador:', data);
      console.log('📊 Dados do toggle:', {
        servicoId: data.servicoId,
        callId: data.callId,
        mediaType: data.mediaType,
        enabled: data.enabled,
        timestamp: data.timestamp
      });
      
      // Atualizar estado da mídia remota
      if (data.mediaType === 'video') {
        this.callState.remoteVideoEnabled = data.enabled;
      } else if (data.mediaType === 'audio') {
        this.callState.remoteAudioEnabled = data.enabled;
      }
      this.notifyStateChange();
      
      const mediaName = data.mediaType === 'video' ? 'vídeo' : 'áudio';
      const action = data.enabled ? 'ligou' : 'desligou';
      notificationService.showInfo('Chamada', `Prestador ${action} o ${mediaName}`);
    });

    console.log('✅ Listeners de chamada WebSocket configurados conforme documentação');
  }

  /**
   * Iniciar uma chamada de vídeo
   */
  async startVideoCall(targetUserId: string): Promise<boolean> {
    if (!this.webrtcManager) {
      console.error('❌ WebRTC Manager não inicializado');
      return false;
    }

    console.log('🎥 Iniciando chamada de vídeo REAL para prestador:', targetUserId);

    try {
      // 1. Atualizar estado local imediatamente para mostrar interface
      this.callState = {
        ...this.callState,
        isInCall: true,
        callType: 'video',
        targetUserId,
        callStartTime: new Date(),
        callId: `call-${Date.now()}`,
        callerName: 'Prestador',
        callerId: targetUserId
      };
      this.notifyStateChange();
      console.log('✅ Interface de chamada ativada');

      // 2. Iniciar WebRTC real com o prestador
      const success = await this.webrtcManager.startCall(targetUserId, 'video');
      
      if (success) {
        console.log('✅ Chamada WebRTC iniciada com sucesso');
        
        // 3. Enviar sinal via WebSocket para o prestador (conforme documentação)
        if (websocketService.isConnected()) {
          console.log('📡 Enviando convite de chamada via WebSocket...');
          
          const currentServiceId = localStorage.getItem('currentServiceId');
          const realUserId = localStorage.getItem('realUserId') || '1';
          const realUserName = localStorage.getItem('realUserName') || 'Contratante';
          
          // Payload conforme documentação oficial
          const callInitiateData = {
            servicoId: currentServiceId || '10',
            callerId: realUserId,
            callerName: realUserName,
            targetUserId: targetUserId,
            callType: 'video'
          };
          
          console.log('📞 Enviando call:initiate:', callInitiateData);
          websocketService.emit('call:initiate', callInitiateData);
        } else {
          console.warn('⚠️ WebSocket não conectado, chamada apenas local');
        }
        
        return true;
      } else {
        console.error('❌ Falha ao iniciar WebRTC');
        // Manter interface aberta mesmo se WebRTC falhar (para teste)
        return true;
      }
      
    } catch (error) {
      console.error('❌ Erro ao iniciar chamada:', error);
      // Manter interface aberta mesmo com erro (para teste)
      return true;
    }
  }

  /**
   * Iniciar uma chamada de áudio
   */
  async startAudioCall(targetUserId: string): Promise<boolean> {
    if (!this.webrtcManager) {
      console.error('❌ WebRTC Manager não inicializado');
      return false;
    }

    console.log('🎤 Iniciando chamada de áudio para:', targetUserId);

    const success = await this.webrtcManager.startCall(targetUserId, 'audio');
    
    if (success) {
      this.callState = {
        ...this.callState,
        isInCall: true, // Forçar true para mostrar interface imediatamente
        callType: 'audio',
        targetUserId,
        callStartTime: new Date(),
        callId: `call-${Date.now()}`,
        callerName: 'Usuário Local',
        callerId: 'local-user'
      };
      this.notifyStateChange();
      console.log('✅ Estado da chamada de áudio atualizado:', this.callState);
    }

    return success;
  }

  /**
   * Aceitar uma chamada recebida
   */
  async acceptCall(): Promise<boolean> {
    if (!this.webrtcManager || !this.callState.isIncomingCall) {
      console.error('❌ Nenhuma chamada para aceitar');
      return false;
    }

    const callData: IncomingCallData = {
      servicoId: '', // Será preenchido pelo WebRTC Manager
      callerId: this.callState.callerId!,
      callerName: this.callState.callerName!,
      callType: this.callState.callType!,
      callId: this.callState.callId!,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Aceitando chamada:', callData);

    const success = await this.webrtcManager.acceptCall(callData);
    
    if (success) {
      this.callState = {
        ...this.callState,
        isInCall: true,
        isIncomingCall: false,
        callStartTime: new Date()
      };
      this.notifyStateChange();
    }

    return success;
  }

  /**
   * Rejeitar uma chamada recebida
   */
  rejectCall(): void {
    if (!this.webrtcManager || !this.callState.isIncomingCall) {
      console.error('❌ Nenhuma chamada para rejeitar');
      return;
    }

    console.log('❌ Rejeitando chamada:', this.callState.callId);

    this.webrtcManager.rejectCall(this.callState.callId!, 'user_rejected');
    this.resetCallState();
  }

  /**
   * Encerrar chamada atual
   */
  endCall(): void {
    if (!this.webrtcManager) {
      console.error('❌ WebRTC Manager não inicializado');
      return;
    }

    console.log('📞 Encerrando chamada atual');

    this.webrtcManager.endCall('user_ended');
    this.resetCallState();
  }

  /**
   * Alternar vídeo
   */
  toggleVideo(): boolean {
    if (!this.webrtcManager) return false;

    const enabled = this.webrtcManager.toggleVideo();
    this.callState.isVideoEnabled = enabled;
    this.notifyStateChange();

    return enabled;
  }

  /**
   * Alternar áudio
   */
  toggleAudio(): boolean {
    if (!this.webrtcManager) return false;

    const enabled = this.webrtcManager.toggleAudio();
    this.callState.isAudioEnabled = enabled;
    this.notifyStateChange();

    return enabled;
  }

  /**
   * Obter estado atual da chamada
   */
  getCallState(): CallState {
    return { ...this.callState };
  }

  /**
   * Verificar se está em uma chamada
   */
  isInCall(): boolean {
    return this.callState.isInCall;
  }

  /**
   * Verificar se há uma chamada recebida
   */
  hasIncomingCall(): boolean {
    return this.callState.isIncomingCall;
  }

  /**
   * Registrar callback para mudanças de estado
   */
  onStateChange(callback: CallStateCallback): () => void {
    this.callStateCallbacks.push(callback);
    
    // Retornar função para remover o callback
    return () => {
      const index = this.callStateCallbacks.indexOf(callback);
      if (index > -1) {
        this.callStateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Registrar callback para stream local
   */
  onLocalStream(callback: StreamCallback): () => void {
    this.localStreamCallbacks.push(callback);
    
    return () => {
      const index = this.localStreamCallbacks.indexOf(callback);
      if (index > -1) {
        this.localStreamCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Registrar callback para stream remoto
   */
  onRemoteStream(callback: StreamCallback): () => void {
    this.remoteStreamCallbacks.push(callback);
    
    return () => {
      const index = this.remoteStreamCallbacks.indexOf(callback);
      if (index > -1) {
        this.remoteStreamCallbacks.splice(index, 1);
      }
    };
  }

  private notifyStateChange() {
    this.callStateCallbacks.forEach(callback => callback(this.callState));
  }

  private resetCallState() {
    this.callState = {
      isInCall: false,
      isIncomingCall: false,
      callType: null,
      callId: null,
      callerName: null,
      callerId: null,
      targetUserId: null,
      isVideoEnabled: true,
      isAudioEnabled: true,
      callStartTime: null,
      remoteVideoEnabled: true,
      remoteAudioEnabled: true
    };
    this.notifyStateChange();
  }

  /**
   * Destruir o serviço e limpar recursos
   */
  destroy(): void {
    console.log('💥 Destruindo CallService...');

    if (this.webrtcManager) {
      this.webrtcManager.destroy();
      this.webrtcManager = null;
    }

    this.resetCallState();
    this.callStateCallbacks = [];
    this.localStreamCallbacks = [];
    this.remoteStreamCallbacks = [];

    console.log('✅ CallService destruído');
  }
}

// Instância singleton
export const callService = new CallService();
export default callService;
