import React, { Suspense } from "react";
import AdminReportHistoryPage from "./AdminReportHistoryPage";

const Page = () => {
  return (
    <Suspense fallback={<div>Loading Report History...</div>}>
      <AdminReportHistoryPage />
    </Suspense>
  );
};

export default Page;
