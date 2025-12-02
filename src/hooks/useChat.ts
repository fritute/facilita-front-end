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
  
  console.log("🚀 [CHAT INIT] Inicializando useChat com parâmetros:", {
    userId,
    userType,
    userName,
    servicoId
  });

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

  const sendMessage = (mensagem: string, targetUserId: number) => {
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
    
    if (!socket || !isConnected) {
      console.warn("⚠️ Socket não conectado, não é possível enviar mensagem");
      return false;
    }
    
    const messageData = {
      servicoId,
      mensagem,
      sender: userType as "contratante" | "prestador",
      targetUserId
    };
    
    console.log("📤 ENVIANDO MENSAGEM PARA SERVIDOR:", messageData);
    socket.emit("send_message", messageData);
    
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
    
    console.log("📝 Adicionando mensagem local:", localMessage);
    setMessages(prev => {
      const newMessages = [...prev, localMessage];
      console.log("📚 Total de mensagens após envio:", newMessages.length);
      return newMessages;
    });
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
    simulateMessage
  };
}