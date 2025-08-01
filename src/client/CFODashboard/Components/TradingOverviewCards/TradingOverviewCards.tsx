import React from "react";
import { Calendar, TrendingUp, Clock, DollarSign, Building2 } from "lucide-react";

const TradingOverviewCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Forward Maturity Analysis Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Forward Maturity Analysis</h3>
            <p className="text-sm text-gray-500">Upcoming settlements and exposures</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Next 30 Days */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-medium text-blue-700">Next 30 Days</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">$78.4M</p>
            <p className="text-xs text-gray-600 mt-1">24 Contracts</p>
          </div>
          
          {/* 31-90 Days */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <h4 className="text-sm font-medium text-purple-700">31-90 Days</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">$124.7M</p>
            <p className="text-xs text-gray-600 mt-1">38 Contracts</p>
          </div>
          
          {/* 91-180 Days */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-medium text-emerald-700">91-180 Days</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">$89.2M</p>
            <p className="text-xs text-gray-600 mt-1">29 Contracts</p>
          </div>
          
          {/* 180+ Days */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h4 className="text-sm font-medium text-amber-700">180+ Days</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">$52.1M</p>
            <p className="text-xs text-gray-600 mt-1">16 Contracts</p>
          </div>
        </div>
      </div>

      {/* Recent Trading Activity Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Trading Activity</h3>
            <p className="text-sm text-gray-500">Last 7 Days Summary</p>
          </div>
        </div>
        
        <div className="space-y-5">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-slate-700">T</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">Total Trades</p>
              </div>
              <p className="text-xl font-bold text-gray-900">150</p>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-slate-600" />
                <p className="text-xs text-slate-600 font-medium">Total Volume</p>
              </div>
              <p className="text-xl font-bold text-gray-900">$312.8M</p>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-slate-700">A</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">Avg Trade Size</p>
              </div>
              <p className="text-xl font-bold text-gray-900">$6.7M</p>
            </div>
          </div>
          
          {/* Recent Trades */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:from-blue-100 hover:to-blue-150 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-800">USD/EUR Forward</p>
                  <p className="text-xs text-blue-600">JPMorgan</p>
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">$25.4M</p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:from-purple-100 hover:to-purple-150 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-purple-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-purple-800">GBP/USD Spot</p>
                  <p className="text-xs text-purple-600">Goldman Sachs</p>
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">$18.7M</p>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 hover:from-emerald-100 hover:to-emerald-150 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-200 rounded-full flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-800">JPY/USD Forward</p>
                  <p className="text-xs text-emerald-600">HSBC</p>
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900">$31.2M</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingOverviewCards;