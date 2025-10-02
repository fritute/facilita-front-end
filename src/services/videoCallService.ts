import DailyIframe from '@daily-co/daily-js';

export interface VideoCallRoom {
  url: string;
  name: string;
  created_at: string;
  expires: number;
}

class VideoCallService {
  private callObject: any = null;
  private apiKey = '90e8e2035a18ec1ca52757af3fc319bfaede817a2497aaf1f51c508d028eb681'; // Substitua pela sua chave da Daily.co

  // Criar uma sala de videochamada
  async createRoom(roomName?: string): Promise<VideoCallRoom> {
    try {
      // Criando sala usando a API key real do Daily.co
      const response = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`, // Agora usando a API key real
        },
        body: JSON.stringify({
          name: roomName || `facilita-call-${Date.now()}`,
          privacy: 'public',
          properties: {
            max_participants: 2,
            enable_chat: true,
            enable_screenshare: false,
            start_video_off: false,
            start_audio_off: false,
            exp: Math.round(Date.now() / 1000) + 3600, // Expira em 1 hora
          }
        })
      });

      if (!response.ok) {
        console.error('Erro na API Daily.co:', response.status, response.statusText);
        // Fallback: criar sala temporária
        const roomId = `facilita-${Date.now()}`;
        return {
          url: `https://facilita-app.daily.co/${roomId}`,
          name: roomId,
          created_at: new Date().toISOString(),
          expires: Date.now() + 3600000 // 1 hora
        };
      }

      const room = await response.json();
      return room;
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      // Fallback: sala temporária
      const roomId = `facilita-${Date.now()}`;
      return {
        url: `https://facilita-app.daily.co/${roomId}`,
        name: roomId,
        created_at: new Date().toISOString(),
        expires: Date.now() + 3600000
      };
    }
  }

  // Entrar em uma sala de videochamada
  async joinRoom(roomUrl: string, userName?: string): Promise<any> {
    try {
      // Criar instância do Daily
      this.callObject = DailyIframe.createCallObject({
        showLeaveButton: true,
        showFullscreenButton: true,
        showLocalVideo: true,
        showParticipantsBar: true,
      });

      // Configurar eventos
      this.setupEventListeners();

      // Entrar na sala
      await this.callObject.join({
        url: roomUrl,
        userName: userName || 'Usuário',
        videoSource: true,
        audioSource: true,
      });

      return this.callObject;
    } catch (error) {
      console.error('Erro ao entrar na sala:', error);
      throw error;
    }
  }

  // Configurar listeners de eventos
  private setupEventListeners() {
    if (!this.callObject) return;

    this.callObject
      .on('joined-meeting', (event: any) => {
        console.log('✅ Entrou na videochamada:', event);
      })
      .on('participant-joined', (event: any) => {
        console.log('👤 Participante entrou:', event.participant);
      })
      .on('participant-left', (event: any) => {
        console.log('👋 Participante saiu:', event.participant);
      })
      .on('error', (event: any) => {
        console.error('❌ Erro na videochamada:', event);
      })
      .on('left-meeting', (event: any) => {
        console.log('🚪 Saiu da videochamada:', event);
      });
  }

  // Sair da sala
  async leaveRoom(): Promise<void> {
    if (this.callObject) {
      await this.callObject.leave();
      this.callObject.destroy();
      this.callObject = null;
    }
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
}

// Exportar instância singleton
export const videoCallService = new VideoCallService();
export default videoCallService;
