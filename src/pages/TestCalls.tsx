import React from 'react';
import ServiceTrackingSimple from '../components/ServiceTrackingSimple';

const TestCalls: React.FC = () => {
  const mockEntregador = {
    nome: 'João Silva',
    telefone: '(11) 99999-9999'
  };

  return (
    <div>
      <ServiceTrackingSimple 
        serviceId="123"
        entregador={mockEntregador}
      />
    </div>
  );
};

export default TestCalls;
