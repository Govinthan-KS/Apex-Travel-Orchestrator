"use client";

import { Skeleton } from "primereact/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto px-4 py-6 md:py-8" style={{ maxWidth: "1200px" }}>
      {/* Header Skeleton */}
      <div className="text-center mb-6">
        <Skeleton width="18rem" height="3rem" className="mx-auto mb-3 border-round-xl" />
        <Skeleton width="24rem" height="1.5rem" className="mx-auto border-round-md" />
      </div>

      {/* Main Content Area Skeleton */}
      <div className="surface-card border-round-2xl p-4 md:p-6 shadow-2 border-1 surface-border">
        {/* Steps Skeleton */}
        <div className="flex justify-content-center mb-6">
          <div className="flex gap-4 w-full md:w-8 justify-content-between">
            <Skeleton width="6rem" height="2rem" className="border-round-xl" />
            <Skeleton width="6rem" height="2rem" className="border-round-xl" />
            <Skeleton width="6rem" height="2rem" className="border-round-xl" />
          </div>
        </div>

        {/* Input Area Skeleton */}
        <div className="mb-5">
          <Skeleton width="14rem" height="2rem" className="mb-4 border-round-md" />
          <Skeleton width="100%" height="4rem" className="border-round-xl" />
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex justify-content-between mt-6">
          <Skeleton width="6rem" height="3rem" className="border-round-lg" />
          <Skeleton width="10rem" height="3rem" className="border-round-lg" />
        </div>
      </div>
    </div>
  );
}
