import React, { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import apiClient from '../services/apiClient';

interface Props {
  children: React.ReactNode;
}

export const AxiosInterceptor: React.FC<Props> = ({ children }) => {
  const { getToken } = useAuth();

  useEffect(() => {
    // Add request interceptor to inject Clerk token
    const interceptor = apiClient.interceptors.request.use(async (config) => {
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Failed to get auth token:', error);
      }
      return config;
    });

    // Cleanup interceptor on unmount
    return () => {
      apiClient.interceptors.request.eject(interceptor);
    };
  }, [getToken]);

  return <>{children}</>;
};

export default AxiosInterceptor;
