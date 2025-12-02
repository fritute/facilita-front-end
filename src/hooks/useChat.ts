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

  useEffect(() => {
    // Usar URL de produção conforme documentação
    const newSocket = io("wss://facilita-c6hhb9csgygudrdz.canadacentral-01.azurewebsites.net", { 
      transports: ["websocket"],
      autoConnect: true
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
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Desconectado do WebSocket");
      setIsConnected(false);
    });

    // Receber mensagens em tempo real
    newSocket.on("receive_message", (msg: Message) => {
      console.log("📥 Mensagem recebida:", msg);
      setMessages(prev => [...prev, {
        ...msg,
        timestamp: new Date().toISOString()
      }]);
    });

    // Eventos de erro
    newSocket.on("connect_error", (error) => {
      console.error("❌ Erro de conexão:", error);
      setIsConnected(false);
    });

    return () => {
      console.log("🔌 Desconectando do WebSocket");
      newSocket.disconnect();
    };
  }, [userId, userType, userName, servicoId]);

  const sendMessage = (mensagem: string, targetUserId: number) => {
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
    
    console.log("📤 Enviando mensagem:", messageData);
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
    
    setMessages(prev => [...prev, localMessage]);
    return true;
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return { 
    messages, 
    sendMessage, 
    isConnected, 
    clearMessages,
    socket 
  };
}