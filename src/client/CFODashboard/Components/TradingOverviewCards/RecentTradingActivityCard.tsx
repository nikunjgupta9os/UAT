import React from "react";
import { TrendingUp, DollarSign, Building2 } from "lucide-react";

const RecentTradingActivityCard: React.FC = () => {
  return (
    <div className="relative bg-gradient-to-br from-[#4dc37a] to-[#478886] rounded-2xl border border-primary p-6 shadow-sm hover:shadow-md transition-shadow h-[400px] overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg className="w-full h-full" width="100%" height="100%">
          <defs>
            <pattern
              id="grid-pattern"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>
      <div className="flex items-center gap-3 mb-4 mt-4">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-green-600" />
        </div>
        <div className="text-left text-white">
          <h3 className="text-lg font-semibold">Recent Trading Activity</h3>
          <p className="text-sm">Last 7 Days Summary</p>
        </div>
      </div>

      <div className="flex gap-6 mt-10">
        {/* Stats - Left Side */}
        <div className="flex-1">
          <div className="space-y-4">
            {/* Top Row - Two cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: "Total Trades",
                  value: "150",
                  icon: <span className="text-xs font-bold text-secondary-text-dark">T</span>,
                },
                {
                  label: "Total Volume",
                  value: "$312.8M",
                  icon: <DollarSign className="w-4 h-4 text-secondary-text-dark" />,
                },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-secondary-color-dark p-4 rounded-xl border border-primary-lt shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-primary-lg border border-primary-lt rounded-full flex items-center justify-center">
                      {stat.icon}
                    </div>
                    <p className="text-xs text-secondary-text-dark font-medium">{stat.label}</p>
                  </div>
                  <p className="text-xl font-bold text-primary">{stat.value}</p>
                </div>
              ))}
            </div>
            
            {/* Bottom Row - Centered card */}
            <div className="flex justify-center">
              <div className="w-1/2">
                <div className="bg-secondary-color-dark p-4 rounded-xl border border-primary-lt">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-primary-lg border border-primary-lt rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-secondary-text-dark">A</span>
                    </div>
                    <p className="text-xs text-secondary-text-dark font-medium">Avg Trade Size</p>
                  </div>
                  <p className="text-xl font-bold text-primary">$6.7M</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Trades - Right Side */}
        <div className="flex-1 relative -top-6">
          <div className="space-y-3">
            {/* Show 3 cards with dash values if BANKS is empty, else show real trades */}
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">No Data to Display</p>
                    <p className="text-xs text-primary">N/A</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-primary">N/A</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentTradingActivityCard;
