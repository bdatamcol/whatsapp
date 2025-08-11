'use client';

import SuperAdminBugReportList from '@/app/components/bug-reports/SuperAdminBugReportList';

export default function BugReportsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <SuperAdminBugReportList />
    </div>
  );
}