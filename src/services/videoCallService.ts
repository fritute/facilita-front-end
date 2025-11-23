import DailyIframe from '@daily-co/daily-js';
import { notificationService } from './notificationService';

export interface VideoCallRoom {
  url: string;
  name: string;
  created_at: string;
  expires: number;
}

class VideoCallService {
  private callObject: any = null;
  private static isInstanceActive: boolean = false;

  // Criar uma sala de videochamada usando domínio público gratuito
  async createRoom(roomName?: string): Promise<VideoCallRoom> {
    try {
      // Limpar qualquer instância existente antes de criar nova
      await this.cleanup();
      
      // Usar domínio demo público do Daily.co
      const timestamp = Date.now();
      const roomId = roomName || `room-${timestamp}`;
      
      console.log('🎥 Criando sala de videochamada:', roomId);
      
      // Usar domínio demo público que funciona sem configuração
      // Simplificar o nome da sala para evitar problemas
      const simpleRoomId = `r${timestamp}`;
      const roomUrl = `https://demo.daily.co/${simpleRoomId}`;
      
      console.log('✅ Sala de videochamada criada:', roomUrl);
      
      return {
        url: roomUrl,
        name: roomId,
        created_at: new Date().toISOString(),
        expires: Date.now() + 3600000 // 1 hora
      };
    } catch (error) {
      console.error('❌ Erro ao criar sala de videochamada:', error);
      notificationService.showWarning('Videochamada', 'Criando sala temporária para videochamada.');
      
      // Fallback final: sala simples
      const fallbackTimestamp = Date.now();
      const roomId = `r${fallbackTimestamp}`;
      return {
        url: `https://demo.daily.co/${roomId}`,
        name: roomId,
        created_at: new Date().toISOString(),
        expires: Date.now() + 3600000
      };
    }
  }

  // Entrar em uma sala de videochamada usando iframe (alternativa gratuita)
  async joinRoomWithIframe(roomUrl: string, containerElement: HTMLElement, userName?: string): Promise<any> {
    try {
      // Limpar qualquer instância existente primeiro
      await this.cleanup();
      
      console.log('🎥 Criando videochamada em iframe mode:', roomUrl);
      
      // Usar iframe mode que é mais compatível com contas gratuitas
      this.callObject = DailyIframe.createFrame(containerElement, {
        url: roomUrl,
        userName: userName || 'Usuário Facilita',
        showLeaveButton: true,
        showFullscreenButton: true,
      });

      // Configurar eventos
      this.setupEventListeners();

      console.log('✅ Videochamada em iframe criada com sucesso');
      return this.callObject;
    } catch (error: any) {
      console.error('❌ Erro ao criar videochamada em iframe:', error);
      notificationService.showError('Videochamada', 'Não foi possível iniciar a videochamada.');
      throw error;
    }
  }

  // Limpar instâncias existentes
  async cleanup(): Promise<void> {
    try {
      console.log('🧹 Iniciando limpeza de instâncias Daily.co...');
      
      // Limpar nossa instância local
      if (this.callObject) {
        console.log('🔍 Encontrada instância local, limpando...');
        
        // Verificar se está em uma chamada e sair
        try {
          const meetingState = this.callObject.meetingState();
          console.log('📊 Estado da meeting:', meetingState);
          
          if (meetingState === 'joined-meeting') {
            console.log('🚪 Saindo da meeting...');
            await this.callObject.leave();
          }
        } catch (stateError) {
          console.warn('⚠️ Erro ao verificar estado da meeting:', stateError);
        }
        
        // Destruir a instância
        console.log('💥 Destruindo instância...');
        this.callObject.destroy();
        this.callObject = null;
        
        // Desmarcar flag de instância ativa
        VideoCallService.isInstanceActive = false;
        
        console.log('✅ Instância local limpa com sucesso');
      }
      
      // Verificar se há instâncias globais do Daily.co e limpá-las
      try {
        // Aguardar um pouco para garantir que a destruição foi processada
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verificar se DailyIframe tem método para limpar todas as instâncias
        if (typeof DailyIframe.getCallInstance === 'function') {
          const globalInstance = DailyIframe.getCallInstance();
          if (globalInstance) {
            console.log('🌍 Encontrada instância global, limpando...');
            try {
              await globalInstance.destroy();
            } catch (globalError) {
              console.warn('⚠️ Erro ao limpar instância global:', globalError);
            }
          }
        }
        
        console.log('✅ Limpeza completa finalizada');
      } catch (globalCleanupError) {
        console.warn('⚠️ Erro na limpeza global:', globalCleanupError);
      }
      
    } catch (error) {
      console.warn('⚠️ Erro geral ao limpar instância Daily.co:', error);
      // Forçar limpeza mesmo com erro
      this.callObject = null;
      VideoCallService.isInstanceActive = false;
    }
  }

