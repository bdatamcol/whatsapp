// 'use client';

// export const whatsappService = {
//   async getContacts(): Promise<any[]> {
//     const res = await fetch('/api/whatsapp/contacts');
//     return await res.json();
//   },

//   async getMessages(contactId: string): Promise<any[]> {
//     const res = await fetch(`/api/whatsapp/messages?contact=${contactId}`);
//     return await res.json();
//   },

//   async sendMessage(to: string, text: string): Promise<any> {
//     const res = await fetch('/api/whatsapp/sendMessage', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ to, text })
//     });
//     return await res.json();
//   }
// };