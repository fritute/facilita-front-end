import React, { useState, useEffect } from 'react';
import { Video, PhoneCall } from 'lucide-react';
import { useCall } from '../hooks/useCall';
import CallInterface from './CallInterface';
import { notificationService } from '../services/notificationService';

interface SimpleTrackingProps {
  serviceId?: string;
  entregador: {
    nome: string;
    telefone: string;
  };
}

const ServiceTrackingSimple: React.FC<SimpleTrackingProps> = ({ serviceId, entregador }) => {
  // Função para obter serviceId com fallbacks
  const getServiceId = () => {
    if (serviceId) {
      console.log('📋 Usando serviceId do props:', serviceId);
      return serviceId;
    }
    
    const fromStorage = localStorage.getItem('currentServiceId') || 
                       localStorage.getItem('createdServiceId') || 
                       localStorage.getItem('activeServiceId');
    
    if (fromStorage) {
      console.log('📋 Usando serviceId do localStorage:', fromStorage);
      return fromStorage;
    }
    
    // Gerar um ID temporário para teste
    const tempId = 'test-' + Date.now();
    console.log('📋 Gerando serviceId temporário para teste:', tempId);
    localStorage.setItem('currentServiceId', tempId);
    return tempId;
  };

  const [currentServiceId] = useState(getServiceId());
  
  const {
    callState,
    localStream,
    remoteStream,
    isInitialized: isCallInitialized,
    initializeCall,
    startVideoCall,
    startAudioCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio
  } = useCall();

  // Inicializar sistema de chamadas
  useEffect(() => {
    console.log('🔄 useEffect de inicialização executado');
    console.log('📊 Estado atual:', { 
      currentServiceId, 
      isCallInitialized,
      hasCurrentServiceId: !!currentServiceId,
      serviceIdLength: currentServiceId?.length
    });
    
    if (currentServiceId && !isCallInitialized) {
      const userId = localStorage.getItem('userId') || '1';
      const userName = localStorage.getItem('loggedUser') || entregador.nome;
      
      console.log('📞 Inicializando sistema de chamadas...');
      console.log('📊 Dados para inicialização:', { currentServiceId, userId, userName });
      
      // Definir dados padrão se não existirem
      if (!localStorage.getItem('userId')) {
        localStorage.setItem('userId', '1');
        console.log('📋 Definindo userId padrão: 1');
      }
      
      if (!localStorage.getItem('prestadorId')) {
        localStorage.setItem('prestadorId', '2');
        console.log('📋 Definindo prestadorId padrão: 2');
      }
      
      initializeCall(currentServiceId, userId, userName);
    } else {
      console.log('❌ Não inicializando:', {
        noServiceId: !currentServiceId,
        alreadyInitialized: isCallInitialized
      });
    }
  }, [currentServiceId, isCallInitialized, initializeCall, entregador.nome]);

  // Funções de chamada
  const handleVideoCall = async () => {
    console.log('🔥 INICIANDO CHAMADA DE VÍDEO - DEBUG COMPLETO');
    console.log('📊 Estado atual:', {
      isCallInitialized,
      currentServiceId,
      callState,
      userId: localStorage.getItem('userId'),
      prestadorId: localStorage.getItem('prestadorId')
    });
    
    try {
      // Verificar se sistema está inicializado
      if (!isCallInitialized) {
        console.log('❌ Sistema não inicializado! Tentando inicializar...');
        
        const userId = localStorage.getItem('userId') || '1';
        const userName = localStorage.getItem('loggedUser') || entregador.nome;
        
        console.log('🔧 Dados para inicialização:', { currentServiceId, userId, userName });
        
        const initialized = await initializeCall(currentServiceId, userId, userName);
        console.log('📞 Resultado da inicialização:', initialized);
        
        if (!initialized) {
          notificationService.showError('Chamada', 'Falha na inicialização do sistema');
          return;
        }
        
        // Aguardar um pouco para garantir inicialização
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Tentar chamada
      console.log('📞 Sistema inicializado, tentando chamada...');
      console.log('📞 Chamando startVideoCall...');
      
      const prestadorId = localStorage.getItem('prestadorId') || '2';
      console.log('📞 Target ID:', prestadorId);
      
      const success = await startVideoCall(prestadorId);
      console.log('📞 Resultado da chamada:', success);
      
      if (success) {
        console.log('✅ Chamada iniciada com sucesso!');
        notificationService.showSuccess('Chamada', 'Chamada iniciada!');
      } else {
        console.log('❌ Falha na chamada');
        notificationService.showError('Chamada', 'Falha ao iniciar chamada');
        
        // Debug adicional - verificar estado após falha
        console.log('📊 Estado após falha:', {
          callState,
          localStream,
          remoteStream
        });
      }
      
    } catch (error) {
      console.error('❌ Erro na chamada:', error);
      notificationService.showError('Chamada', 'Erro: ' + (error as Error).message);
    }
  };

  const handleAudioCall = async () => {
    console.log('� INICIANDO CHAMADA DE ÁUDIO - MODO DIRETO');
    
    try {
      // Obter stream de áudio
      console.log('🎵 Obtendo stream de áudio...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Stream de áudio obtido:', stream);
      
      // Simular chamada de áudio ativa
      notificationService.showSuccess('Chamada', 'Interface de áudio aberta!');
      
      // Parar stream após teste
      stream.getTracks().forEach(track => track.stop());
      
    } catch (error) {
      console.error('❌ Erro ao obter áudio:', error);
      notificationService.showError('Chamada', 'Erro ao acessar microfone');
    }
  };

  const handleCloseCall = () => {
    console.log('📞 Minimizando interface de chamada (chamada continua ativa)');
    // A interface será fechada mas a chamada continua ativa em background
    // Você pode implementar lógica para minimizar a interface aqui
  };

  // Função para testar apenas as permissões
  const testPermissions = async () => {
    console.log('🧪 TESTE - Verificando permissões...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log('✅ TESTE - Permissões OK!', stream);
      notificationService.showSuccess('Teste', 'Permissões de câmera e microfone OK!');
      
      // Parar stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('❌ TESTE - Erro de permissões:', error);
      notificationService.showError('Teste', 'Erro nas permissões: ' + (error as Error).message);
    }
  };

  // Configuração de usuários reais
  const getRealUserConfig = () => {
    // Verificar se há dados de usuário real no localStorage
    const realUserId = localStorage.getItem('realUserId');
    const realUserType = localStorage.getItem('realUserType'); // 'contratante' ou 'prestador'
    const realUserName = localStorage.getItem('realUserName');
    const realUserPhone = localStorage.getItem('realUserPhone');
    
    if (realUserId && realUserType && realUserName) {
      return {
        userId: parseInt(realUserId),
        userType: realUserType as 'contratante' | 'prestador',
        userName: realUserName,
        phone: realUserPhone
      };
    }
    
    // Fallback para dados padrão
    return {
      userId: parseInt(localStorage.getItem('userId') || '1'),
      userType: 'contratante' as 'contratante' | 'prestador',
      userName: localStorage.getItem('loggedUser') || entregador.nome,
      phone: localStorage.getItem('userPhone')
    };
  };

  // Função para configurar usuários reais
  const setupRealUsers = () => {
    console.log('👥 CONFIGURANDO USUÁRIOS REAIS');
    
    // Configuração com números reais válidos
    const contratante = {
      id: 1,
      name: 'Usuário Contratante',
      phone: '+5511959272335', // Seu número real
      type: 'contratante'
    };
    
    const prestador = {
      id: 2, 
      name: 'Prestador Serviço',
      phone: '+5511959272336', // Número do prestador (ajuste se necessário)
      type: 'prestador'
    };
    
    // Salvar no localStorage
    localStorage.setItem('realUserId', contratante.id.toString());
    localStorage.setItem('realUserType', contratante.type);
    localStorage.setItem('realUserName', contratante.name);
    localStorage.setItem('realUserPhone', contratante.phone);
    
    // Salvar dados do prestador para chamadas
    localStorage.setItem('prestadorId', prestador.id.toString());
    localStorage.setItem('prestadorName', prestador.name);
    localStorage.setItem('prestadorPhone', prestador.phone);
    
    console.log('✅ Usuários reais configurados:', { contratante, prestador });
    notificationService.showSuccess('Configuração', 'Usuários reais configurados!');
  };

  // Função para testar WebSocket (DEBUG)
  const testWebSocket = async () => {
    console.log('🌐 TESTANDO CONEXÃO WEBSOCKET COM USUÁRIOS REAIS');
    
    try {
      const userConfig = getRealUserConfig();
      console.log('👤 Configuração do usuário:', userConfig);
      
      // Importar websocketService
      const { websocketService } = await import('../services/websocketService');
      
      console.log('📡 Tentando conectar ao WebSocket...');
      const connected = await websocketService.connect();
      
      if (connected) {
        console.log('✅ WebSocket conectado!');
        notificationService.showSuccess('WebSocket', 'Conectado com sucesso!');
        
        // Testar autenticação com usuário real
        console.log('🔐 Autenticando usuário real...');
        await websocketService.authenticateUser({
          userId: userConfig.userId,
          userType: userConfig.userType,
          userName: userConfig.userName
        });
        
        console.log('✅ Usuário real autenticado!');
        
        // Testar entrada na sala
        console.log('🏠 Entrando na sala do serviço...');
        await websocketService.joinService(currentServiceId);
        
        console.log('✅ Entrou na sala do serviço!');
        notificationService.showSuccess('WebSocket', 'Pronto para chamadas com usuários reais!');
        
      } else {
        console.log('❌ Falha na conexão WebSocket');
        notificationService.showError('WebSocket', 'Falha na conexão');
      }
      
    } catch (error) {
      console.error('❌ Erro no WebSocket:', error);
      notificationService.showError('WebSocket', 'Erro: ' + (error as Error).message);
    }
  };

  // Função para forçar interface de chamada (DEBUG)
  const forceCallInterface = async () => {
    console.log('🔥 FORÇANDO INTERFACE DE CHAMADA - MODO MANUAL');
    
    try {
      // Obter stream primeiro
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log('✅ Stream obtido para debug:', stream);
      
      // Simular estado de chamada DIRETAMENTE no hook
      console.log('📞 Simulando estado de chamada...');
      
      // Tentar usar o hook normal primeiro
      if (isCallInitialized) {
        const success = await startVideoCall('debug-prestador');
        if (success) {
          console.log('✅ Hook funcionou!');
          return;
        }
      }
      
      // Se não funcionou, mostrar que precisa do WebSocket
      console.log('❌ Sistema não inicializado - precisa conectar WebSocket primeiro');
      notificationService.showError('Debug', 'WebSocket não conectado! Use o botão "Testar WebSocket" primeiro');
      
    } catch (error) {
      console.error('❌ Erro no debug:', error);
      notificationService.showError('Debug', 'Erro: ' + (error as Error).message);
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Teste de Chamadas</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-4">
        <h2 className="text-lg font-semibold mb-4">Prestador: {entregador.nome}</h2>
        
        {/* Status da inicialização */}
        <div className="mb-4 p-3 rounded-lg bg-gray-50">
          <h3 className="text-sm font-medium mb-2">Status do Sistema de Chamadas:</h3>
          <div className="text-sm space-y-1">
            <p>🆔 Service ID: {currentServiceId}</p>
            <p>🔧 Inicializado: {isCallInitialized ? '✅ Sim' : '❌ Não'}</p>
            
            <div className="border-t pt-2 mt-2">
              <p className="font-semibold text-gray-700">👥 Usuários Configurados:</p>
              <p>👤 Contratante: {localStorage.getItem('realUserName') || 'Não configurado'} (ID: {localStorage.getItem('realUserId') || 'N/A'})</p>
              <p>🎯 Prestador: {localStorage.getItem('prestadorName') || 'Não configurado'} (ID: {localStorage.getItem('prestadorId') || 'N/A'})</p>
              <p>📱 Telefones: {localStorage.getItem('realUserPhone') || 'N/A'} | {localStorage.getItem('prestadorPhone') || 'N/A'}</p>
            </div>
            
            <div className="border-t pt-2 mt-2">
              <p>📞 Estado da chamada: {callState.isInCall ? '📞 Em chamada' : callState.isIncomingCall ? '📲 Chamada recebida' : '⭕ Sem chamada'}</p>
              <p>🔗 Interface deve aparecer: {(callState.isInCall || callState.isIncomingCall) ? '✅ SIM' : '❌ NÃO'}</p>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-4 flex-wrap">
          <button 
            onClick={setupRealUsers}
            className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors flex items-center space-x-2"
          >
            <span>👥 Configurar Usuários Reais</span>
          </button>
          
          <button 
            onClick={testPermissions}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center space-x-2"
          >
            <span>🧪 Testar Permissões</span>
          </button>
          
          <button 
            onClick={testWebSocket}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
          >
            <span>🌐 Testar WebSocket</span>
          </button>
          
          <button 
            onClick={forceCallInterface}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
          >
            <span>🔥 Forçar Interface</span>
          </button>
          
          <button 
            onClick={() => {
              console.log('🔥 BOTÃO VÍDEO CLICADO!');
              handleVideoCall();
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <Video className="w-5 h-5" />
            <span>Chamada de Vídeo</span>
          </button>
          
          <button 
            onClick={() => {
              console.log('🔥 BOTÃO ÁUDIO CLICADO!');
              handleAudioCall();
            }}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
          >
            <PhoneCall className="w-5 h-5" />
            <span>Chamada de Áudio</span>
          </button>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Service ID: {currentServiceId}</p>
          <p>Inicializado: {isCallInitialized ? 'Sim' : 'Não'}</p>
          <p>Estado da chamada: {callState.isInCall ? 'Em chamada' : 'Disponível'}</p>
          <p>isInCall: {callState.isInCall ? '✅' : '❌'}</p>
          <p>isIncomingCall: {callState.isIncomingCall ? '✅' : '❌'}</p>
          <p>callType: {callState.callType || 'null'}</p>
          <p>Interface deve aparecer: {(callState.isInCall || callState.isIncomingCall) ? '✅ SIM' : '❌ NÃO'}</p>
        </div>
      </div>

      {/* Interface de Chamada */}
      {(callState.isInCall || callState.isIncomingCall) && (
        <CallInterface
          callState={callState}
          localStream={localStream}
          remoteStream={remoteStream}
          onAcceptCall={acceptCall}
          onRejectCall={rejectCall}
          onEndCall={endCall}
          onToggleVideo={toggleVideo}
          onToggleAudio={toggleAudio}
          onClose={handleCloseCall}
        />
      )}
    </div>
  );
};

export default ServiceTrackingSimple;
