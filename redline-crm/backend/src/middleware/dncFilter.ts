import { Request, Response, NextFunction } from 'express';
import { dncService } from '../modules/dnc/service.js';

/**
 * DNC Filter Middleware
 * 
 * Intercepts outbound call requests and checks if the phone number is on the DNC list.
 * Blocks the call if the number is on any DNC list (National, State, or Internal).
 * 
 * Usage: Add to call routes before Twilio API call
 * app.post('/api/calls/make', dncFilterMiddleware, callController.makeCall);
 */
export async function dncFilterMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract phone number from request body
    const { phoneNumber, to, phone } = req.body;
    const targetNumber = phoneNumber || to || phone;

    if (!targetNumber) {
      // No phone number in request, let it pass (will be caught by validation later)
      return next();
    }

    // Check if number is on DNC list
    const dncStatus = await dncService.checkPhoneNumber(targetNumber);

    if (dncStatus.isOnDNC) {
      // Number is on DNC list - block the call
      res.status(403).json({
        success: false,
        error: 'Call blocked: Phone number is on Do Not Call list',
        details: {
          phoneNumber: targetNumber,
          source: dncStatus.source,
          reason: dncStatus.reason,
          canCall: false,
        },
      });
      return;
    }

    // Number is safe to call - proceed
    next();
  } catch (error) {
    // If DNC check fails, log error but allow call to proceed
    // (Conservative approach: don't block legitimate calls due to technical errors)
    console.error('[DNC Filter] Error checking DNC status:', error);
    next();
  }
}

/**
 * Optional: Lightweight DNC check that doesn't block the request
 * Instead, adds DNC status to the request object for logging/analytics
 */
export async function dncCheckMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { phoneNumber, to, phone } = req.body;
    const targetNumber = phoneNumber || to || phone;

    if (targetNumber) {
      const dncStatus = await dncService.checkPhoneNumber(targetNumber);
      
      // Attach DNC status to request for later use
      (req as any).dncStatus = dncStatus;
    }

    next();
  } catch (error) {
    console.error('[DNC Check] Error:', error);
    next();
  }
}
