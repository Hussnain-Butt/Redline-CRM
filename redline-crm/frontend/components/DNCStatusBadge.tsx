import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { dncService, DNCCheckResult } from '../services/dncService';

interface DNCStatusBadgeProps {
  phoneNumber: string;
  className?: string;
  showDetails?: boolean;
}

/**
 * DNC Status Badge Component
 * Displays visual indicator for DNC status of a phone number
 * 
 * Usage:
 * <DNCStatusBadge phoneNumber="+12025551234" showDetails={true} />
 */
export const DNCStatusBadge: React.FC<DNCStatusBadgeProps> = ({ 
  phoneNumber, 
  className = '',
  showDetails = false 
}) => {
  const [status, setStatus] = useState<DNCCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkStatus = async () => {
      if (!phoneNumber) {
        setLoading(false);
        return;
      }

      try {
        const result = await dncService.checkPhoneNumber(phoneNumber);
        if (mounted) {
          setStatus(result);
          setError(false);
        }
      } catch (err) {
        if (mounted) {
          setError(true);
          console.error('DNC check failed:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkStatus();

    return () => {
      mounted = false;
    };
  }, [phoneNumber]);

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`} title="Checking DNC status...">
        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        {showDetails && <span className="text-xs text-gray-500">Checking...</span>}
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`} title="Unable to check DNC status">
        <AlertCircle className="w-4 h-4 text-yellow-400" />
        {showDetails && <span className="text-xs text-yellow-400">Check failed</span>}
      </div>
    );
  }

  if (status.isOnDNC) {
    return (
      <div 
        className={`inline-flex items-center gap-1.5 ${className}`} 
        title={`On DNC List (${status.source}) - DO NOT CALL`}
      >
        <XCircle className="w-4 h-4 text-red-400" />
        {showDetails && (
          <span className="text-xs font-medium text-red-400">
            DNC - {status.source}
          </span>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`inline-flex items-center gap-1.5 ${className}`} 
      title="Safe to call - Not on DNC list"
    >
      <CheckCircle className="w-4 h-4 text-green-400" />
      {showDetails && <span className="text-xs text-green-400">Safe to call</span>}
    </div>
  );
};

/**
 * Compact DNC Badge (for contact lists)
 */
export const DNCBadgeCompact: React.FC<{ phoneNumber: string }> = ({ phoneNumber }) => {
  return <DNCStatusBadge phoneNumber={phoneNumber} showDetails={false} />;
};

/**
 * Detailed DNC Badge (for contact details)
 */
export const DNCBadgeDetailed: React.FC<{ phoneNumber: string }> = ({ phoneNumber }) => {
  return <DNCStatusBadge phoneNumber={phoneNumber} showDetails={true} className="py-1 px-2 bg-gray-800/50 rounded-lg" />;
};

export default DNCStatusBadge;
