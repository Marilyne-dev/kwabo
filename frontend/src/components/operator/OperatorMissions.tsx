import React from 'react';
import { AdminRequests } from '../admin/AdminRequests';

export const OperatorMissions: React.FC = () => {
  return <AdminRequests isOperatorView={true} />;
};