  // Entrar em uma sala de videochamada
  async joinRoom(roomUrl: string, userName?: string): Promise<any> {
    try {
      // Verificar se já há uma instância ativa globalmente
      if (VideoCallService.isInstanceActive) {
        console.log('⚠️ Instância já ativa, aguardando limpeza...');
        await this.cleanup();
        // Aguardar um pouco mais para garantir limpeza completa
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Limpar qualquer instância existente primeiro
      await this.cleanup();
      
      console.log('🔗 Criando nova instância Daily.co...');
      
      // Marcar que uma instância está sendo criada
      VideoCallService.isInstanceActive = true;
      
      // Criar instância do Daily (call object mode - sem UI própria)
      this.callObject = DailyIframe.createCallObject({
        // Remover propriedades que não são suportadas em call object mode
        // showLeaveButton, showFullscreenButton, showLocalVideo, showParticipantsBar
        // são apenas para iframe mode
      });

      // Configurar eventos
      this.setupEventListeners();

      console.log('🔗 Tentando entrar na sala:', roomUrl);

      // Entrar na sala
      await this.callObject.join({
        url: roomUrl,
        userName: userName || 'Usuário Facilita',
        videoSource: true,
        audioSource: true,
      });

      console.log('✅ Entrou na videochamada com sucesso');
      return this.callObject;
    } catch (error: any) {
      console.error('❌ Erro ao entrar na videochamada:', error);
      
      // Tratar erros específicos
      if (error.message?.includes('account-missing-payment-method')) {
        notificationService.showError('Videochamada', 'Serviço de videochamada temporariamente indisponível. Tente novamente mais tarde.');
      } else if (error.message?.includes('room-not-found') || error.message?.includes('does not exist')) {
        notificationService.showError('Videochamada', 'Sala não encontrada. Tente criar uma nova videochamada.');
      } else if (error.errorMsg?.includes('does not exist')) {
        notificationService.showError('Videochamada', 'A sala de videochamada não existe. Tente novamente.');
      } else {
        notificationService.showError('Videochamada', 'Não foi possível entrar na videochamada. Verifique sua conexão.');
      }
      
      // Limpar call object em caso de erro
      if (this.callObject) {
        this.callObject.destroy();
        this.callObject = null;
      }
      
      // Desmarcar flag em caso de erro
      VideoCallService.isInstanceActive = false;
      
      throw error;
    }
  }

  // Configurar listeners de eventos
  private setupEventListeners() {
    if (!this.callObject) return;

    this.callObject
      .on('joined-meeting', (event: any) => {
        console.log('✅ Entrou na videochamada:', event);
        notificationService.showSuccess('Videochamada', 'Conectado com sucesso!');
      })
      .on('participant-joined', (event: any) => {
        console.log('👤 Participante entrou:', event.participant);
        notificationService.showInfo('Videochamada', `${event.participant.user_name || 'Usuário'} entrou na chamada`);
      })
      .on('participant-left', (event: any) => {
        console.log('👋 Participante saiu:', event.participant);
        notificationService.showInfo('Videochamada', `${event.participant.user_name || 'Usuário'} saiu da chamada`);
      })
      .on('error', (event: any) => {
        console.error('❌ Erro na videochamada:', event);
        
        if (event.errorMsg?.includes('account-missing-payment-method')) {
          notificationService.showError('Videochamada', 'Conta sem método de pagamento configurado. Entre em contato com o suporte.');
        } else if (event.errorMsg?.includes('room-not-found') || event.errorMsg?.includes('does not exist')) {
          notificationService.showError('Videochamada', 'A sala de videochamada não existe ou expirou. Tente criar uma nova.');
        } else {
          notificationService.showError('Videochamada', 'Ocorreu um erro durante a videochamada.');
        }
      })
      .on('left-meeting', (event: any) => {
        console.log('🚪 Saiu da videochamada:', event);
        notificationService.showInfo('Videochamada', 'Videochamada encerrada');
      });
  }

  // Sair da sala
  async leaveRoom(): Promise<void> {
    console.log('🚪 Saindo da videochamada...');
    await this.cleanup();
  }

  // Alternar câmera
  async toggleCamera(): Promise<boolean> {
    if (!this.callObject) return false;
    
    const currentState = this.callObject.localVideo();
    await this.callObject.setLocalVideo(!currentState);
    return !currentState;
  }

  // Alternar microfone
  async toggleMicrophone(): Promise<boolean> {
    if (!this.callObject) return false;
    
    const currentState = this.callObject.localAudio();
    await this.callObject.setLocalAudio(!currentState);
    return !currentState;
  }

  // Obter participantes
  getParticipants(): any[] {
    if (!this.callObject) return [];
    return Object.values(this.callObject.participants());
  }

  // Verificar se está em chamada
  isInCall(): boolean {
    return this.callObject && this.callObject.meetingState() === 'joined-meeting';
  }

  // Obter URL da sala atual
  getCurrentRoomUrl(): string | null {
    return this.callObject ? this.callObject.properties.url : null;
  }

  // Método público para limpeza (pode ser chamado externamente)
  async destroy(): Promise<void> {
    console.log('🗑️ Destruindo VideoCallService...');
    await this.cleanup();
  }
}

// Exportar instância singleton
export const videoCallService = new VideoCallService();
export default videoCallService;
