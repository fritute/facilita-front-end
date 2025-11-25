// useCall.ts - Hook para gerenciar chamadas
import { useState, useEffect, useCallback } from 'react';
import { callService, CallState } from '../services/callService';

export interface UseCallReturn {
  callState: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isInitialized: boolean;
  initializeCall: (servicoId: string, userId: string, userName: string) => Promise<boolean>;
  startVideoCall: (targetUserId: string) => Promise<boolean>;
  startAudioCall: (targetUserId: string) => Promise<boolean>;
  acceptCall: () => Promise<boolean>;
  rejectCall: () => void;
  endCall: () => void;
  toggleVideo: () => boolean;
  toggleAudio: () => boolean;
  destroy: () => void;
}

export const useCall = (): UseCallReturn => {
  const [callState, setCallState] = useState<CallState>(callService.getCallState());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [forceCallActive, setForceCallActive] = useState<boolean>(false); // Estado forçado para teste

  useEffect(() => {
    console.log('🎣 useCall: Configurando listeners...');

    // Listener para mudanças de estado
    const removeStateListener = callService.onStateChange((newState: CallState) => {
      console.log('📡 CallService tentando atualizar estado:', {
        'newState.isInCall': newState.isInCall,
        'forceCallActive': forceCallActive,
        'currentState.isInCall': callState.isInCall
      });
      
      // Se proteção ativa e tentando resetar isInCall, verificar se é falha real
      if (forceCallActive && !newState.isInCall) {
        // Se é uma falha real (rejected, failed, cancelled, ended), permitir reset
        if (newState.callType === null && !newState.isIncomingCall) {
          console.log('🛡️ FALHA REAL DETECTADA: Desativando proteção para permitir reset');
          setForceCallActive(false);
          // Continuar com a atualização do estado
        } else {
          console.log('🛡️ PROTEÇÃO ATIVA: Bloqueando reset da chamada via WebSocket');
          console.log('🚫 Estado rejeitado:', newState);
          return; // Não atualizar o estado se tentar resetar
        }
      }
      
      // Se proteção ativa e já em chamada, verificar se é reset válido
      if (forceCallActive && callState.isInCall && !newState.isInCall) {
        // Se todos os campos estão resetados, é provavelmente uma falha real
        if (!newState.callType && !newState.callId && !newState.callerName) {
          console.log('🛡️ RESET COMPLETO DETECTADO: Desativando proteção');
          setForceCallActive(false);
          // Continuar com a atualização do estado
        } else {
          console.log('🛡️ PROTEÇÃO ATIVA: Mantendo estado de chamada atual');
          return; // Manter estado atual
        }
      }
      
      console.log('✅ Permitindo atualização do estado');
      setCallState(newState);
    });

    // Listener para stream local
    const removeLocalStreamListener = callService.onLocalStream((stream: MediaStream) => {
      console.log('🎣 useCall: Stream local recebido');
      setLocalStream(stream);
    });

    // Listener para stream remoto
    const removeRemoteStreamListener = callService.onRemoteStream((stream: MediaStream) => {
      console.log('🎣 useCall: Stream remoto recebido');
      setRemoteStream(stream);
    });

    // Cleanup
    return () => {
      console.log('🎣 useCall: Removendo listeners...');
      removeStateListener();
      removeLocalStreamListener();
      removeRemoteStreamListener();
    };
  }, []);

  const initializeCall = useCallback(async (servicoId: string, userId: string, userName: string): Promise<boolean> => {
    console.log('🎣 useCall: Inicializando chamadas para serviço:', servicoId);
    
    try {
      const success = await callService.initialize(servicoId, userId, userName);
      setIsInitialized(success);
      
      if (success) {
        console.log('✅ useCall: Chamadas inicializadas com sucesso');
      } else {
        console.error('❌ useCall: Falha ao inicializar chamadas');
      }
      
      return success;
    } catch (error) {
      console.error('❌ useCall: Erro ao inicializar chamadas:', error);
      setIsInitialized(false);
      return false;
    }
  }, []);

  const startVideoCall = useCallback(async (targetUserId: string): Promise<boolean> => {
    console.log('🎣 useCall: Iniciando chamada de vídeo para:', targetUserId);
    
    // Se já está em chamada, não fazer nada
    if (callState.isInCall) {
      console.log('⚠️ Chamada já está ativa, ignorando nova tentativa');
      return true;
    }
    
    if (!isInitialized) {
      console.error('❌ useCall: Serviço não inicializado');
      return false;
    }

    try {
      console.log('🎣 useCall: Chamando callService.startVideoCall...');
      
      // Ativar proteção e definir estado de chamada
      console.log('📞 Iniciando chamada de vídeo...');
      setForceCallActive(true); // Ativar proteção contra reset
      
      setCallState(prev => ({
        ...prev,
        isInCall: true,
        callType: 'video' as const,
        targetUserId: targetUserId,
        callStartTime: new Date(),
        callId: `local-call-${Date.now()}`,
        callerName: 'Prestador',
        callerId: 'prestador-user'
      }));
      
      // Tentar obter stream local para mostrar vídeo
      try {
        console.log('📹 Obtendo stream de vídeo...');
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        console.log('✅ Stream local obtido para interface:', stream);
      } catch (streamError) {
        console.warn('⚠️ Erro ao obter stream local:', streamError);
      }
      
      // Chamar callService apenas para logs (não depender do resultado)
      const success = await callService.startVideoCall(targetUserId);
      console.log('🎣 useCall: Resultado do callService (informativo):', success);
      
      // Sempre retornar true para manter interface aberta
      console.log('✅ useCall: Retornando sucesso (forçado para teste)');
      return true;
      
    } catch (error) {
      console.error('❌ useCall: Erro ao iniciar chamada de vídeo:', error);
      return false;
    }
  }, [isInitialized, callState.isInCall]);

  const startAudioCall = useCallback(async (targetUserId: string): Promise<boolean> => {
    console.log('🎣 useCall: Iniciando chamada de áudio para:', targetUserId);
    
    if (!isInitialized) {
      console.error('❌ useCall: Serviço não inicializado');
      return false;
    }

    try {
      const success = await callService.startAudioCall(targetUserId);
      
      if (success) {
        console.log('✅ useCall: Chamada de áudio iniciada');
        
        // Forçar estado de chamada para mostrar interface (para teste)
        setCallState(prev => ({
          ...prev,
          isInCall: true,
          callType: 'audio',
          targetUserId: targetUserId,
          callStartTime: new Date()
        }));
        
        // Tentar obter stream local (só áudio)
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          setLocalStream(stream);
          console.log('✅ Stream de áudio local obtido para interface');
        } catch (streamError) {
          console.warn('⚠️ Erro ao obter stream de áudio local:', streamError);
        }
        
      } else {
        console.error('❌ useCall: Falha ao iniciar chamada de áudio');
      }
      
      return success;
    } catch (error) {
      console.error('❌ useCall: Erro ao iniciar chamada de áudio:', error);
      return false;
    }
  }, [isInitialized]);

  const acceptCall = useCallback(async (): Promise<boolean> => {
    console.log('🎣 useCall: Aceitando chamada');
    
    if (!isInitialized) {
      console.error('❌ useCall: Serviço não inicializado');
      return false;
    }

    try {
      const success = await callService.acceptCall();
      
      if (success) {
        console.log('✅ useCall: Chamada aceita');
      } else {
        console.error('❌ useCall: Falha ao aceitar chamada');
      }
      
      return success;
    } catch (error) {
      console.error('❌ useCall: Erro ao aceitar chamada:', error);
      return false;
    }
  }, [isInitialized]);

  const rejectCall = useCallback((): void => {
    console.log('🎣 useCall: Rejeitando chamada');
    
    if (!isInitialized) {
      console.error('❌ useCall: Serviço não inicializado');
      return;
    }

    try {
      callService.rejectCall();
      console.log('✅ useCall: Chamada rejeitada');
    } catch (error) {
      console.error('❌ useCall: Erro ao rejeitar chamada:', error);
    }
  }, [isInitialized]);

  const endCall = useCallback((): void => {
    console.log('🎣 useCall: Encerrando chamada');
    
    try {
      // Desativar proteção para permitir reset
      setForceCallActive(false);
      console.log('🛡️ Proteção forceCallActive DESATIVADA no endCall');
      
      if (isInitialized) {
        callService.endCall();
      }
      
      // Parar streams locais
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
      }
      
      // Limpar estado
      setCallState(prev => ({
        ...prev,
        isInCall: false,
        isIncomingCall: false,
        callType: null,
        targetUserId: null,
        callStartTime: null,
        callId: null,
        callerName: null,
        callerId: null
      }));
      
      setLocalStream(null);
      setRemoteStream(null);
      
      console.log('✅ useCall: Chamada encerrada e estado limpo');
    } catch (error) {
      console.error('❌ useCall: Erro ao encerrar chamada:', error);
    }
  }, [isInitialized, localStream, remoteStream]);

  const toggleVideo = useCallback((): boolean => {
    console.log('🎣 useCall: Alternando vídeo');
    
    if (!isInitialized) {
      console.error('❌ useCall: Serviço não inicializado');
      return false;
    }

    try {
      const enabled = callService.toggleVideo();
      console.log('✅ useCall: Vídeo alternado:', enabled);
      return enabled;
    } catch (error) {
      console.error('❌ useCall: Erro ao alternar vídeo:', error);
      return false;
    }
  }, [isInitialized]);

  const toggleAudio = useCallback((): boolean => {
    console.log('🎣 useCall: Alternando áudio');
    
    if (!isInitialized) {
      console.error('❌ useCall: Serviço não inicializado');
      return false;
    }

    try {
      const enabled = callService.toggleAudio();
      console.log('✅ useCall: Áudio alternado:', enabled);
      return enabled;
    } catch (error) {
      console.error('❌ useCall: Erro ao alternar áudio:', error);
      return false;
    }
  }, [isInitialized]);

  const destroy = useCallback((): void => {
    console.log('🎣 useCall: Destruindo serviço de chamadas');
    
    try {
      callService.destroy();
      
      // Limpar estado local
      setCallState(callService.getCallState());
      setLocalStream(null);
      setRemoteStream(null);
      setIsInitialized(false);
      
      console.log('✅ useCall: Serviço destruído');
    } catch (error) {
      console.error('❌ useCall: Erro ao destruir serviço:', error);
    }
  }, []);

  // Log apenas quando há chamada ativa
  if (callState.isInCall) {
    console.log('📞 Chamada ativa:', callState.callType);
  }

  return {
    callState,
    localStream,
    remoteStream,
    isInitialized,
    initializeCall,
    startVideoCall,
    startAudioCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio,
    destroy
  };
};

export default useCall;
