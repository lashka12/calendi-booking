import { httpsCallable } from 'firebase/functions';
import { functions } from './config';

// Types
export interface ServiceNames {
  en: string;
  he: string;
  ar: string;
}

export interface ServiceDescriptions {
  en?: string;
  he?: string;
  ar?: string;
}

export interface Service {
  id: string;
  names: ServiceNames;
  descriptions?: ServiceDescriptions;
  duration: number;
  price: number;
  active: boolean;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface BookingDetails {
  serviceId: string;
  date: string;
  time: string;
  clientName: string;
  phone: string;
  code: string; // OTP code - verified by the function
}

// Helper to get localized name (defaults to English)
export function getServiceName(service: Service, lang: 'en' | 'he' | 'ar' = 'en'): string {
  return service.names?.[lang] || service.names?.en || 'Unnamed';
}

// Helper to get localized description (defaults to English)
export function getServiceDescription(service: Service, lang: 'en' | 'he' | 'ar' = 'en'): string | undefined {
  return service.descriptions?.[lang] || service.descriptions?.en;
}

// API Functions
export async function getServices(): Promise<Service[]> {
  try {
    const getServicesFn = httpsCallable(functions, 'getServices');
    const result = await getServicesFn();
    return (result.data as any).services || [];
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
}

export async function getAvailableTimeSlots(date: string, serviceId: string): Promise<string[]> {
  try {
    const getSlotsFn = httpsCallable(functions, 'getAvailableTimeSlots');
    const result = await getSlotsFn({ date, serviceId });
    return (result.data as any).slots || [];
  } catch (error) {
    console.error('Error fetching time slots:', error);
    throw error;
  }
}

export async function sendOTP(phone: string): Promise<{ success: boolean; message?: string }> {
  try {
    const sendOTPFn = httpsCallable(functions, 'sendOTPWhatsApp');
    const result = await sendOTPFn({ phone });
    return result.data as { success: boolean; message?: string };
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    throw error;
  }
}

export async function verifyOTP(phone: string, code: string): Promise<{ success: boolean; message?: string }> {
  try {
    const verifyOTPFn = httpsCallable(functions, 'verifyOTPWhatsApp');
    const result = await verifyOTPFn({ phone, code });
    return result.data as { success: boolean; message?: string };
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
}

export async function createBooking(booking: BookingDetails): Promise<{ success: boolean; bookingId?: string }> {
  try {
    const createBookingFn = httpsCallable(functions, 'createPendingRequest');
    const result = await createBookingFn({
      clientName: booking.clientName,
      phone: booking.phone,
      date: booking.date,
      time: booking.time,
      serviceId: booking.serviceId,
      code: booking.code, // OTP code - verified internally by the function
    });
    return result.data as { success: boolean; bookingId?: string };
  } catch (error: any) {
    console.error('Error creating booking:', error);
    throw error;
  }
}
