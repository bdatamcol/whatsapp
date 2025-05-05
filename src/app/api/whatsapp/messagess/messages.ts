// pages/api/messages.ts
import type { NextApiRequest, NextApiResponse } from "next";

let messagesStore: any[] = [];

export const setMessagesStore = (store: any[]) => {
  messagesStore = store;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json(messagesStore);
}
