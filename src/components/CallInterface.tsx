// CallInterface.tsx - Interface de chamadas de voz e vídeo
import React, { useEffect, useRef, useState } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  X, 
  Clock,
  User
} from 'lucide-react';
import { CallState } from '../services/callService';

interface CallInterfaceProps {
  callState: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onAcceptCall: () => void;
  onRejectCall: () => void;
  onEndCall: () => void;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onClose: () => void;
}

const CallInterface: React.FC<CallInterfaceProps> = ({
  callState,
  localStream,
  remoteStream,
  onAcceptCall,
  onRejectCall,
  onEndCall,
  onToggleVideo,
  onToggleAudio,
  onClose
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [callDuration, setCallDuration] = useState<string>('00:00');

  // Configurar streams de vídeo
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      console.log('📹 Stream local configurado no vídeo');
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      console.log('📹 Stream remoto configurado no vídeo');
    }
  }, [remoteStream]);

  // Timer da chamada
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (callState.isInCall && callState.callStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const start = new Date(callState.callStartTime!);
        const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
        
        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;
        
        setCallDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState.isInCall, callState.callStartTime]);

  // Não renderizar se não há chamada ativa ou recebida
  if (!callState.isInCall && !callState.isIncomingCall) {
    return null;
  }

  // Tela de chamada recebida
  if (callState.isIncomingCall) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          {/* Avatar do chamador */}
          <div className="mb-6">
            <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto flex items-center justify-center">
              <User className="w-12 h-12 text-gray-600" />
            </div>
          </div>

          {/* Nome do chamador */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {callState.callerName || 'Usuário'}
          </h2>

          {/* Tipo de chamada */}
          <p className="text-gray-600 mb-8">
            Chamada de {callState.callType === 'video' ? 'vídeo' : 'áudio'} recebida
          </p>

          {/* Botões de ação */}
          <div className="flex justify-center space-x-8">
            {/* Rejeitar */}
            <button
              onClick={onRejectCall}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
            >
              <PhoneOff className="w-8 h-8 text-white" />
            </button>

            {/* Aceitar */}
            <button
              onClick={onAcceptCall}
              className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
            >
              <Phone className="w-8 h-8 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tela de chamada ativa
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header com informações da chamada */}
      <div className="bg-black bg-opacity-50 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h3 className="text-white font-semibold">
              {callState.callerName || callState.targetUserId || 'Usuário'}
            </h3>
            <div className="flex items-center space-x-2 text-gray-300 text-sm">
              <Clock className="w-4 h-4" />
              <span>{callDuration}</span>
            </div>
          </div>
        </div>

        {/* Botão fechar (minimizar) */}
        <button
          onClick={onClose}
          className="w-10 h-10 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Área de vídeo */}
      <div className="flex-1 relative">
        {/* Vídeo remoto (principal) */}
        {callState.callType === 'video' && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User className="w-16 h-16 text-gray-400" />
              </div>
              <p className="text-white text-lg">
                {callState.callType === 'audio' ? 'Chamada de áudio' : 'Vídeo desabilitado'}
              </p>
              {!callState.remoteAudioEnabled && (
                <p className="text-red-400 mt-2">
                  <MicOff className="w-4 h-4 inline mr-1" />
                  Microfone desligado
                </p>
              )}
            </div>
          </div>
        )}

        {/* Vídeo local (picture-in-picture) */}
        {callState.callType === 'video' && localStream && callState.isVideoEnabled && (
          <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Indicadores de status */}
        <div className="absolute top-4 left-4 space-y-2">
          {!callState.isVideoEnabled && callState.callType === 'video' && (
            <div className="bg-red-500 px-3 py-1 rounded-full flex items-center space-x-1">
              <VideoOff className="w-4 h-4 text-white" />
              <span className="text-white text-sm">Câmera desligada</span>
            </div>
          )}
          {!callState.isAudioEnabled && (
            <div className="bg-red-500 px-3 py-1 rounded-full flex items-center space-x-1">
              <MicOff className="w-4 h-4 text-white" />
              <span className="text-white text-sm">Microfone desligado</span>
            </div>
          )}
        </div>
      </div>

      {/* Controles da chamada */}
      <div className="bg-black bg-opacity-50 p-6">
        <div className="flex items-center justify-center space-x-6">
          {/* Toggle Áudio */}
          <button
            onClick={onToggleAudio}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              callState.isAudioEnabled
                ? 'bg-gray-600 hover:bg-gray-700'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {callState.isAudioEnabled ? (
              <Mic className="w-7 h-7 text-white" />
            ) : (
              <MicOff className="w-7 h-7 text-white" />
            )}
          </button>

          {/* Encerrar Chamada */}
          <button
            onClick={onEndCall}
            className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
          >
            <PhoneOff className="w-8 h-8 text-white" />
          </button>

          {/* Toggle Vídeo (apenas para chamadas de vídeo) */}
          {callState.callType === 'video' && (
            <button
              onClick={onToggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                callState.isVideoEnabled
                  ? 'bg-gray-600 hover:bg-gray-700'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {callState.isVideoEnabled ? (
                <Video className="w-7 h-7 text-white" />
              ) : (
                <VideoOff className="w-7 h-7 text-white" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallInterface;
