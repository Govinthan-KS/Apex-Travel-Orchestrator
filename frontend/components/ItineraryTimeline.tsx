"use client";

import React from "react";

export interface TimelineEvent {
  status: string;
  date: string;
  icon?: string;
  color?: string;
  description: string;
}

interface ItineraryTimelineProps {
  events: TimelineEvent[];
}

export function ItineraryTimeline({ events }: ItineraryTimelineProps) {
  if (!events || events.length === 0) return null;

  return (
    <div className="relative pl-6 sm:pl-8 py-4">
      {/* The vertical line */}
      <div className="absolute left-2.5 sm:left-3.5 top-6 bottom-6 w-px bg-slate-200" />
      
      <div className="flex flex-col gap-8">
        {events.map((event, idx) => {
          // A subtle hack to see if it's the final summary node
          const isFinal = event.icon?.includes("wallet") || idx === events.length - 1;
          
          return (
            <div key={idx} className="relative">
              {/* Node Marker */}
              <div 
                className={`absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center
                  ${isFinal ? 'border-emerald-500' : 'border-indigo-500'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isFinal ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
              </div>
              
              {/* Content Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-2 mb-3">
                  <h3 className="text-lg font-semibold text-slate-900 m-0">
                    {event.status}
                  </h3>
                  <span className="text-sm font-medium text-slate-500">
                    {event.date}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed m-0 text-[15px]">
                  {event.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
