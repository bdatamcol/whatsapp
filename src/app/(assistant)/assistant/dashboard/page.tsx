//dashboard para el asistente
'use client'

import { redirect } from "next/navigation"

export default function AssistantDashboard() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="space-y-4">
        <div className="border-b">
          <div className="flex space-x-4">
            <button className="px-4 py-2 text-sm font-medium border-b-2 border-black">Overview</button>
            <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-black">Chats</button>
            <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-black">Settings</button>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium">
                  Total Chats
                </div>
              </div>
              <div className="pt-4">
                <div className="text-2xl font-bold">0</div>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium">
                  Active Users
                </div>
              </div>
              <div className="pt-4">
                <div className="text-2xl font-bold">0</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
