import type { QueuePosition, QueueStatus, RoundStatus } from '@/types';

// Queue Position Labels (Thai)
export const POSITION_LABELS: Record<QueuePosition, string> = {
  support: 'Support',
  general: 'ทั่วไป'
};

// Queue Position Colors
export const POSITION_COLORS: Record<QueuePosition, string> = {
  support: 'bg-blue-500',
  general: 'bg-green-500'
};

// Queue Status Labels (Thai)
export const STATUS_LABELS: Record<QueueStatus, string> = {
  waiting: 'รอ',
  selected: 'ถูกสุ่ม',
  called: 'ถูกเรียก',
  serving: 'กำลังให้บริการ',
  completed: 'เสร็จสิ้น',
  no_show: 'ไม่มา',
  cancelled: 'ยกเลิก'
};

// Queue Status Colors
export const STATUS_COLORS: Record<QueueStatus, string> = {
  waiting: 'bg-yellow-500',
  selected: 'bg-purple-500',
  called: 'bg-blue-500',
  serving: 'bg-indigo-500',
  completed: 'bg-green-500',
  no_show: 'bg-red-500',
  cancelled: 'bg-gray-500'
};

// Round Status Labels (Thai)
export const ROUND_STATUS_LABELS: Record<RoundStatus, string> = {
  draft: 'ร่าง',
  open: 'เปิด',
  processing: 'กำลังดำเนินการ',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก'
};

// Round Status Colors
export const ROUND_STATUS_COLORS: Record<RoundStatus, string> = {
  draft: 'bg-gray-500',
  open: 'bg-green-500',
  processing: 'bg-blue-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500'
};

// Error Messages (Thai)
export const ERROR_MESSAGES: Record<string, string> = {
  NO_WAITING_QUEUE: 'ไม่มีคิวที่รออยู่ในขณะนี้',
  QUEUE_ALREADY_CLAIMED: 'คิวนี้ถูกจัดการโดยเจ้าหน้าที่คนอื่นแล้ว',
  ENTRY_NOT_FOUND: 'ไม่พบข้อมูลคิว',
  INVALID_STATUS: 'สถานะคิวไม่ถูกต้อง',
  ROUND_NOT_FOUND: 'ไม่พบรอบนี้',
  ROUND_NOT_ACCEPTING: 'รอบนี้ไม่เปิดรับคิวแล้ว',
  DUPLICATE_REGISTRATION: 'คุณได้ลงคิวในรอบนี้ไปแล้ว',
  UNAUTHORIZED: 'ไม่มีสิทธิ์เข้าถึง',
  NETWORK_ERROR: 'เกิดข้อผิดพลาดในการเชื่อมต่อ'
};