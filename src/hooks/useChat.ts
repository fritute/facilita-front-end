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

  // Função para buscar mensagens via HTTP (DESABILITADA - endpoint 404)
  const fetchMessagesHTTP = async () => {
    console.log('🙅 [HTTP] HTTP polling desabilitado - endpoint retorna 404');
    // Não fazer nada por enquanto, focar no Socket.IO
    return;
    
    /* CÓDIGO ORIGINAL COMENTADO - ENDPOINT RETORNA 404
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
        // ... resto do código
      }
    } catch (error) {
      console.error('❌ [HTTP FALLBACK] Erro ao buscar mensagens:', error);
    }
    */
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

    // Receber mensagens em tempo real - MÚLTIPLOS LISTENERS
    newSocket.on("receive_message", (msg: Message) => {
      console.log("📥 [RECEIVE_MESSAGE] Mensagem recebida:", msg);
      processIncomingMessage(msg);
    });
    
    // Listener adicional para new_message (que aparece nos logs)
    newSocket.on("new_message", (msg: any) => {
      console.log("📥 [NEW_MESSAGE] Mensagem recebida:", msg);
      // Converter formato se necessário
      const convertedMsg: Message = {
        servicoId: msg.servicoId || servicoId,
        mensagem: msg.mensagem || msg.message || msg.texto || '',
        sender: msg.sender || (msg.enviado_por === 'prestador' ? 'prestador' : 'contratante'),
        timestamp: msg.timestamp || msg.data_envio || new Date().toISOString(),
        userInfo: msg.userInfo || {
          userId: msg.userId || 999,
          userType: msg.userType || 'prestador',
          userName: msg.userName || 'Prestador'
        }
      };
      processIncomingMessage(convertedMsg);
    });
    
    // Função para processar mensagens recebidas
    const processIncomingMessage = (msg: Message) => {
      const newMessage: Message = {
        ...msg,
        timestamp: msg.timestamp || new Date().toISOString()
      };
      
      console.log("📝 [PROCESS] Processando mensagem:", newMessage);
      
      setMessages(prev => {
        // Evitar duplicatas
        const exists = prev.some(m => 
          m.mensagem === newMessage.mensagem && 
          m.sender === newMessage.sender &&
          Math.abs(new Date(m.timestamp || 0).getTime() - new Date(newMessage.timestamp || 0).getTime()) < 3000
        );
        
        if (exists) {
          console.log("📝 [PROCESS] Mensagem duplicada, ignorando");
          return prev;
        }
        
        console.log("📝 [PROCESS] ✅ Adicionando nova mensagem à lista!");
        const updatedMessages = [...prev, newMessage];
        console.log("📚 [PROCESS] Total de mensagens agora:", updatedMessages.length);
        return updatedMessages;
      });
    };

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
  
  // HTTP Polling DESABILITADO - endpoint retorna 404
  useEffect(() => {
    console.log('🙅 [POLLING] HTTP polling desabilitado - focando no Socket.IO que funciona');
    console.log('🔎 [DEBUG] ServiceId atual:', servicoId);
    
    // Não fazer polling HTTP por enquanto
    // O Socket.IO já está recebendo eventos 'new_message'
    
    return () => {
      console.log('📋 [CLEANUP] Limpeza do useEffect de polling');
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
    
    // HTTP backup DESABILITADO - endpoint retorna 404
    console.log("🙅 [HTTP] Backup HTTP desabilitado - usando apenas Socket.IO");
    
    /* HTTP BACKUP COMENTADO - ENDPOINT 404
    try {
      const token = localStorage.getItem('authToken');
      const httpPayload = {
        mensagem,
        tipo: 'texto',
        enviado_por: userType,
        id_servico: servicoId
      };
      // ... resto do código HTTP
    } catch (error) {
      console.error('❌ [HTTP] Erro de rede ao enviar:', error);
    }
    */
    
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
    
    // Não forçar busca HTTP - focar no Socket.IO
    console.log("📝 [SEND] Mensagem enviada, aguardando resposta via Socket.IO...");
    
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