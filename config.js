// ═══════════════════════════════════════════════════════
//  𝑩𝑶𝑻 𝑫𝑨𝑹𝑲 - الإعدادات
// ═══════════════════════════════════════════════════════

export const OWNER_NUMBER = '201039821496'
export const BOT_NAME = '𝑩𝑶𝑻 𝑫𝑨𝑹𝑲'
export const BOT_NAME_SHORT = '𝑫𝑨𝑹𝑲'
export const PREFIX = '.'

export const SESSION_DIR = 'session'
export const SUB_BOTS_DIR = 'sub_bots'

export const BOT_IMAGE = ''
export const WELCOME_IMAGE = 'https://file.garden/aauvg01sjleV_ic1/2B.webp'
export const GOODBYE_IMAGE = 'https://file.garden/aauvg01sjleV_ic1/8d6c229e6d9f3cf2b9fa209b08625266.jpg'
export const WELCOME_AUDIO = 'https://file.garden/aauvg01sjleV_ic1/%D8%AA%D8%B1%D8%AD%D9%8A%D8%A8.opus'

export const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Jxk4K0IBcsdKEas1P'
export const OWNER_CONTACT = 'https://wa.me/201039821496'
export const OWNER_NAME = '3MK DARK'

export const BOT_IMAGES = [
  'https://i.postimg.cc/rw2L8Wd8/IMG-20260919-WA0143.jpg',
  'https://i.postimg.cc/mZcDkYrb/images-(4).jpg',
  'https://i.postimg.cc/rFxwCqWB/images-(3).jpg',
  'https://i.postimg.cc/C5DSN4ZB/IMG-20260912-WA0003.jpg',
  'https://i.postimg.cc/wTX9R0Yj/IMG-20260920-WA0016.jpg',
  'https://i.postimg.cc/5t0JGJY6/IMG-20260919-WA0172.png'
]

export function getRandomImage() {
  return BOT_IMAGES[Math.floor(Math.random() * BOT_IMAGES.length)]
}
