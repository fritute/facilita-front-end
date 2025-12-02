import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  servicoId: number;
  mensagem: string;
  sender: "contratante" | "prestador";
  userInfo?: {
    userId: number;
    userType: string;
    userName: string;
  };
  timestamp?: string;
}

export function useChat(userId: number, userType: string, userName: string, servicoId: number) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<number>(0);
  
  console.log("🚀 [CHAT INIT] Inicializando useChat com parâmetros:", {
    userId,
    userType,
    userName,
    servicoId
  });

  // Função para buscar mensagens via HTTP (fallback)
  const fetchMessagesHTTP = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`https://facilita-c6hhb9csgygudrdz.canadacentral-01.azurewebsites.net/v1/facilita/servico/${servicoId}/mensagem`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📥 [HTTP FALLBACK] Mensagens recebidas:', data);
        
        if (data.success && Array.isArray(data.mensagens)) {
          const httpMessages: Message[] = data.mensagens.map((msg: any) => ({
            servicoId: parseInt(servicoId.toString()),
            mensagem: msg.mensagem || msg.message || '',
            sender: msg.enviado_por === 'contratante' ? 'contratante' : 'prestador',
            timestamp: msg.data_envio || msg.created_at || new Date().toISOString(),
            userInfo: {
              userId: msg.enviado_por === 'contratante' ? userId : 999,
              userType: msg.enviado_por || 'prestador',
              userName: msg.enviado_por === 'contratante' ? userName : 'Prestador'
            }
          }));
          
          setMessages(httpMessages);
          console.log(`📝 [HTTP] ${httpMessages.length} mensagens carregadas`);
        }
      }
    } catch (error) {
      console.error('❌ [HTTP FALLBACK] Erro ao buscar mensagens:', error);
    }
  };

  useEffect(() => {
    // Conectar ao servidor Socket.IO
    const newSocket = io("https://facilita-c6hhb9csgygudrdz.canadacentral-01.azurewebsites.net", { 
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 20000
    });
    
    setSocket(newSocket);

    // Eventos de conexão
    newSocket.on("connect", () => {
      console.log("🔗 Conectado ao WebSocket");
      setIsConnected(true);
      
      // Registrar usuário
      newSocket.emit("user_connected", { userId, userType, userName });
      console.log("👤 Usuário registrado:", { userId, userType, userName });

      // Entrar na sala do serviço
      newSocket.emit("join_servico", servicoId.toString());
      console.log("🏠 Entrando na sala do serviço:", servicoId);
      
      // Teste de conectividade - enviar ping após 2 segundos
      setTimeout(() => {
        console.log("🏓 Enviando ping de teste...");
        newSocket.emit("ping", { teste: true, timestamp: Date.now() });
      }, 2000);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Desconectado do WebSocket");
      setIsConnected(false);
    });

    // Receber mensagens em tempo real
    newSocket.on("receive_message", (msg: Message) => {
      console.log("📥 MENSAGEM RECEBIDA DO SERVIDOR:", {
        servicoId: msg.servicoId,
        mensagem: msg.mensagem,
        sender: msg.sender,
        userInfo: msg.userInfo
      });
      
      // Adicionar mensagem recebida à lista
      const newMessage: Message = {
        ...msg,
        timestamp: msg.timestamp || new Date().toISOString()
      };
      
      setMessages(prev => {
        // Evitar duplicatas
        const exists = prev.some(m => 
          m.mensagem === newMessage.mensagem && 
          m.sender === newMessage.sender &&
          Math.abs(new Date(m.timestamp || 0).getTime() - new Date(newMessage.timestamp || 0).getTime()) < 1000
        );
        
        if (exists) {
          console.log("📝 Mensagem duplicada, ignorando");
          return prev;
        }
        
        console.log("📝 Adicionando nova mensagem à lista");
        return [...prev, newMessage];
      });
    });

    // Eventos de erro
    newSocket.on("connect_error", (error) => {
      console.error("❌ Erro de conexão:", error);
      setIsConnected(false);
    });
    
    // Listeners para debug - capturar TODOS os eventos
    newSocket.onAny((eventName, ...args) => {
      console.log(`🔥 [SOCKET EVENT] ${eventName}:`, args);
    });
    
    // Listener específico para confirmação de envio
    newSocket.on("message_sent", (data) => {
      console.log("✅ Confirmação de envio de mensagem:", data);
    });
    
    // Listener para erros de mensagem
    newSocket.on("message_error", (error) => {
      console.error("❌ Erro ao enviar mensagem:", error);
    });

    return () => {
      console.log("🔌 Desconectando do WebSocket");
      newSocket.disconnect();
    };
  }, [userId, userType, userName, servicoId]);
  
  // Polling HTTP agressivo para garantir recebimento de mensagens
  useEffect(() => {
    if (!servicoId || servicoId === 0) return;
    
    // Buscar mensagens imediatamente
    fetchMessagesHTTP();
    
    // Polling mais frequente: a cada 2 segundos
    const interval = setInterval(() => {
      console.log('🔄 [POLLING] Buscando mensagens via HTTP...');
      fetchMessagesHTTP();
    }, 2000);
    
    // Polling adicional focado apenas em mensagens do prestador
    const prestadorPolling = setInterval(() => {
      console.log('👨‍🔧 [PRESTADOR POLLING] Verificando mensagens do prestador...');
      fetchMessagesHTTP();
    }, 1500);
    
    return () => {
      clearInterval(interval);
      clearInterval(prestadorPolling);
      console.log('🛑 [POLLING] Parando todos os pollings HTTP');
    };
  }, [servicoId]);

  const sendMessage = async (mensagem: string, targetUserId: number) => {
    console.log("🔍 [CHAT DEBUG] Tentando enviar mensagem:", {
      socketExists: !!socket,
      isConnected,
      servicoId,
      mensagem,
      userType,
      targetUserId,
      userId,
      userName
    });
    
    // Enviar via Socket.IO se conectado
    if (socket && isConnected) {
      const messageData = {
        servicoId,
        mensagem,
        sender: userType as "contratante" | "prestador",
        targetUserId
      };
      
      console.log("📤 [SOCKET] Enviando via Socket.IO:", messageData);
      socket.emit("send_message", messageData);
    }
    
    // SEMPRE enviar via HTTP como backup
    try {
      const token = localStorage.getItem('authToken');
      const httpPayload = {
        mensagem,
        tipo: 'texto',
        enviado_por: userType,
        id_servico: servicoId
      };
      
      console.log("📤 [HTTP] Enviando via HTTP:", httpPayload);
      
      const response = await fetch(`https://facilita-c6hhb9csgygudrdz.canadacentral-01.azurewebsites.net/v1/facilita/servico/${servicoId}/mensagem`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(httpPayload)
      });
      
      if (response.ok) {
        console.log("✅ [HTTP] Mensagem enviada com sucesso via HTTP");
      } else {
        console.error("❌ [HTTP] Erro ao enviar via HTTP:", response.status);
      }
    } catch (error) {
      console.error("❌ [HTTP] Erro de rede ao enviar:", error);
    }
    
    // Adicionar mensagem localmente para feedback imediato
    const localMessage: Message = {
      servicoId,
      mensagem,
      sender: userType as "contratante" | "prestador",
      timestamp: new Date().toISOString(),
      userInfo: {
        userId,
        userType,
        userName
      }
    };
    
    console.log("📝 [LOCAL] Adicionando mensagem local:", localMessage);
    setMessages(prev => {
      // Evitar duplicatas
      const exists = prev.some(m => 
        m.mensagem === localMessage.mensagem && 
        m.sender === localMessage.sender &&
        Math.abs(new Date(m.timestamp || 0).getTime() - new Date(localMessage.timestamp || 0).getTime()) < 2000
      );
      
      if (exists) {
        console.log("📝 [LOCAL] Mensagem já existe, não duplicando");
        return prev;
      }
      
      const newMessages = [...prev, localMessage];
      console.log("📚 [LOCAL] Total de mensagens:", newMessages.length);
      return newMessages;
    });
    
    // Forçar atualização das mensagens após 1 segundo
    setTimeout(fetchMessagesHTTP, 1000);
    
    return true;
  };

  const clearMessages = () => {
    setMessages([]);
  };
  
  // Função de teste para simular mensagens do prestador
  const simulateMessage = (mensagem: string, fromPrestador: boolean = true) => {
    const testMessage: Message = {
      servicoId,
      mensagem,
      sender: fromPrestador ? "prestador" : "contratante",
      timestamp: new Date().toISOString(),
      userInfo: {
        userId: fromPrestador ? 999 : userId,
        userType: fromPrestador ? "prestador" : userType,
        userName: fromPrestador ? "Prestador Teste" : userName
      }
    };
    
    console.log("🧪 [TESTE] Simulando recebimento de mensagem:", testMessage);
    setMessages(prev => [...prev, testMessage]);
  };

  return { 
    messages, 
    sendMessage, 
    isConnected, 
    clearMessages,
    socket,
    simulateMessage,
    refreshMessages: fetchMessagesHTTP
  };
}